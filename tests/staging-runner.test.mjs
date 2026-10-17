import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

test('private staging runner preserves both identity boundaries across all eight synthetic flows', async () => {
  const directory = await mkdtemp(join(tmpdir(),'saarthi-staging-runner-'));
  const manifest = join(directory,'staging.json');
  await writeFile(manifest,JSON.stringify({environment:'staging',isolationApproved:true,
    apiUrl:'https://issue87-api-staging.invalid',websiteUrl:'https://issue87-site-staging.invalid',
    firebaseProjectId:'issue87-saarthi-staging',ownerUid:'issue87-owner',otherUid:'issue87-other',
    backendCommit:'a'.repeat(40),websiteCommit:'b'.repeat(40)}));
  const result = spawnSync('node',['--import',new URL('./fixtures/staging-runner-preload.mjs',import.meta.url).href,
    fileURLToPath(new URL('./staging-eight-assets.mjs',import.meta.url)),manifest],{
    cwd:directory,encoding:'utf8',timeout:60000,
    env:{...process.env,SAARTHI_STAGING_OWNER_TOKEN:'synthetic-owner-token',
      SAARTHI_STAGING_OTHER_TOKEN:'synthetic-other-token',SAARTHI_STAGING_RUN_TOKEN:'synthetic-run-token'}});
  assert.equal(result.status,0,result.stderr);
  const evidenceName = (await readdir(directory)).find(name=>name.endsWith('-evidence.json'));
  assert.ok(evidenceName);
  const evidenceText = await readFile(join(directory,evidenceName),'utf8');
  for (const output of [result.stdout,result.stderr,evidenceText]) {
    assert.doesNotMatch(output,/synthetic-(owner|other|run)-token/);
  }
  const evidence = JSON.parse(evidenceText);
  assert.equal(evidence.results.length,8);
  assert.ok(evidence.results.every(row=>row.status==='PASS'));
});
