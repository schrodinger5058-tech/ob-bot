# ob-bot architecture
Plugin Host → plain DOM ItemView and settings → Registry / SessionManager / GroupManager → Orchestrator → Executor → Provider + VaultTools → Permission gate. Domain state persists through Storage backed by Plugin.loadData/saveData.

Independent bot identity includes provider, model, prompt, params, tool allowlist, vault scope and history flag. Session keys include room and bot; DM never borrows group context. Group messages are public UI history; each executor context is private. Only human input initiates routing. An unaddressed request runs lead planning → bounded worker assignments → lead synthesis. Worker output cannot spawn work. Maximum depth one (two hops), one planning round, three workers, serial concurrency one; tool rounds bounded separately.

Tickets persist queued/running/attention/complete/failed/interrupted status, ancestry, assignment and results. Approvals are transient, fail closed on close/unload and never resume automatically. Restart marks active tickets/messages interrupted. Network cancellation and timeout bound foreground work. Snapshot writes serialize; stream checkpoints retain partial answers.

MVP task split:
1. Host + versioned storage + registry and isolated sessions.
2. Provider streaming + DM + cancellation and durable statuses.
3. Mention routing + groups + planner/worker/synthesizer tickets.
4. Scoped vault read/search/create/append/edit + exact-write preview.
5. Mobile UI, settings, tests, production bundle and installation docs.

Deferred: background execution, recursive delegation, vector memory, attachments, native Anthropic/Gemini protocols, multi-device conflict resolution, encrypted key storage and automatic write recovery. iPhone needs actual device verification.
