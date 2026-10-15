// Build a candidate working lock against the reviewed Firebase CLI adapter.
// This script deliberately does not deploy or suppress npm audit.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const target = path.join(root, 'tests/emulator');
const artifact = path.join(root, '.watcher-prototype/firebase-tools-15.33.0-prototype.0.tgz');
if (!fs.existsSync(artifact)) throw new Error('Build the verified vendor artifact first');
const run = (args, cwd = root) => {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {cwd, stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('npm ' + args.join(' ') + ' failed: ' + result.status);
};
const manifest = path.join(target, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(manifest, 'utf8'));
packageJson.devDependencies['firebase-tools'] = 'file:../../.watcher-prototype/firebase-tools-15.33.0-prototype.0.tgz';
fs.writeFileSync(manifest, JSON.stringify(packageJson, null, 2) + '\n');
run(['install', '--package-lock-only', '--ignore-scripts', '--no-fund'], target);
run(['ci', '--ignore-scripts', '--no-fund'], target);
run(['audit', '--audit-level=high'], target);
const lock = JSON.parse(fs.readFileSync(path.join(target,'package-lock.json'),'utf8'));
const packages = lock.packages;
if (packages['node_modules/firebase-tools']?.version !== '15.33.0-prototype.0' ||
    packages['node_modules/chokidar']?.version !== '4.0.3' ||
    Object.keys(packages).some(k => k.endsWith('/braces') || (k.endsWith('/chokidar') && packages[k].version?.startsWith('3.')))) {
  throw new Error('Working lock contains an unexpected watcher graph');
}
console.log('PASS: generated working emulator lock and clean HIGH audit');
