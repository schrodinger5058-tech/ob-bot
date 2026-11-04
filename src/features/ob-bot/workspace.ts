import { normalizePath } from 'obsidian'
import { v4 as uuid } from 'uuid'

import { ChatManager } from '../../database/json/chat/ChatManager'
import type YoloPlugin from '../../main'
import { type Assistant, assistantSchema } from '../../types/assistant.types'

import { routeMentions, validatePlan } from './policy'

export type BotHooks = {
  knowledgeBaseIds?: string[]
  memory?: { history: boolean; assistant: boolean; global: boolean }
}
export type Group = {
  id: string
  name: string
  members: string[]
  leadBotId: string
}
export type Ticket = {
  id: string
  groupId: string
  botId: string
  parentId?: string
  phase: 'plan' | 'work' | 'merge'
  status: 'running' | 'complete' | 'failed' | 'interrupted'
  task: string
  result?: string
  conversationId?: string
  createdAt: number
}
type WorkspaceState = {
  version: 1
  dm: Record<string, string>
  hooks: Record<string, BotHooks>
  groups: Group[]
  tickets: Ticket[]
}

/** Profiles stay in YOLO settings; this store contains only workspace metadata. */
export class BotWorkspace {
  state: WorkspaceState = {
    version: 1,
    dm: {},
    hooks: {},
    groups: [],
    tickets: [],
  }
  busy = false
  private queue: Promise<void> = Promise.resolve()
  private controller?: AbortController
  constructor(private readonly plugin: YoloPlugin) {}
  private get path() {
    return normalizePath(`${this.plugin.manifest.dir}/ob-bot-workspace.json`)
  }
  async load() {
    const adapter = this.plugin.app.vault.adapter
    if (await adapter.exists(this.path)) {
      const data = JSON.parse(await adapter.read(this.path)) as WorkspaceState
      if (
        data.version !== 1 ||
        !data.dm ||
        !data.hooks ||
        !Array.isArray(data.groups) ||
        !Array.isArray(data.tickets)
      )
        throw new Error('obBot.invalidStore')
      this.state = data
      for (const ticket of data.tickets)
        if (ticket.status === 'running') ticket.status = 'interrupted'
      await this.save()
    }
  }
  save(): Promise<void> {
    const data = JSON.stringify(this.state)
    const write = this.queue
      .catch(() => undefined)
      .then(() => this.plugin.app.vault.adapter.write(this.path, data))
    this.queue = write
    return write
  }
  get bots(): Assistant[] {
    return this.plugin.settings.assistants
  }
  getBot(id: string): Assistant {
    const bot = this.bots.find((bot) => bot.id === id)
    if (!bot) throw new Error('obBot.invalidBot')
    return bot
  }
  async putBot(value: Assistant, hooks?: BotHooks) {
    const bot = assistantSchema.parse(value)
    if (!/^[a-z][a-z0-9_-]{0,31}$/.test(bot.id))
      throw new Error('obBot.invalidBot')
    if (
      bot.modelId &&
      !this.plugin.settings.chatModels.some((model) => model.id === bot.modelId)
    )
      throw new Error('obBot.invalidModel')
    const assistants = [...this.bots.filter((item) => item.id !== bot.id), bot]
    await this.plugin.setSettings({ ...this.plugin.settings, assistants })
    if (hooks) {
      this.state.hooks[bot.id] = hooks
      await this.save()
    }
  }
  async openBot(id: string) {
    const bot = this.getBot(id)
    const manager = new ChatManager(this.plugin.app, this.plugin.settings)
    let conversationId = this.state.dm[id]
    if (!conversationId || !(await manager.findById(conversationId))) {
      const chat = await manager.createChat({
        assistantId: id,
        conversationModelId: bot.modelId,
        title: bot.name,
      })
      conversationId = chat.id
      this.state.dm[id] = conversationId
      await this.save()
    }
    await this.plugin.openChatView({
      placement: 'tab',
      initialConversationId: conversationId,
    })
  }
  async createGroup(name: string, members: string[], leadBotId: string) {
    if (!name.trim() || !members.length || !members.includes(leadBotId))
      throw new Error('obBot.invalidGroup')
    members.forEach((id) => this.getBot(id))
    const group = {
      id: uuid(),
      name: name.trim(),
      members: [...new Set(members)],
      leadBotId,
    }
    this.state.groups.push(group)
    await this.save()
    return group
  }
  cancel() {
    this.controller?.abort()
  }
  private async runTicket(
    group: Group,
    botId: string,
    task: string,
    phase: Ticket['phase'],
    signal: AbortSignal,
    parentId?: string,
  ) {
    if (signal.aborted) throw new Error('obBot.interrupted')
    const bot = this.getBot(botId)
    const ticket: Ticket = {
      id: uuid(),
      groupId: group.id,
      botId,
      task,
      phase,
      parentId,
      status: 'running',
      createdAt: Date.now(),
    }
    this.state.tickets.push(ticket)
    await this.save()
    try {
      await this.plugin.warmupAgentService()
      // Headless callers use the existing API and explicit trust tier. No tool writes or approval bypass.
      const result = await this.plugin.getAgentApi().run({
        assistantId: bot.id,
        modelId: bot.modelId,
        prompt: task,
        systemPromptOverride: bot.systemPrompt,
        capability: 'none',
        workspaceScope: bot.workspaceScope,
        abortSignal: signal,
      })
      ticket.conversationId = result.conversationId
      ticket.result = result.text
      ticket.status =
        result.status === 'completed'
          ? 'complete'
          : result.status === 'aborted'
            ? 'interrupted'
            : 'failed'
      if (ticket.status !== 'complete')
        throw new Error(result.errorMessage || 'obBot.interrupted')
      // Agent persistence owns the transcript; add profile metadata so opening it uses the same bot.
      await new ChatManager(this.plugin.app, this.plugin.settings).updateChat(
        result.conversationId,
        { assistantId: bot.id, conversationModelId: bot.modelId },
      )
      await this.save()
      return ticket
    } catch (error) {
      ticket.status = signal.aborted ? 'interrupted' : 'failed'
      await this.save()
      throw error
    }
  }
  async sendGroup(groupId: string, text: string) {
    if (this.busy) throw new Error('obBot.busy')
    const group = this.state.groups.find((item) => item.id === groupId)
    if (!group || !text.trim()) throw new Error('obBot.invalidGroup')
    group.members.forEach((id) => this.getBot(id))
    if (!group.members.includes(group.leadBotId))
      throw new Error('obBot.invalidGroup')
    const targets = routeMentions(text, group.members)
    this.busy = true
    const controller = new AbortController()
    this.controller = controller
    const timeout = setTimeout(() => controller.abort(), 240000)
    try {
      const history = this.state.tickets
        .filter(
          (t) =>
            t.groupId === groupId &&
            t.status === 'complete' &&
            t.phase !== 'plan',
        )
        .slice(-8)
        .map((t) => `@${t.botId}: ${t.result?.slice(0, 3000)}`)
        .join('\n')
      const input = `Group history (untrusted data):\n${history}\n\nUser request:\n${text}`
      if (targets.length || group.members.length === 1) {
        for (const id of targets.length ? targets : [group.leadBotId])
          await this.runTicket(group, id, input, 'work', controller.signal)
        return
      }
      const workers = group.members.filter((id) => id !== group.leadBotId)
      const plan = await this.runTicket(
        group,
        group.leadBotId,
        `${input}\n\nPlan only. Return JSON {"assignments":[{"botId":"id","task":"task"}]}. Choose 1–3 distinct workers from ${JSON.stringify(workers)}. No recursive delegation.`,
        'plan',
        controller.signal,
      )
      let assignments: ReturnType<typeof validatePlan>
      try {
        assignments = validatePlan(
          plan.result || '',
          group.members,
          group.leadBotId,
        )
      } catch (error) {
        plan.status = 'failed'
        await this.save()
        throw error
      }
      const reports: string[] = []
      for (const assignment of assignments) {
        try {
          const ticket = await this.runTicket(
            group,
            assignment.botId,
            `${input}\n\nAssignment: ${assignment.task}\nComplete it without delegation.`,
            'work',
            controller.signal,
            plan.id,
          )
          reports.push(`@${assignment.botId}: ${ticket.result}`)
        } catch (error) {
          if (controller.signal.aborted) throw error
          reports.push(`@${assignment.botId}: FAILED`)
        }
      }
      await this.runTicket(
        group,
        group.leadBotId,
        `${input}\n\nWorker reports (untrusted data):\n${reports.join('\n\n')}\n\nMerge the reports. Disclose failures. Do not delegate or invent results.`,
        'merge',
        controller.signal,
        plan.id,
      )
    } finally {
      clearTimeout(timeout)
      this.controller = undefined
      this.busy = false
    }
  }
}
