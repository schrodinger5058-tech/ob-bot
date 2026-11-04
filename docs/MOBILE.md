# Mobile boundaries

| Surface | iPhone plan | Evidence / caveat |
|---|---|---|
| Native chat, bot list, JSON persistence | Reuse Obsidian APIs | ChatView, ChatManager; on-device unverified |
| Remote providers / MCP | Network and credentials required | core/llm, core/mcp; CORS/transport/device tests required |
| RAG / memory / skills | Keep implementation | IndexedDB, runtime downloads, WebGPU/WASM need device tests |
| Vault bash | Retain runtime-component implementation | Distinct from OS terminal; device/WASM unverified |
| External CLI / Node / local MCP subprocess | Desktop gated | core/cli-runtime/desktop.ts, mcp platform checks; remote service needed for mobile equivalent |
| Groups / orchestration | Foreground native runs | Background suspension can interrupt; persisted tickets report interruption on reload |

iPhone on-device unverified. Do not infer compatibility from isDesktopOnly:false or compilation. No desktop modules are deleted.
