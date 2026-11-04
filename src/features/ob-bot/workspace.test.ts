jest.mock('../../database/json/chat/ChatManager', () => ({
  ChatManager: jest.fn(),
}))

import { ChatManager } from '../../database/json/chat/ChatManager'
import type YoloPlugin from '../../main'

import { BotWorkspace } from './workspace'

function fixture() {
  const files = new Map<string, string>()
  const chats = new Map<string, unknown>()
  const createChat = jest.fn(async (data: object) => {
    const chat = { ...data, id: `chat-${chats.size}` }
    chats.set(chat.id, chat)
    return chat
  })
  const updateChat = jest.fn(async () => null)
  ;(ChatManager as unknown as jest.Mock).mockImplementation(() => ({
    createChat,
    findById: async (id: string) => chats.get(id),
    updateChat,
  }))
  let runCount = 0
  const run = jest.fn(
    async (request: { assistantId: string; prompt: string }) => ({
      conversationId: `run-${++runCount}`,
      status: 'completed',
      text: request.prompt.includes('Plan only.')
        ? '{"assignments":[{"botId":"worker","task":"analyze"}]}'
        : `${request.assistantId} result`,
    }),
  )
  const plugin = {
    manifest: { dir: 'test-config/plugins/ob-bot' },
    app: {
      vault: {
        adapter: {
          exists: async (path: string) => files.has(path),
          read: async (path: string) => files.get(path),
          write: async (path: string, data: string) => {
            files.set(path, data)
          },
        },
      },
    },
    settings: {
      assistants: [
        { id: 'lead', name: 'Lead', systemPrompt: 'lead prompt' },
        { id: 'worker', name: 'Worker', systemPrompt: 'worker prompt' },
      ],
      chatModels: [],
    },
    warmupAgentService: jest.fn(async () => undefined),
    getAgentApi: () => ({ run }),
    openChatView: jest.fn(async () => undefined),
  } as unknown as YoloPlugin
  return { plugin, run, createChat, updateChat, files }
}

describe('YOLO workspace integration', () => {
  it('restores stable per-bot native conversation IDs and assistant bindings', async () => {
    const { plugin, createChat } = fixture()
    const workspace = new BotWorkspace(plugin)
    await workspace.openBot('lead')
    const restored = new BotWorkspace(plugin)
    await restored.load()
    await restored.openBot('lead')
    await restored.openBot('worker')
    expect(createChat).toHaveBeenCalledTimes(2)
    expect(createChat.mock.calls[0][0]).toMatchObject({ assistantId: 'lead' })
    expect(restored.state.dm.lead).not.toBe(restored.state.dm.worker)
  })
  it('executes lead, worker and merge as separate YOLO calls and persists their IDs', async () => {
    const { plugin, run } = fixture()
    const workspace = new BotWorkspace(plugin)
    const group = await workspace.createGroup(
      'Team',
      ['lead', 'worker'],
      'lead',
    )
    await workspace.sendGroup(group.id, 'Analyze this')
    expect(run.mock.calls.map(([request]) => request.assistantId)).toEqual([
      'lead',
      'worker',
      'lead',
    ])
    expect(workspace.state.tickets.map((t) => t.phase)).toEqual([
      'plan',
      'work',
      'merge',
    ])
    expect(
      new Set(workspace.state.tickets.map((t) => t.conversationId)).size,
    ).toBe(3)
    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        capability: 'none',
        systemPromptOverride: 'worker prompt',
      }),
    )
    const restored = new BotWorkspace(plugin)
    await restored.load()
    expect(restored.state.tickets).toEqual(workspace.state.tickets)
  })
  it('routes a mention to exactly that bot and stops invalid plans before workers', async () => {
    const { plugin, run } = fixture()
    const workspace = new BotWorkspace(plugin)
    const group = await workspace.createGroup(
      'Team',
      ['lead', 'worker'],
      'lead',
    )
    await workspace.sendGroup(group.id, '@worker hello')
    expect(run).toHaveBeenCalledTimes(1)
    expect(run.mock.calls[0][0].assistantId).toBe('worker')
    run.mockResolvedValueOnce({
      conversationId: 'bad',
      status: 'completed',
      text: '{"assignments":[{"botId":"outsider","task":"x"}]}',
    })
    await expect(workspace.sendGroup(group.id, 'plan')).rejects.toThrow(
      'obBot.invalidPlan',
    )
    expect(run).toHaveBeenCalledTimes(2)
    expect(workspace.busy).toBe(false)
    expect(workspace.state.tickets[1].status).toBe('failed')
  })
})
