import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {verifiedCandidate} from './emulator/verify-candidate.mjs';

test('release rejects missing, default, external and injected candidate URLs', () => {
  assert.throws(() => verifiedCandidate('https://sa-c-012345abcdef---' + 'a'.repeat(50) + '.a.run.app'));
  assert.equal(verifiedCandidate('https://sa-c-012345abcdef---sankatmochan-saarthi-v3-git-abcdef.a.run.app'), 'https://sa-c-012345abcdef---sankatmochan-saarthi-v3-git-abcdef.a.run.app');
  assert.throws(() => verifiedCandidate('https://sa-c-012345abcdef---api.run.app\n'));
  assert.throws(() => verifiedCandidate('https://sa-c-ABCDEF012345---api.run.app'));
  assert.throws(() => verifiedCandidate('https://saarthi-release-candidate---api.run.app'));
  for (const value of [undefined, '', 'https://default.run.app', 'https://example.com', 'http://sa-c-012345abcdef---api.run.app', 'https://sa-c-012345abcdef---api.run.app/?token=x', 'https://sa-c-012345abcdef---api.run.app\nOTHER=value']) {
    assert.throws(() => verifiedCandidate(value));
  }
  assert.equal(verifiedCandidate('https://sa-c-012345abcdef---api-abc.a.run.app'), 'https://sa-c-012345abcdef---api-abc.a.run.app');
});

test('dependency audit and candidate build finish before deployment credentials', () => {
  const text = readFileSync(new URL('../.github/workflows/firebase-hosting.yml', import.meta.url), 'utf8');
  const deploy = text.slice(text.indexOf('  deploy:'));
  const audit = deploy.indexOf('npm audit --prefix tests/emulator --audit-level=moderate');
  const candidate = deploy.indexOf('node tests/emulator/verify-candidate.mjs');
  const build = deploy.indexOf('bun run build');
  const auth = deploy.indexOf('      - id: auth');
  assert.ok(audit > 0 && audit < candidate && candidate < build && build < auth);
  assert.ok(!deploy.includes('continue-on-error'));
  assert.ok(!deploy.includes('--token'));
});
