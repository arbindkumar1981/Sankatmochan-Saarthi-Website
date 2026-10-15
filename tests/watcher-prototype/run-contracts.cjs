// Cross-platform regression suites against the actual working CLI installation.
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const root = process.cwd();
const fixture = path.join(root, '.watcher-prototype');
require('node:fs').mkdirSync(path.join(fixture, 'fixtures'), {recursive: true});
const env = {...process.env,
  WEBSITE_ROOT: root,
  WATCHER_FIXTURE_ROOT: fixture,
  WATCHER_ADAPTER: path.join(root, 'tests/emulator/node_modules/firebase-tools/lib/reviewed-watcher-prototype.cjs')};
for (const name of ['compatibility.cjs', 'extended.cjs', 'raw-contract.cjs', 'operational.cjs']) {
  const result = spawnSync(process.execPath, [path.join(root, 'tests/watcher-prototype', name)], {cwd: fixture, env, stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
