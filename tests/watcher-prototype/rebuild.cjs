// Rebuild the vendor tarball from the integrity-pinned official release.
// Does not modify consumer locks, install packages, or contact cloud services.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const provenance = JSON.parse(fs.readFileSync(path.join(root, 'vendor/firebase-cli/provenance.json')));
const destination = path.join(root, 'vendor/firebase-cli');
const scratch = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'saarthi-cli-rebuild-'));
const run = (command, args) => {
  const result = spawnSync(command, args, {cwd: scratch, stdio: 'inherit', shell: process.platform === 'win32'});
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} failed`);
};
run('npm', ['pack', 'firebase-tools@15.33.0', '--ignore-scripts', '--silent']);
const integrity = file => 'sha512-' + crypto.createHash('sha512').update(fs.readFileSync(file)).digest('base64');
assert.equal(integrity(path.join(scratch, 'firebase-tools-15.33.0.tgz')), provenance.upstream.integrity);
run('tar', ['-xzf', 'firebase-tools-15.33.0.tgz']);
const vendor = path.join(scratch, 'package');
fs.writeFileSync(path.join(vendor, 'lib/reviewed-watcher-prototype.cjs'), fs.readFileSync(path.join(__dirname, 'adapter.cjs'), 'utf8').replaceAll('\r\n', '\n'));
for (const file of provenance.scope) {
  const target = path.join(vendor, 'lib', file);
  const source = fs.readFileSync(target, 'utf8');
  assert.equal(source.split('require("chokidar")').length, 2);
  const relative = file.includes('/storage/') ? '../../../' : '../';
  fs.writeFileSync(target, source.replace('require("chokidar")', `require("${relative}reviewed-watcher-prototype.cjs")`));
}
const manifestPath = path.join(vendor, 'package.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath));
assert.equal(manifest.version, '15.33.0');
manifest.version = '15.33.0-saarthi.1';
Object.assign(manifest.dependencies, {chokidar: '4.0.3', anymatch: '3.1.3', picomatch: '2.3.2'});
delete manifest.overrides; // Consumer retains the reviewed overrides.
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
run('npm', ['pack', './package', '--ignore-scripts', '--silent']);
const artifact = path.join(scratch, 'firebase-tools-15.33.0-saarthi.1.tgz');
if (process.argv.includes('--write')) fs.copyFileSync(artifact, path.join(destination, path.basename(artifact)));
else assert.equal(integrity(artifact), provenance.artifactIntegrity, 'Rebuilt artifact differs from reviewed artifact');
console.log('PASS: verified upstream and reproducible scoped Firebase CLI artifact');
