import {after, before, test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment, assertFails, assertSucceeds} from '@firebase/rules-unit-testing';
import {collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where} from 'firebase/firestore';
let environment;
let admin, student, forged, anonymous;
before(async () => {
  environment = await initializeTestEnvironment({projectId:'demo-saarthi-admin', firestore: {host:'127.0.0.1', port:8085, rules:await readFile(new URL('../../firestore.rules',import.meta.url),'utf8')}});
  await environment.withSecurityRulesDisabled(async context => {
    const db=context.firestore();
    await setDoc(doc(db,'admins','admin-a'),{enabled:true});
    await setDoc(doc(db,'admins','anonymous-a'),{enabled:true});
    await setDoc(doc(db,'admin_audit_events','trusted-event'),{category:'users', operation:'update', actorRef:'opaque-actor', occurredAt:'2026-10-15T00:00:00.000Z'});
    await setDoc(doc(db,'admin_audit_logs','legacy-event'),{action:'website_config.update',createdAt:'2026-10-14T00:00:00Z'});
  });
  admin=environment.authenticatedContext('admin-a',{firebase:{sign_in_provider:'google.com'}}).firestore();
  student=environment.authenticatedContext('student-a',{firebase:{sign_in_provider:'google.com'}}).firestore();
  forged=environment.authenticatedContext('forged-a',{role:'admin',isAdmin:true,firebase:{sign_in_provider:'google.com'}}).firestore();
  anonymous=environment.authenticatedContext('anonymous-a',{firebase:{sign_in_provider:'anonymous'}}).firestore();
});
after(async () => {await environment?.cleanup();});
test('only a real non-anonymous admin can read or filter trusted events',async()=>{
  await assertSucceeds(getDoc(doc(admin,'admin_audit_events','trusted-event')));
  await assertSucceeds(getDocs(query(collection(admin,'admin_audit_events'),where('category','==','users'),orderBy('occurredAt','desc'),limit(51))));
  for(const db of [student,forged,anonymous,environment.unauthenticatedContext().firestore()]){
    await assertFails(getDoc(doc(db,'admin_audit_events','trusted-event')));
    await assertFails(getDocs(collection(db,'admin_audit_events')));
  }
});
test('even admin clients cannot forge, overwrite, alter or delete a server event',async()=>{
  for(const db of [admin,student,forged,anonymous]){
    await assertFails(setDoc(doc(db,'admin_audit_events','forged-event'),{actorRef:'fake',category:'users'}));
    await assertFails(setDoc(doc(db,'admin_audit_events','trusted-event'),{operation:'forged'}));
    await assertFails(updateDoc(doc(db,'admin_audit_events','trusted-event'),{operation:'forged'}));
    await assertFails(deleteDoc(doc(db,'admin_audit_events','trusted-event')));
  }
});
test('legacy history is preserved read-only and cannot be used to forge new events',async()=>{
  await assertSucceeds(getDoc(doc(admin,'admin_audit_logs','legacy-event')));
  await assertFails(getDoc(doc(student,'admin_audit_logs','legacy-event')));
  await assertFails(setDoc(doc(admin,'admin_audit_logs','legacy-forgery'),{actorUid:'admin-a',action:'website_config.update',target:'curriculum_nodes/_website_config',previousRevision:0,revision:1,createdAt:'2026-10-15'}));
  await assertFails(updateDoc(doc(admin,'admin_audit_logs','legacy-event'),{revision:99}));
  await assertFails(deleteDoc(doc(admin,'admin_audit_logs','legacy-event')));
});
test('admin settings and curriculum writes remain supported; students cannot mutate them',async()=>{
  await assertSucceeds(setDoc(doc(admin,'curriculum_nodes','_website_config'),{kind:'website_config',revision:1,config:{name:'Synthetic test'}}));
  await assertSucceeds(setDoc(doc(admin,'curriculum_nodes','synthetic-subject'),{kind:'subject',subject:{id:'synthetic-subject'}}));
  await assertFails(setDoc(doc(student,'curriculum_nodes','_website_config'),{role:'admin',revision:2}));
});
