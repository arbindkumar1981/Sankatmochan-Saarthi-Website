// Calls a real local Functions runtime, changes its source, then observes reload.
const fs = require('node:fs/promises');
const path = require('node:path');
const {setTimeout: delay} = require('node:timers/promises');
if (!process.env.SAARTHI_FUNCTIONS_FIXTURE) throw Error('Disposable Functions fixture is required');
const source = path.join(process.env.SAARTHI_FUNCTIONS_FIXTURE, 'index.cjs');
async function expectResponse(expected) {
  for (let i = 0; i < 120; i++) {
    try {
      const response = await fetch('http://127.0.0.1:5001/demo-saarthi-release/us-central1/reloadProbe', {signal: AbortSignal.timeout(3000)});
      if (response.ok && (await response.text()) === expected) return;
    } catch { /* The runtime can briefly be unavailable during reload. */ }
    await delay(500);
  }
  throw Error(`Real Functions runtime did not serve ${expected}`);
}
(async () => {
  const original = await fs.readFile(source, 'utf8');
  try {
    await expectResponse('before-reload');
    await fs.writeFile(source, original.replace('before-reload', 'after-reload'));
    await expectResponse('after-reload');
    console.log('PASS: real Functions runtime serves changed source after watcher reload');
  } finally { await fs.writeFile(source, original); }
})().catch(error => {console.error(error); process.exitCode = 1;});
