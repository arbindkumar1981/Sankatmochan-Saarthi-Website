const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {setTimeout: delay} = require('node:timers/promises');
const {watch} = require(process.env.WATCHER_ADAPTER);
const deadline = async predicate => {
  for (let i = 0; i < 200; i++) { if (predicate()) return; await delay(50); }
  throw Error('Watcher operation exceeded 10 seconds');
};
(async () => {
  const root = await fs.mkdtemp(path.join(process.env.WATCHER_FIXTURE_ROOT, 'fixtures', 'operational-'));
  const source = path.join(root, 'source');
  await fs.mkdir(source);
  await fs.writeFile(path.join(source, 'keep.js'), 'initial');
  await fs.writeFile(path.join(source, 'skip.js'), 'initial');
  await fs.symlink(source, path.join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  let sawStats = false;
  const watcher = watch('linked', {cwd: root, ignoreInitial: true, followSymlinks: true,
    ignored: (file, stats) => { if (stats?.isFile()) sawStats = true; return file.endsWith('skip.js'); }});
  const events = [];
  watcher.on('all', (event, file) => events.push({event, file}));
  try {
    await Promise.race([new Promise((resolve, reject) => {watcher.once('ready', resolve); watcher.once('error', reject);}), delay(10000).then(() => {throw Error('Readiness timeout');})]);
    assert.ok(sawStats, 'ignored callback must receive file stats');
    await fs.writeFile(path.join(source, 'keep.js'), 'changed');
    await fs.writeFile(path.join(source, 'skip.js'), 'changed');
    await deadline(() => events.some(e => e.event === 'change' && e.file.endsWith('keep.js')));
    await delay(250);
    assert.ok(!events.some(e => e.file.endsWith('skip.js')));
    assert.ok(Object.values(watcher.getWatched()).flat().includes('keep.js'));
    watcher.unwatch('linked');
    await delay(150);
    const count = events.length;
    await fs.writeFile(path.join(source, 'keep.js'), 'unwatched');
    await delay(300);
    assert.equal(events.length, count);
  } finally { await watcher.close(); }
  const started = Date.now();
  const rss = process.memoryUsage().rss;
  await Promise.all(Array.from({length: 300}, (_, i) => fs.writeFile(path.join(source, `${i}.js`), 'fixture')));
  const bulk = watch(source, {ignoreInitial: true});
  let ready = false;
  bulk.once('ready', () => {ready = true;});
  try {
    await deadline(() => ready);
    assert.ok(Object.values(bulk.getWatched()).flat().length >= 300);
    assert.ok(process.memoryUsage().rss - rss < 128 * 1024 * 1024, '300-file watcher exceeds 128 MiB incremental RSS budget');
  } finally { await bulk.close(); }
  assert.deepEqual(bulk.getWatched(), {});
  assert.ok(Date.now() - started < 15000, '300-file lifecycle exceeds 15 seconds');
  console.log('PASS: ignored callback stats, symlink, cwd, unwatch, getWatched, close and 300-file resource budget');
})().catch(error => {console.error(error); process.exitCode = 1;});
