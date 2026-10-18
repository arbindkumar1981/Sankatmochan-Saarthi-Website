import {before,after,test} from 'node:test';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(resolve(process.env.SAARTHI_TEST_TOOLS || '.issue87-tools','tests/emulator/package.json'));
const {initializeTestEnvironment,assertFails,assertSucceeds} = require('@firebase/rules-unit-testing');
const {doc,setDoc} = require('firebase/firestore');
const {ref,uploadBytes,getMetadata,deleteObject} = require('firebase/storage');
let environment;
const path = 'learning-materials/synthetic-admin/fixture.pdf';
const body = new TextEncoder().encode('%PDF-synthetic-fixture');
const context = (uid,provider='google.com') => environment.authenticatedContext(uid,{firebase:{sign_in_provider:provider}}).storage();
before(async()=>{
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8088');
  assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST,'127.0.0.1:9198');
  environment=await initializeTestEnvironment({projectId:'demo-saarthi-storage-security',
    firestore:{host:'127.0.0.1',port:8088,rules:await readFile(new URL('../firestore.rules',import.meta.url),'utf8')},
    storage:{host:'127.0.0.1',port:9198,rules:await readFile(new URL('../storage.rules',import.meta.url),'utf8')}});
  await environment.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'admins','synthetic-admin'),{fixture:true}));
});
after(async()=>{await environment?.cleanup();});
test('legitimate admin retains private storage; student, signed-out and foreign writes are denied',async()=>{
  const admin=context('synthetic-admin');
  await assertSucceeds(uploadBytes(ref(admin,path),body,{contentType:'application/pdf'}));
  await assertSucceeds(getMetadata(ref(admin,path)));
  await assertFails(getMetadata(ref(context('synthetic-student'),path)));
  await assertFails(getMetadata(ref(environment.unauthenticatedContext().storage(),path)));
  await assertFails(uploadBytes(ref(admin,'learning-materials/other-admin/fixture.pdf'),body,{contentType:'application/pdf'}));
});
test('anonymous identity with an existing admin record cannot read, create, update or delete files',async()=>{
  const anonymous=context('synthetic-admin','anonymous');
  await assertFails(getMetadata(ref(anonymous,path)));
  await assertFails(uploadBytes(ref(anonymous,'learning-materials/synthetic-admin/new.pdf'),body,{contentType:'application/pdf'}));
  await assertFails(uploadBytes(ref(anonymous,path),body,{contentType:'application/pdf'}));
  await assertFails(deleteObject(ref(anonymous,path)));
});
