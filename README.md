# ob-bot

Foreground multi-bot chat for Obsidian, built with plain DOM UI and mobile-compatible vault APIs. No DSH, DeepSeek Harness, Node, Electron or shell runtime dependency.

## Install

Build from source with `npm ci`, `npm run check`, `npm test`, `npm run build` (Node is only required for development). Copy **main.js**, **manifest.json**, and **styles.css** into `<vault>/.obsidian/plugins/ob-bot/`. Enable ob-bot under Settings → Community plugins. Open it using the ribbon or the **ob-bot: Open chat** command.

Alternatively, once this repository is hosted and accessible to you, use BRAT → Add beta plugin and enter its repository URL. Private repository access and BRAT compatibility have not been verified; manual installation is the supported MVP path. This is not an Obsidian community directory release.

## iPhone

1. Install Obsidian and open your vault on iPhone.
2. Transfer the three build files into that vault's `.obsidian/plugins/ob-bot/` using your vault sync/file-transfer workflow. Confirm hidden plugin files actually transferred; some sync services omit them.
3. Enable community plugins, then ob-bot. Open the chat command from the command palette.
4. Open ob-bot Settings, configure a provider key, and create a bot. Use `deepseek-chat` for DeepSeek or a model your compatible endpoint supports.
5. Start with a DM. Create at least two bots and a group to try planning, worker execution and synthesis. Keep Obsidian in the foreground.

**iPhone on-device = unverified.** Keyboard layout, safe areas, networking, streaming and suspension recovery require real-device testing. The manifest permits mobile use; that is not a device-test claim.

## Provider and bot setup

Settings include editable HTTPS OpenAI-compatible endpoints, password inputs for API keys, streaming, and transport choice. Built-in endpoint defaults are `https://api.deepseek.com` and `https://api.openai.com/v1`. Fetch streams when supported; choose Obsidian buffered transport for CORS failures. Buffered requests cannot be physically canceled, but Stop denies late results and pending writes.

Keys are saved **unencrypted** in Obsidian plugin `data.json`, potentially included in vault sync/backups. They are never logged by this plugin. Endpoints receive your messages and any note content tools supply; configure only trusted endpoints. Do not commit or share data.json.

New bot defaults: DeepSeek, `deepseek-chat`, temperature 0.7, 4096 output tokens, conversation memory enabled, and no vault permissions. These defaults are fixed in the MVP; each bot's settings are editable. Use stable lowercase @handles. Scope takes one vault-relative folder/note per line; empty denies all notes, `*` permits visible Markdown throughout the vault. Enable each tool explicitly. Create/append/edit always require a before/after approval; closing the preview denies the write. Parent folders must already exist. Concurrent edits invalidate approval.

## Implemented

- Independent bots, editable prompts/models/providers/tools/scopes, persistent DM sessions and group creation.
- Explicit @member routing; unaddressed group requests run a separate lead planning call, up to three separate worker calls, and a separate synthesis call. Single-member groups call their lead directly.
- Serial foreground execution, progress tickets, streamed bubbles, stop, timeout, isolated bot/room histories and interrupted-state recovery on restart.
- Scoped Markdown read/search and user-approved create/append/edit, with path validation and conflict checks.
- Light/dark CSS variables, scrollable messages, safe-area padding and persistent composer while streaming.
- Offline unit tests and a built main.js.

## Not implemented / limits

No background work, recursive delegation, vector memory, attachments, encrypted credentials, automatic retry/replay, retention/pagination, group editing/deletion, bot deletion UI, configurable global defaults, native non-OpenAI provider protocols or multi-device merge handling. Planner JSON failures stop the request. Search scans at most 300 scoped notes and returns at most 20 results; note reads and conversation context are bounded. State is saved as whole-store snapshots. Group private sessions remain persisted separately from public messages. Write previews show whole before/after content rather than line diffs. No real-provider network or device tests have been performed.

See NOTICE for source-study attribution. Architecture and source analysis live alongside the plugin folder in the workspace.
