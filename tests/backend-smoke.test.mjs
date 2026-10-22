import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const basePort = 8891;

async function waitForHealth(url, attempts = 40, delayMs = 250) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return res;
    } catch {
      // Retry until server is reachable.
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('Backend did not become healthy in time.');
}

test('backend health endpoint responds in test mode', async () => {
  const port = String(basePort + Math.floor(Math.random() * 100));
  const server = spawn(process.execPath, ['backend/server.mjs'], {
    env: {
      ...process.env,
      PORT: port,
      SAARTHI_BACKEND_SKIP_FIREBASE: '1'
    },
    stdio: 'ignore'
  });

  try {
    const response = await waitForHealth(`http://127.0.0.1:${port}/health`);
    const data = await response.json();
    assert.equal(data.ok, true);
    assert.equal(data.service, 'saarthi-backend');
    assert.equal(typeof data.model, 'string');
  } finally {
    server.kill('SIGTERM');
  }
});
