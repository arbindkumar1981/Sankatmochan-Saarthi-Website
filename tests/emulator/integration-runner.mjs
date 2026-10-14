import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const rules=spawnSync(process.execPath,['--test','tests/emulator/rules.test.mjs','tests/emulator/auth-storage.test.mjs'],{stdio:'inherit'});
if(rules.error)throw rules.error;
if(rules.status!==0)process.exit(rules.status??1);
if(process.env.SAARTHI_FIREBASE_BRIDGE==='1'){
  const backend=process.env.SAARTHI_BACKEND_TEST_DIR;
  if(!backend || resolve(backend)!==resolve('paired-backend'))throw new Error('Refusing an unexpected paired backend checkout');
  const api=spawnSync('uv',['run','python','-m','pytest','tests/test_firebase_emulator_bridge.py','-q','-p','no:cacheprovider','--tb=short'],{cwd:backend,stdio:'inherit'});
  if(api.error)throw api.error;
  process.exitCode=api.status??1;
}
