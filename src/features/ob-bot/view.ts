import { ItemView, Modal, Notice, Setting, type WorkspaceLeaf } from 'obsidian'

import type YoloPlugin from '../../main'
import type { Assistant } from '../../types/assistant.types'

import { BotWorkspace } from './workspace'

export const BOT_WORKSPACE_VIEW = 'ob-bot-workspace'

export class BotWorkspaceView extends ItemView {
  constructor(
    leaf: WorkspaceLeaf,
    private plugin: YoloPlugin,
    private workspace: BotWorkspace,
  ) {
    super(leaf)
  }
  getViewType() {
    return BOT_WORKSPACE_VIEW
  }
  getDisplayText() {
    return this.plugin.t('obBot.title')
  }
  getIcon() {
    return 'bot'
  }
  async onOpen() {
    this.render()
  }
  private action(
    parent: HTMLElement,
    key: string,
    work: () => Promise<unknown>,
  ) {
    const button = parent.createEl('button', { text: this.plugin.t(key) })
    button.onclick = () => {
      void work()
        .then(() => this.render())
        .catch((error) => this.showError(error))
    }
    return button
  }
  private showError(error: unknown) {
    const message = error instanceof Error ? error.message : 'obBot.failed'
    new Notice(
      message.startsWith('obBot.')
        ? this.plugin.t(message)
        : this.plugin.t('obBot.failed'),
    )
  }
  private editBot(bot?: Assistant) {
    const modal = new Modal(this.app)
    const t = this.plugin.t
    const value: Assistant = bot
      ? { ...bot }
      : { id: '', name: '', systemPrompt: '' }
    modal.titleEl.setText(t(bot ? 'obBot.editBot' : 'obBot.createBot'))
    new Setting(modal.contentEl).setName(t('obBot.handle')).addText((input) => {
      input
        .setValue(value.id)
        .setDisabled(!!bot)
        .onChange((text) => {
          value.id = text.trim()
        })
    })
    new Setting(modal.contentEl).setName(t('obBot.name')).addText((input) =>
      input.setValue(value.name).onChange((text) => {
        value.name = text
      }),
    )
    new Setting(modal.contentEl)
      .setName(t('obBot.prompt'))
      .addTextArea((input) =>
        input.setValue(value.systemPrompt).onChange((text) => {
          value.systemPrompt = text
        }),
      )
    new Setting(modal.contentEl)
      .setName(t('obBot.model'))
      .addDropdown((input) => {
        input.addOption('', t('obBot.defaultModel'))
        for (const model of this.plugin.settings.chatModels)
          input.addOption(model.id, model.id)
        input.setValue(value.modelId || '').onChange((id) => {
          value.modelId = id || undefined
        })
      })
    this.action(modal.contentEl, 'common.save', async () => {
      await this.workspace.putBot(value)
      modal.close()
    })
    modal.open()
  }
  private editGroup() {
    const modal = new Modal(this.app)
    const t = this.plugin.t
    let name = ''
    let lead = this.workspace.bots[0]?.id || ''
    const members = new Set<string>()
    modal.titleEl.setText(t('obBot.createGroup'))
    new Setting(modal.contentEl).setName(t('obBot.name')).addText((input) =>
      input.onChange((text) => {
        name = text
      }),
    )
    for (const bot of this.workspace.bots)
      new Setting(modal.contentEl).setName(bot.name).addToggle((input) =>
        input.onChange((enabled) => {
          if (enabled) members.add(bot.id)
          else members.delete(bot.id)
        }),
      )
    new Setting(modal.contentEl)
      .setName(t('obBot.lead'))
      .addDropdown((input) => {
        for (const bot of this.workspace.bots) input.addOption(bot.id, bot.name)
        input.setValue(lead).onChange((id) => {
          lead = id
        })
      })
    this.action(modal.contentEl, 'common.save', async () => {
      await this.workspace.createGroup(name, [...members], lead)
      modal.close()
    })
    modal.open()
  }
  private render() {
    const root = this.contentEl
    const t = this.plugin.t
    root.empty()
    root.addClass('yolo-ob-bot-workspace')
    root.createEl('h2', { text: t('obBot.title') })
    new Setting(root).setName(t('obBot.language')).addDropdown((input) => {
      input
        .addOption('zh', '简体中文')
        .addOption('en', 'English')
        .addOption('system', t('obBot.systemLanguage'))
      input.setValue(this.plugin.settings.obBotLocale).onChange((locale) => {
        void this.plugin
          .setSettings({
            ...this.plugin.settings,
            obBotLocale: locale as 'zh' | 'en' | 'system',
          })
          .then(() => new Notice(t('obBot.restartLanguage')))
          .catch((error) => this.showError(error))
      })
    })
    this.action(root, 'obBot.createBot', async () => this.editBot())
    root.createEl('p', { text: t('obBot.profileHint') })
    for (const bot of this.workspace.bots) {
      const row = root.createDiv()
      row.createEl('h3', {
        text: `${bot.icon?.type === 'emoji' ? bot.icon.value : '🤖'} ${bot.name} · @${bot.id}`,
      })
      this.action(row, 'obBot.openChat', () => this.workspace.openBot(bot.id))
      this.action(row, 'obBot.editBot', async () => this.editBot(bot))
    }
    root.createEl('h2', { text: t('obBot.groups') })
    this.action(root, 'obBot.createGroup', async () => this.editGroup())
    for (const group of this.workspace.state.groups) {
      const row = root.createDiv()
      row.createEl('h3', { text: group.name })
      row.createEl('p', { text: group.members.map((id) => `@${id}`).join(' ') })
      const input = row.createEl('textarea', {
        attr: { placeholder: t('obBot.groupPrompt'), rows: '3' },
      })
      const button = this.action(row, 'obBot.send', async () => {
        button.disabled = true
        try {
          await this.workspace.sendGroup(group.id, input.value)
        } finally {
          this.render()
        }
      })
      button.disabled = this.workspace.busy
    }
    this.action(root, 'obBot.cancel', async () => this.workspace.cancel())
    this.action(root, 'obBot.refresh', async () => undefined)
    root.createEl('h2', { text: t('obBot.tasks') })
    for (const ticket of [...this.workspace.state.tickets]
      .reverse()
      .slice(0, 40)) {
      const card = root.createDiv()
      card.createEl('h4', {
        text: `@${ticket.botId} · ${t(`obBot.${ticket.phase}`)} · ${t(`obBot.${ticket.status}`)}`,
      })
      card.createEl('p', { text: ticket.result || ticket.task })
      if (ticket.conversationId)
        this.action(card, 'obBot.openChat', () =>
          this.plugin.openChatView({
            initialConversationId: ticket.conversationId,
          }),
        )
    }
  }
}

export async function registerBotWorkspace(plugin: YoloPlugin) {
  const workspace = new BotWorkspace(plugin)
  await workspace.load()
  plugin.register(() => workspace.cancel())
  plugin.registerView(
    BOT_WORKSPACE_VIEW,
    (leaf) => new BotWorkspaceView(leaf, plugin, workspace),
  )
  plugin.addCommand({
    id: 'open-bot-workspace',
    name: plugin.t('obBot.title'),
    callback: () => {
      void (async () => {
        const leaf =
          plugin.app.workspace.getLeavesOfType(BOT_WORKSPACE_VIEW)[0] ||
          plugin.app.workspace.getLeaf('tab')
        await leaf.setViewState({ type: BOT_WORKSPACE_VIEW, active: true })
        await plugin.app.workspace.revealLeaf(leaf)
      })().catch(() => new Notice(plugin.t('obBot.failed')))
    },
  })
}
