const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

if (!process.env.WATCHER_ADAPTER || !process.env.WATCHER_FIXTURE_ROOT) throw Error('Explicit isolated prototype paths are required');
const versions = [['4.0.3-reviewed-prototype', require(process.env.WATCHER_ADAPTER)]];
const results = [];
const root = path.join(process.env.WATCHER_FIXTURE_ROOT, 'fixtures');
const normalize = (value) => value.replaceAll('\\', '/');
const options = { persistent: true, ignoreInitial: true };

async function until(predicate, message, timeout = 4000) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started >= timeout) throw new Error(message);
    await delay(30);
  }
}

async function observe(chokidar, watched, opts, action) {
  const events = [];
  // Relative input keeps the fixture's hidden ancestor directory out of Firebase's
  // dotfile-ignore regex; this measures patterns inside the watched source tree.
  const watcher = chokidar.watch(normalize(path.relative(process.cwd(), watched)), opts);
  let ready = false;
  let error;
  watcher.on('all', (event, file) => events.push({ event, file: normalize(path.resolve(file)) }));
  watcher.once('error', (e) => { error = e; });
  watcher.once('ready', () => { ready = true; });
  try {
    await until(() => ready || error, 'watcher readiness timed out');
    if (error) throw error;
    await action(watcher, events);
    if (error) throw error;
    return events;
  } finally {
    await watcher.close();
  }
}

async function check(version, name, action) {
  const dir = await fs.mkdtemp(path.join(root, `${version}-${name}-`));
  try {
    const detail = await action(dir);
    results.push({ version, test: name, status: 'PASS', ...detail });
  } catch (error) {
    results.push({ version, test: name, status: 'FAIL', error: error.message });
  }
}

