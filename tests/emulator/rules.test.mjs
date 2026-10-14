import {readFile} from 'node:fs/promises';
import {after,before,test} from 'node:test';
import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,updateDoc} from 'firebase/firestore';
import {ref,uploadBytes,getMetadata,deleteObject} from 'firebase/storage';

let env;
before(async()=>{
  // Always local-only: no production Firebase credentials or remote database.
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8080');
  assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST,'127.0.0.1:9199');
  env=await initializeTestEnvironment({projectId:'demo-saarthi-release',firestore:{host:'127.0.0.1',port:8080,rules:await readFile('../../firestore.rules','utf8')},storage:{host:'127.0.0.1',port:9199,rules:await readFile('../../storage.rules','utf8')}});
  await env.withSecurityRulesDisabled(async context=>{
    await setDoc(doc(context.firestore(),'admins','admin'),{fixture:true});
    await setDoc(doc(context.firestore(),'tests','test-private'),{questions:[{correctIndex:0}],approved:true,published:true});
    await setDoc(doc(context.firestore(),'test_results','old-result'),{studentUid:'student',score:2});
    await setDoc(doc(context.firestore(),'mistakes','old-mistake'),{studentUid:'student',masteryStatus:'pending'});
  });
});
after(async()=>{await env?.cleanup()});
const context=(uid)=>env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'}});

test('fresh student profile creation works; role escalation and another student profile fail',async()=>{
  const db=context('student').firestore();
  await assertSucceeds(setDoc(doc(db,'users','student'),{uid:'student',email:'fixture@example.test',role:'student'}));
  await assertFails(updateDoc(doc(db,'users','student'),{role:'admin'}));
  await assertFails(setDoc(doc(db,'users','other'),{uid:'other',email:'other@example.test',role:'student'}));
  await assertFails(getDoc(doc(db,'users','other')));
  await assertFails(setDoc(doc(db,'admins','student'),{fixture:true}));
  await assertSucceeds(getDoc(doc(db,'admins','student')));
  await assertSucceeds(setDoc(doc(context('admin').firestore(),'users','admin'),{uid:'admin',email:'admin@example.test',role:'admin'}));
});
test('answer bank, score writes, foreign history and manual mastery are denied',async()=>{
  const student=context('student').firestore();
  await assertFails(getDoc(doc(student,'tests','test-private')));
  await assertSucceeds(getDoc(doc(context('admin').firestore(),'tests','test-private')));
  await assertFails(setDoc(doc(student,'test_results','forged'),{studentUid:'student',score:100}));
  await assertFails(updateDoc(doc(student,'test_results','old-result'),{score:100}));
  await assertFails(getDoc(doc(context('other').firestore(),'test_results','old-result')));
  await assertFails(updateDoc(doc(student,'mistakes','old-mistake'),{masteryStatus:'mastered',reviewedAt:'2026-10-14'}));
  await assertSucceeds(updateDoc(doc(student,'mistakes','old-mistake'),{masteryStatus:'reviewed',reviewedAt:'2026-10-14'}));
});
test('document draft stays private and clients cannot bypass server review publication',async()=>{
  const admin=context('admin').firestore();
  const draft={board:'CBSE',classGrade:'Class 12',subjectId:'biology',chapterId:'cells',contentType:'detailed_notes',version:1,requiresServerReview:true,approved:false,published:false,bodyText:'Synthetic notes'};
  await assertSucceeds(setDoc(doc(admin,'learning_contents','draft'),draft));
  await assertFails(getDoc(doc(context('student').firestore(),'learning_contents','draft')));
  await assertFails(updateDoc(doc(admin,'learning_contents','draft'),{approved:true,published:true}));
  await assertFails(updateDoc(doc(admin,'learning_contents','draft'),{requiresServerReview:false,approved:true,published:true}));
  await assertFails(setDoc(doc(admin,'learning_contents','bypass'),{...draft,requiresServerReview:false,approved:true,published:true}));
  await env.withSecurityRulesDisabled(async context=>{await updateDoc(doc(context.firestore(),'learning_contents','draft'),{approved:true,published:true})});
  await assertSucceeds(getDoc(doc(context('student').firestore(),'learning_contents','draft')));
});
test('authenticated admin stores private original and immutable branded PDF; students cannot read storage directly',async()=>{
  const path='learning-materials/admin/00000000-0000-0000-0000-000000000000-branded-fixture.pdf';
  const original='learning-materials/admin/00000000-0000-0000-0000-000000000000-original-fixture.pdf';
  const bytes=new TextEncoder().encode('%PDF-synthetic-emulator-fixture');
  const admin=context('admin').storage(), student=context('student').storage();
  await assertFails(uploadBytes(ref(student,path),bytes,{contentType:'application/pdf'}));
  await assertSucceeds(uploadBytes(ref(admin,original),bytes,{contentType:'application/pdf'}));
  await assertSucceeds(uploadBytes(ref(admin,path),bytes,{contentType:'application/pdf'}));
  await assertFails(uploadBytes(ref(admin,path),bytes,{contentType:'application/pdf'}));
  await assertFails(deleteObject(ref(admin,path)));
  await assertFails(getMetadata(ref(student,path)));
  await assertFails(getMetadata(ref(student,original)));
  await assertSucceeds(getMetadata(ref(admin,path)));
});
