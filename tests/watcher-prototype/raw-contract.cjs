// Isolated watcher prototype regression checks; never used for production deploy.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {setTimeout: delay} = require('node:timers/promises');

if (!process.env.WATCHER_ADAPTER) throw Error('WATCHER_ADAPTER is required');
const {watch} = require(process.env.WATCHER_ADAPTER);

async function waitFor(predicate, message) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await delay(30);
  }
  throw Error(message);
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'saarthi-watcher-contract-'));
  let watcher;
  try {
    const file = path.join(root, 'rules.txt');
    await fs.writeFile(file, 'before');
    watcher = watch(root, {ignoreInitial: true});
    const raw = [];
    const changes = [];
    watcher.on('raw', (event, name, details) => raw.push({event, name, details}));
    watcher.on('all', (event, name) => changes.push({event, name}));
    await new Promise((resolve, reject) => {
      watcher.once('ready', resolve);
      watcher.once('error', reject);
    });
    await fs.writeFile(file, 'after');
    await waitFor(() => changes.some(e => e.event === 'change'), 'missing high-level change event');
    await waitFor(() => raw.length > 0, 'missing raw filesystem event');
    assert.equal(typeof raw[0].event, 'string');
    assert.equal(typeof raw[0].name, 'string');
    assert.equal(typeof raw[0].details, 'object');
    const watched = watcher.getWatched();
    assert.equal(typeof watched, 'object');
    assert.ok(Object.keys(watched).length > 0, 'getWatched returned no watched directories');
    await watcher.close();
    watcher = null;
    console.log('PASS raw event forwarding and basic getWatched contract');
  } finally {
    if (watcher) await watcher.close();
    await fs.rm(root, {recursive: true, force: true});
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
