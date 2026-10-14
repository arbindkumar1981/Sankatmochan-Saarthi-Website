// Produces an isolated, unpublished vendor experiment. Never changes working CLI locks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const website = process.cwd();
const root = path.join(website, '.watcher-prototype');
const baseline = path.join(website, 'tests/emulator/package-lock.json');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const integrity = file => 'sha512-' + crypto.createHash('sha512').update(fs.readFileSync(file)).digest('base64');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
assert.equal(path.basename(root), '.watcher-prototype');
switch (process.argv[2]) {
  case 'setup': {
    fs.mkdirSync(root, {recursive: true});
    fs.mkdirSync(path.join(root, 'vendor/firebase-tools'), {recursive: true});
    fs.mkdirSync(path.join(root, 'reload-fixture'), {recursive: true});
    fs.mkdirSync(path.join(root, 'fixtures'), {recursive: true});
    for (const file of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(website, 'tests/emulator', file), path.join(root, file));
    for (const file of ['firestore.rules', 'storage.rules', 'firebase.emulators.json']) fs.copyFileSync(path.join(website, file), path.join(root, 'reload-fixture', file));
    write(path.join(root, 'provenance.json'), {baselineLockSHA256: hash(baseline), websiteLockSHA256: hash(path.join(website, 'bun.lock'))});
    break;
  }
  case 'verify':
    assert.equal(integrity(path.join(root, 'firebase-tools-15.33.0.tgz')), json(baseline).packages['node_modules/firebase-tools'].integrity);
    break;
  case 'adapt': {
    const vendor = path.join(root, 'vendor/firebase-tools');
    fs.copyFileSync(path.join(__dirname, 'adapter.cjs'), path.join(vendor, 'lib/reviewed-watcher-prototype.cjs'));
    for (const file of ['emulator/databaseEmulator.js', 'emulator/firestoreEmulator.js', 'emulator/functionsEmulator.js', 'emulator/storage/rules/manager.js']) {
      const target = path.join(vendor, 'lib', file);
      const source = fs.readFileSync(target, 'utf8');
      assert.equal(source.split('require("chokidar")').length, 2, 'Expected exactly one watcher import per reviewed file');
      const relative = file.includes('/storage/') ? '../../../' : '../';
      fs.writeFileSync(target, source.replace('require("chokidar")', `require("${relative}reviewed-watcher-prototype.cjs")`));
    }
    const manifest = json(path.join(vendor, 'package.json'));
    assert.equal(manifest.version, '15.33.0');
    manifest.version = '15.33.0-prototype.0';
    manifest.dependencies.chokidar = '4.0.3';
    manifest.dependencies.anymatch = '3.1.3';
    manifest.dependencies.picomatch = '2.3.2';
    // These upstream root-only development overrides are not active when the CLI
    // is consumed; remove them from the fixture package to avoid local-pack conflicts.
    // The consuming fixture retains the reviewed baseline overrides and full audit.
    delete manifest.overrides;
    write(path.join(vendor, 'package.json'), manifest);
    const consumer = json(path.join(root, 'package.json'));
    consumer.devDependencies['firebase-tools'] = 'file:firebase-tools-15.33.0-prototype.0.tgz';
    write(path.join(root, 'package.json'), consumer);
    break;
  }
  case 'record': {
    const provenance = json(path.join(root, 'provenance.json'));
    assert.equal(hash(baseline), provenance.baselineLockSHA256);
    assert.equal(hash(path.join(website, 'bun.lock')), provenance.websiteLockSHA256);
    const lock = json(path.join(root, 'package-lock.json'));
    assert.equal(lock.packages['node_modules/firebase-tools'].version, '15.33.0-prototype.0');
    assert.equal(lock.packages['node_modules/chokidar'].version, '4.0.3');
    assert.ok(!Object.keys(lock.packages).some(key => key.endsWith('/braces')));
    assert.ok(!Object.entries(lock.packages).some(([key, value]) => key.endsWith('/chokidar') && value.version?.startsWith('3.')));
    write(path.join(root, 'provenance.json'), {...provenance,
      upstreamArtifactIntegrity: integrity(path.join(root, 'firebase-tools-15.33.0.tgz')),
      prototypeArtifactIntegrity: integrity(path.join(root, 'firebase-tools-15.33.0-prototype.0.tgz')),
      prototypeLockSHA256: hash(path.join(root, 'package-lock.json')),
      adapterSHA256: hash(path.join(__dirname, 'adapter.cjs'))});
    break;
  }
  default: throw Error('Expected setup, verify, adapt or record');
}
console.log(`PASS: isolated prototype ${process.argv[2]}`);
