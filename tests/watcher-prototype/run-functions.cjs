// Use a visible disposable source directory: upstream Firebase ignores dot-directories,
// including hidden ancestors of developer worktrees.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const consumer = fs.existsSync(path.join(root, 'tests/emulator/package.json')) ? 'tests/emulator' : 'tests/firebase_emulator';
const fixture = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'saarthi-functions-'));
const source = path.join(fixture, 'functions');
fs.mkdirSync(source);
for (const name of ['package.json', 'index.cjs']) fs.copyFileSync(path.join(__dirname, 'functions', name), path.join(source, name));
fs.symlinkSync(path.join(__dirname, 'functions/node_modules'), path.join(source, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
fs.copyFileSync(path.join(__dirname, 'firebase.functions.json'), path.join(fixture, 'firebase.json'));
const testScript = path.join(__dirname, 'functions-reload.cjs');
const result = spawnSync(process.execPath, [path.join(root, consumer, 'node_modules/firebase-tools/lib/bin/firebase.js'),
  'emulators:exec', '--config', path.join(fixture, 'firebase.json'), '--project', 'demo-saarthi-release', '--only', 'functions',
  `node "${testScript}"`], {cwd: fixture, stdio: 'inherit', env: {...process.env, SAARTHI_FUNCTIONS_FIXTURE: source}});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
