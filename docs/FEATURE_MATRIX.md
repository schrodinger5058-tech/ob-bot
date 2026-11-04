# Feature matrix

Source: Lapis0x0/obsidian-yolo at `975018f546602544b953f9a8f2bbd217e368a37b` (v1.6.14). Paths below refer to this exact baseline. Legacy evidence refers to `legacy/v0.1.0` source preserved under `legacy/v0.1.0-src/`. Product target comes only from the supplied brief; every Grokbot visual needs user screenshots.

| Capability | YOLO (file evidence + SHA) | ob-bot v0.1.0 | Grokbot target (product brief) | New plan |
|---|---|---|---|---|
| Native chat / streaming / placements | `975018f`: src/ChatView.tsx; src/components/chat-view/Chat.tsx; src/core/agent/service.ts | Simple DOM DM + SSE | DM workspace; needs user screenshots | Keep all YOLO chat placements; bind conversations to assistants |
| Providers / model overrides | `975018f`: src/core/llm/manager.ts; src/types/assistant.types.ts | OpenAI-compatible provider | Independent bot models; needs user screenshots | Use YOLO modelId → provider mapping; no new LLM transport |
| Bot profiles / tools / skills scope | `975018f`: src/types/assistant.types.ts; src/core/skills/skillPolicy.ts; src/core/agent/tool-preferences.ts | registry.ts; permissions.ts | Bot detail editor; needs user screenshots | Reuse Assistant schema, settings persistence, policy enforcement |
| Conversation persistence | `975018f`: src/database/json/chat/ChatManager.ts; src/core/agent/conversationPersistence.ts | sessions.ts; storage.ts | Isolated DM and group runs; needs user screenshots | Persist bot → UUID bindings; retain YOLO history |
| Groups / mentions | `975018f`: src/core/agent/agent-api.ts provides separate programmatic runs; no group workspace observed | groups.ts; orchestrator.ts | Group members / lead / mentions; needs user screenshots | Add groups and bounded separate agent API calls |
| Lead / worker / merge tickets | `975018f`: src/core/agent/agent-api.ts; src/core/agent/subagent/runner.ts | orchestrator.ts validates JSON assignments | Task progress; needs user screenshots | Add persisted tickets, serial workers, one planning round |
| RAG / knowledge | `975018f`: src/core/rag/ragEngine.ts; knowledgeBaseCatalog.ts; src/database/vector-store/ | Simple note search | Knowledge scope hooks; needs user screenshots | Inherit retrieval and workspaceScope |
| Memory | `975018f`: src/core/memory/memoryStore.ts; legacyMemoryMigration.ts | History flag only | Per-bot memory controls; needs user screenshots | Inherit assistant/global memory; new flags remain documented hooks |
| MCP | `975018f`: src/core/mcp/mcpManager.ts; desktopLocalMcpServer.ts | Not implemented | Tool integrations; needs user screenshots | Keep remote MCP; desktop gate local subprocess transports |
| Vault tools / approvals | `975018f`: src/core/tools/capabilities/index.ts; src/core/tools/dispatcher.ts | tools.ts; permissions.ts | Bot tools; needs user screenshots | Keep dispatcher and approval semantics |
| Quick Ask / Sparkle | `975018f`: src/features/editor/quick-ask/; src/core/ai/single-turn.ts | Absent | Not specified; needs user screenshots | Keep unchanged |
| Modules / learning / whiteboard | `975018f`: src/core/modules/; modules/learning/; modules/whiteboard/ | Absent | Not specified; needs user screenshots | Keep module entries, builds and boundaries |
| CLI / bash / Node | `975018f`: src/core/cli-runtime/; src/utils/platform/desktopNodeModule.ts; runtime-components/bash-engine/ | Absent | Mobile + desktop; needs user screenshots | Keep desktop CLI; retain vault bash component; test platform boundaries |
| i18n / settings | `975018f`: src/core/i18n/localeStore.ts; src/i18n/locales/zh.ts; src/settings/schema/ | Mostly hardcoded UI | Simplified Chinese default; needs user screenshots | Extend typed zh/en catalogs and locale preference |
