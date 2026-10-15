// Cross-platform launcher for isolated watcher contract suites.
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const root = process.cwd();
const fixture = path.join(root, '.watcher-prototype');
const env = {...process.env,
  WEBSITE_ROOT: root,
  WATCHER_FIXTURE_ROOT: fixture,
  WATCHER_ADAPTER: path.join(fixture, 'node_modules/firebase-tools/lib/reviewed-watcher-prototype.cjs')};
for (const name of ['compatibility.cjs', 'extended.cjs', 'raw-contract.cjs']) {
  const result = spawnSync(process.execPath, [path.join(root, 'tests/watcher-prototype', name)], {cwd: fixture, env, stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
