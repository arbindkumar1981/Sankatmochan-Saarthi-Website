import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const cli=fileURLToPath(new URL('./node_modules/firebase-tools/lib/bin/firebase.js',import.meta.url));
const result=spawnSync(process.execPath,[cli,'emulators:exec','--config','firebase.emulators.json','--project','demo-saarthi-release','--only','firestore,storage','node --test tests/emulator/rules.test.mjs'],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status ?? 1;
