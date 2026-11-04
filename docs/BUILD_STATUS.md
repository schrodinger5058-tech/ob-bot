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
