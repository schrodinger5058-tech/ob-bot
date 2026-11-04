# YOLO direction reset — review handoff

YOLO baseline: `975018f546602544b953f9a8f2bbd217e368a37b` (v1.6.14), copied from the unchanged `yolo-baseline` checkout. Active branch: `refactor/yolo-base`. Legacy release tag `v0.1.0` remains `603d0de4671aea47419685699064407575dfaeca`; remote legacy branch is preserved. This is a full YOLO derivative, not the old MVP with a new UI.

## What is implemented

- Full YOLO source tree, LICENSE, modules, runtime components, provider stack, RAG, memory, skills, MCP, Quick Ask, Sparkle and native/CLI chat entries retained.
- ob-bot identity, version 0.2.0-dev, attribution NOTICE with upstream funding links, isolated default managed root/sync pointer/vector prefix/native chat view ID. Compatible upstream module/runtime distribution remains; upstream core self-update is disabled to prevent replacing the derivative with YOLO.
- `src/features/ob-bot/`: persistent workspace with YOLO Assistant registry, name/avatar/system prompt/model → provider mapping, existing tool/skill/workspace scope policies. Profiles persist through YOLO settings; DM/group/ticket metadata uses serialized plugin-directory JSON writes.
- Command **机器人工作区 / Bot workspace** opens a native Obsidian view. Create/edit profiles, select configured model, open/resume a stable per-bot YOLO conversation. Advanced profile configuration remains in inherited assistant settings. Conversation assistantId/model bindings feed native ChatView → AgentSessionService.
- Group creation with explicit members and lead. `@handle` invokes each addressed member in a distinct AgentRunApi run; unaddressed messages invoke lead JSON planning, up to three distinct workers, then lead merge. AgentRunApi uses the same AgentSessionService/NativeAgentRuntime. No second LLM stack.
- Serial execution (concurrency one), one planning round, two delegation hops, invalid plan rejection, four-minute abort timer, cancellation, per-run conversation IDs, persisted tickets and interrupted recovery on reload. Bounded prior ticket reports provide group context. Partial worker failures reach the merge.
- zh/en strings extend existing typed catalogs; Chinese default locale preference with English/system options in the workspace, applied on reload. English fallback supports new keys under partial locales.

## Runnable versus limited

Native bot-bound chat and the group paths are implemented and compile; mocked integration tests confirm bindings, separate runs and persistence. Actual LLM calls need user-configured YOLO providers/models and have not been exercised here. Group runs intentionally use capability `none` (no tools); native DM retains YOLO tools and approvals. Group task results are shown after execution or refresh rather than as a streaming shared timeline. Cancellation is wired; rich task attention/retry/resume controls are future work.

Knowledge-base IDs and memory flags are stored extension hooks, not enforced new policy. Existing Assistant workspaceScope/tool/skill controls remain the actual policy path. No automatic legacy importer, unified settings redesign, or Grokbot pixel layout is claimed. Optional upstream modules retain their view/file-extension identifiers; enabling identical modules in both YOLO and ob-bot needs coexistence work/testing.

## Validation

`npm ci`, approved install scripts + `npm rebuild`, full `npm run build` including host/module/runtime type checking and runtime boundary verification: PASS. Six focused Jest suites: 45 tests PASS. ESLint on touched feature/runtime integration files: PASS. See BUILD_STATUS.md for exact commands, intermediate corrections, scope and limitations. `main.js`, `styles.css`, `manifest.json` are ready in the project root; generated assets are not committed, following YOLO policy. No full-suite pass is claimed.

## Legacy v0.1.0 migration design

Importer is not implemented. Back up the complete old plugin directory/data.json before replacing it. Never pass the old MVP object directly into YOLO's settings migration or overwrite it without a backup.

1. Detect legacy version-1 object by bots/providers/groups/sessions/tickets shape; validate before writing. Keep import explicit and repeatable with an import fingerprint and old→new ID maps.
2. Map providers to existing YOLO providers or create them through YOLO settings; transfer credentials locally only with explicit import, never into workspace metadata or logs. Map raw legacy model names to configured YOLO chatModel IDs, preserving provider linkage.
3. Convert bots to Assistant records: ID/name/systemPrompt/modelId, color avatar to an available icon plus retained legacy metadata, toolPermissions to explicit native capability preferences, vaultScope to workspaceScope.include, memory.history to the new hook. Unknown tool mappings must be disabled pending review rather than widened.
4. Create UUID ChatManager conversations for each DM and (group,bot) legacy session. Convert messages into YOLO serialized message structures, retain original timestamps/IDs as migration metadata, and persist the assistantId binding. Keep original transcripts as immutable backup; do not fabricate missing tool traces.
5. Import groups with validated existing members/lead and new UUID mapping. Import ticket ancestry/status/results; mark formerly running work interrupted, never auto-replay provider calls or writes.
6. Write a staging store, validate references and sample transcript roundtrips, then switch to the new store. Keep a migration report and rollback copy. Cross-device sync conflict behavior needs a separate design/test pass.

## Human inputs and device evidence

Grokbot home, DM, group, bot detail, settings and tasks: **needs user screenshots**. No proprietary visual details were invented. The original exact ten acceptance bullets are unavailable; ACCEPTANCE.md explicitly uses a provisional ten-category mapping from this reset request.

**iPhone on-device unverified.** Remote MCP is disabled on mobile in the inherited baseline. Streaming/network transports, keyboard/safe-area behavior, WASM/IndexedDB pressure, suspension recovery, CLI gates, module coexistence and Obsidian popout behavior require real application/device tests.
