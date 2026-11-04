# Build status

Validated in this Linux workspace on 2026-11-04. Baseline: `975018f546602544b953f9a8f2bbd217e368a37b`.

| Command | Result |
|---|---|
| `npm ci --no-audit --no-fund` | PASS, 1385 packages; deprecated dependency warnings inherited |
| `npm install-scripts approve esbuild sharp @mongodb-js/zstd onnxruntime-node protobufjs workerd` | Approved dependency install scripts; persisted npm allowScripts policy |
| `npm rebuild --no-audit --no-fund` | PASS |
| `npm run build` | PASS after correcting TypeScript types in the new test fixture |
| Build stages | Host tsc, module:typecheck, runtime:typecheck, styles:build, runtime:build, module:build, production esbuild, runtime:verify all PASS |
| `npx jest src/features/ob-bot src/core/agent/agent-api.test.ts src/core/i18n/localeStore.test.ts src/features/chat/chatViewNavigator.test.ts src/core/update/pluginUpdater.test.ts --runInBand` | PASS: 6 suites, 45 tests |
| `npx eslint src/features/ob-bot src/core/i18n/localeStore.ts src/i18n/index.ts src/main.ts src/core/update/pluginUpdater.ts src/settings/schema/setting.types.ts` | PASS |
| Prettier | Applied to added feature and modified UI/i18n files |

The full Jest suite and repository-wide lint were not run. Focused tests verify stable isolated bot DM IDs, profile bindings, serialized workspace persistence/reload, distinct API calls for plan/worker/merge, mention routing, invalid assignment rejection, and inherited navigation/API/updater/locale behavior. Agent responses are mocked; no paid provider/API calls or real key validation occurred.

Artifacts: repository-root `main.js` (~5.6 MB), `styles.css` (~488 KB), `manifest.json` (ob-bot, 0.2.0-dev). Build artifacts follow upstream gitignore and are not committed. Runtime component and module build outputs also remain generated artifacts. Initial rsync was unavailable; a Python copy excluding .git/node_modules was used. An initial npm command ran from the workspace root and exited without installing; installation was rerun successfully from the project directory.

No Obsidian GUI, popout, side-by-side optional module activation, or iPhone device tests were performed. iPhone on-device unverified.

## Remote delivery blocker

Normal pushes to `origin/refactor/yolo-base` were attempted three times. The remote rejected the first with `fatal error in commit_refs_rules`, and the next two with `Internal Server Error` (GitHub request IDs `E992:C20B5:6C96BB:9B2C52:6AEB1430` and `EC33:27C9D5:6B5C1B:99AB40:6AEB1440`, 2026-11-04 11:17 UTC). Read access works; `refs/heads/legacy/v0.1.0` and `refs/tags/v0.1.0` remain `603d0de4671aea47419685699064407575dfaeca`. No force push or remote rule changes were attempted. The branch is committed locally; a Git bundle is provided at `/workspace/ob-bot-work/ob-bot-refactor.bundle` as a transfer fallback. Origin push is not complete.
