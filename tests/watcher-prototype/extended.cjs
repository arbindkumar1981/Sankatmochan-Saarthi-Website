const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {setTimeout: delay} = require('node:timers/promises');
if (!process.env.WATCHER_ADAPTER || !process.env.WATCHER_FIXTURE_ROOT) throw Error('Explicit isolated prototype paths are required');
const candidate = require(process.env.WATCHER_ADAPTER);
const results = [];
const normalize = value => value.replaceAll('\\', '/');
async function until(test) {
  for (let i = 0; i < 150; i++) { if (test()) return; await delay(20); }
  throw Error('Expected filesystem event did not arrive');
}
async function run(name, action) {
  const directory = await fs.mkdtemp(path.join(process.env.WATCHER_FIXTURE_ROOT, 'fixtures', 'extended-'));
  const relative = normalize(path.relative(process.cwd(), directory));
  let watcher;
  const events = [];
  const start = async (paths, options = {}) => {
    watcher = candidate.watch(paths, {ignoreInitial: true, ...options});
    watcher.on('all', (event, file) => events.push({event, file: normalize(file)}));
    await new Promise((resolve, reject) => { watcher.once('ready', resolve); watcher.once('error', reject); });
    return watcher;
  };
  try { await action({directory, relative, start, events}); results.push({test: name, status: 'PASS'}); }
  catch (error) { results.push({test: name, status: 'FAIL', error: error.message}); }
  finally { await watcher?.close(); }
}
(async () => {
  await run('brace-alternatives-and-array-paths', async ({directory, relative, start, events}) => {
    for (const file of ['a.js', 'b.ts', 'c.txt']) await fs.writeFile(path.join(directory, file), 'one');
    await start([`${relative}/*.{js,ts}`]);
    for (const file of ['a.js', 'b.ts', 'c.txt']) await fs.writeFile(path.join(directory, file), 'changed');
    await until(() => events.filter(e => e.event === 'change').length >= 2);
    await delay(150);
    assert.deepEqual(events.filter(e => e.event === 'change').map(e => path.basename(e.file)).sort(), ['a.js', 'b.ts']);
  });
  await run('negative-watch-pattern', async ({directory, relative, start, events}) => {
    for (const file of ['keep.js', 'ignored.js']) await fs.writeFile(path.join(directory, file), 'one');
    await start([`${relative}/**/*.js`, `!${relative}/**/ignored.js`]);
    for (const file of ['keep.js', 'ignored.js']) await fs.writeFile(path.join(directory, file), 'changed');
    await until(() => events.some(e => e.event === 'change'));
    await delay(150);
    assert.deepEqual(events.filter(e => e.event === 'change').map(e => path.basename(e.file)), ['keep.js']);
  });
  await run('new-nested-glob-file', async ({directory, relative, start, events}) => {
    await start(`${relative}/**/*.js`);
    await fs.mkdir(path.join(directory, 'new'));
    await fs.writeFile(path.join(directory, 'new', 'created.js'), 'created');
    await until(() => events.some(e => e.event === 'add' && e.file.endsWith('/created.js')));
  });
  await run('explicit-cwd-and-unwatch-shared-base', async ({directory, start, events}) => {
    for (const file of ['a.js', 'b.txt']) await fs.writeFile(path.join(directory, file), 'one');
    const watcher = await start(['**/*.js', '**/*.txt'], {cwd: directory});
    watcher.unwatch('**/*.js');
    for (const file of ['a.js', 'b.txt']) await fs.writeFile(path.join(directory, file), 'changed');
    await until(() => events.some(e => e.event === 'change'));
    await delay(150);
    assert.deepEqual(events.filter(e => e.event === 'change').map(e => path.basename(e.file)), ['b.txt']);
  });
  await run('ignore-negation-preserves-reincluded-file', async ({directory, relative, start, events}) => {
    for (const file of ['keep.js', 'ignored.js']) await fs.writeFile(path.join(directory, file), 'one');
    await start(relative, {ignored: ['**/*.js', '!**/keep.js']});
    for (const file of ['keep.js', 'ignored.js']) await fs.writeFile(path.join(directory, file), 'changed');
    await until(() => events.some(e => e.event === 'change'));
    await delay(150);
    assert.deepEqual(events.filter(e => e.event === 'change').map(e => path.basename(e.file)), ['keep.js']);
  });
  await run('bounded-depth-rejects-hostile-pattern-without-crash', async () => {
    const watcher = new candidate.FSWatcher();
    try { assert.throws(() => watcher.add('{'.repeat(1000) + 'x' + '}'.repeat(1000)), RangeError); }
    finally { await watcher.close(); }
  });
  await fs.writeFile(path.join(process.env.WATCHER_FIXTURE_ROOT, 'adapted-extended-results.json'), JSON.stringify({platform: process.platform, results}, null, 2) + '\n');
  console.log(JSON.stringify(results));
  process.exitCode = results.some(result => result.status !== 'PASS') ? 1 : 0;
})();
