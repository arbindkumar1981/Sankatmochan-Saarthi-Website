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
test('notes metadata, versions, recovery, quotas and audit are server-owned for every client role', async () => {
  for (const db of [admin, student, forged, anonymous, environment.unauthenticatedContext().firestore()]) {
    for (const path of ['managed_notes/note-a', 'managed_notes/note-a/versions/v00000001', 'notes_uploads/upload-a', 'notes_audit/event-a', 'notes_quotas/quota-a']) {
      await assertFails(getDoc(doc(db, path)));
      await assertFails(setDoc(doc(db, path), { published: true, source: 'admin_uploaded' }));
      await assertFails(deleteDoc(doc(db, path)));
    }
    await assertFails(setDoc(doc(db, 'notes_editors', 'student-a'), { enabled: true }));
  }
});
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

test('anonymous membership cannot authorize privileged operations', async () => {
  await assertFails(getDocs(collection(anonymous, 'users')));
  await assertFails(getDoc(doc(anonymous, 'admin_audit_logs', 'legacy-event')));
  await assertFails(setDoc(doc(anonymous, 'curriculum_nodes', 'anonymous-subject'), {kind:'subject'}));
  await assertFails(setDoc(doc(anonymous, 'admins', 'forged-a'), {enabled:true}));
});
test('students can edit their mistakes but cannot transfer ownership or edit another student', async () => {
  const own = doc(student, 'mistakes', 'ownership-regression');
  await assertSucceeds(setDoc(own, {studentUid:'student-a', note:'synthetic'}));
  await assertSucceeds(updateDoc(own, {note:'corrected'}));
  await assertFails(updateDoc(own, {studentUid:'other-student'}));
  const other = environment.authenticatedContext('other-student',{firebase:{sign_in_provider:'google.com'}}).firestore();
  await assertFails(updateDoc(doc(other, 'mistakes', 'ownership-regression'), {note:'forged'}));
  await assertSucceeds(updateDoc(doc(admin, 'mistakes', 'ownership-regression'), {note:'admin correction'}));
});

// Enabling V1 removes the broad legacy membership bypass and all client writes.
test('V1 cutover denies legacy admin bypass and forged server-owned records', async () => {
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(),'control_policy','enforcement'),{enabled:true});
  });
  try {
    for (const db of [admin,student,forged]) {
      await assertFails(setDoc(doc(db,'admins','self-promoted'),{enabled:true}));
      await assertFails(setDoc(doc(db,'curriculum_nodes','v1-forgery'),{kind:'subject'}));
      await assertFails(setDoc(doc(db,'control_admin_members','self'),{role:'super_admin',tenant:'other'}));
      await assertFails(setDoc(doc(db,'control_invitations','forged'),{role:'super_admin'}));
      await assertFails(setDoc(doc(db,'control_cms','other'),{revision:99}));
      await assertFails(setDoc(doc(db,'control_audit','forged'),{action:'fake'}));
      for (const path of [['control_access_grants','forged'],['control_initializations','other'],['control_evaluation_jobs','other','jobs','forged'],['control_evaluation_drains','other']]) {
        await assertFails(setDoc(doc(db,...path),{state:'forged',role:'super_admin'}));
        await assertFails(getDoc(doc(db,...path)));
      }
      await assertFails(setDoc(doc(db,'test_results','forged-v1'),{studentUid:'student-a',score:100,totalMarks:100}));
    }
  } finally {
    await environment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(),'control_policy','enforcement'),{enabled:false});
    });
  }
});