(async () => {
  await fs.mkdir(root, { recursive: true });
  for (const [version, chokidar] of versions) {
    await check(version, 'api', async () => {
      assert.equal(typeof chokidar.watch, 'function');
      assert.equal(typeof chokidar.FSWatcher, 'function');
      const watcher = new chokidar.FSWatcher();
      assert.equal(typeof watcher.add, 'function');
      assert.equal(typeof watcher.close, 'function');
      await watcher.close();
      return { api: 'CommonJS, FSWatcher, watch, add, close' };
    });

    await check(version, 'directory-lifecycle', async (dir) => {
      const file = path.join(dir, 'new.js');
      const events = await observe(chokidar, dir, options, async (watcher, events) => {
        await fs.writeFile(file, 'one');
        await until(() => events.some((e) => e.event === 'add'), 'missing add');
        await delay(150);
        await fs.writeFile(file, 'changed contents');
        await until(() => events.some((e) => e.event === 'change'), 'missing change');
        await fs.unlink(file);
        await until(() => events.some((e) => e.event === 'unlink'), 'missing unlink');
        await watcher.close();
        const count = events.length;
        await fs.writeFile(path.join(dir, 'after-close.js'), 'closed');
        await delay(250);
        assert.equal(events.length, count, 'events arrived after close');
      });
      return { events: events.map((e) => e.event), closedWithoutFurtherEvents: true };
    });

    await check(version, 'add-method', async (dir) => {
      const initial = path.join(dir, 'initial.rules');
      const added = path.join(dir, 'added.rules');
      await fs.writeFile(initial, 'one');
      await fs.writeFile(added, 'one');
      await observe(chokidar, initial, options, async (watcher, events) => {
        watcher.add(added);
        await until(() => Object.values(watcher.getWatched()).flat().includes('added.rules'), 'add method did not register file');
        await fs.writeFile(added, 'changed');
        await until(() => events.some((e) => e.event === 'change' && e.file.endsWith('/added.rules')), 'missing added file change');
      });
      return { addedFileChangeDetected: true };
    });

    for (const name of ['firestore.rules', 'storage.rules', 'database.rules.json', 'firestore{draft}.rules']) {
      await check(version, `literal-${name.replaceAll(/[^a-z]/g, '-')}`, async (dir) => {
        const file = path.join(dir, name);
        await fs.writeFile(file, 'initial rules');
        let reloaded;
        await observe(chokidar, file, options, async (watcher, events) => {
          watcher.on('change', async () => { reloaded = await fs.readFile(file, 'utf8'); });
          assert.equal(events.length, 0, 'ignoreInitial emitted an event');
          await fs.writeFile(file, 'updated rules');
          await until(() => reloaded === 'updated rules', 'rule reload callback did not receive new content');
        });
        return { literal: name, readUpdatedContent: true };
      });
    }

    await check(version, 'glob-watch-path', async (dir) => {
      const file = path.join(dir, 'entry.js');
      const other = path.join(dir, 'excluded.txt');
      await fs.writeFile(file, 'one');
      await fs.writeFile(other, 'one');
      const events = await observe(chokidar, `${normalize(dir)}/**/*.js`, options, async (_watcher, events) => {
        await fs.writeFile(file, 'changed');
        await fs.writeFile(other, 'changed');
        await delay(700);
      });
      const changed = events.filter((e) => e.event === 'change').map((e) => path.basename(e.file));
      assert.deepEqual(changed, ['entry.js']);
      return { changed };
    });

    for (const [ignore, ignoredFile] of [['generated/**', 'generated/output.js'], ['*.test.js', 'spec.test.js'], ['package-lock.json', 'package-lock.json']]) {
      await check(version, `functions-ignore-${ignoredFile.replaceAll(/[^a-z]/g, '-')}`, async (dir) => {
        const ignoredPath = path.join(dir, ignoredFile);
        const trackedPath = path.join(dir, 'index.js');
        await fs.mkdir(path.dirname(ignoredPath), { recursive: true });
        await fs.writeFile(ignoredPath, 'one');
        await fs.writeFile(trackedPath, 'one');
        const ignored = [/(^|[\/\\])\../, /.+\.log/, /.+?[\\\/]node_modules[\\\/].+?/, /.+?[\\\/]venv[\\\/].+?/, `**/${ignore}`];
        const events = await observe(chokidar, dir, { ignored, persistent: true }, async (_watcher, events) => {
          events.length = 0;
          await fs.writeFile(ignoredPath, 'changed contents');
          await fs.writeFile(trackedPath, 'changed contents');
          await until(() => events.some((e) => e.event === 'change' && e.file === normalize(trackedPath)), 'tracked Functions source change missing');
          await delay(500);
        });
        const changed = events.filter((e) => e.event === 'change').map((e) => normalize(path.relative(dir, e.file))).sort();
        assert.deepEqual(changed, ['index.js'], `Firebase ignored pattern **/${ignore} did not exclude ${ignoredFile}; actual changed files ${changed.join(', ')}`);
        return { ignoredPattern: `**/${ignore}`, changed };
      });
    }

    await check(version, 'functions-regex-ignore', async (dir) => {
      const ignoredFiles = ['debug.log', '.hidden.js', 'node_modules/pkg/index.js', 'venv/pkg/index.js'];
      const trackedPath = path.join(dir, 'index.js');
      for (const file of [...ignoredFiles, 'index.js']) {
        await fs.mkdir(path.dirname(path.join(dir, file)), { recursive: true });
        await fs.writeFile(path.join(dir, file), 'one');
      }
      const ignored = [/(^|[\/\\])\../, /.+\.log/, /.+?[\\\/]node_modules[\\\/].+?/, /.+?[\\\/]venv[\\\/].+?/];
      const events = await observe(chokidar, dir, { ignored, persistent: true }, async (_watcher, events) => {
        events.length = 0;
        for (const file of [...ignoredFiles, 'index.js']) await fs.writeFile(path.join(dir, file), 'changed contents');
        await until(() => events.some((e) => e.event === 'change' && e.file === normalize(trackedPath)), 'tracked Functions source change missing');
        await delay(500);
      });
      const changed = events.filter((e) => e.event === 'change').map((e) => normalize(path.relative(dir, e.file))).sort();
      assert.deepEqual(changed, ['index.js']);
      return { changed };
    });
  }
  const output = { node: process.version, platform: process.platform, baseline: 'installed Firebase CLI chokidar 3.6.0', candidate: 'isolated exact chokidar 4.0.3', results };
  await fs.writeFile(path.join(process.env.WATCHER_FIXTURE_ROOT, 'adapted-results.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
  process.exitCode = results.some((r) => r.status === 'FAIL') ? 1 : 0;
})();
