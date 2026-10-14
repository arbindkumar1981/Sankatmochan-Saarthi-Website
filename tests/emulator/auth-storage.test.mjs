// Disposable local identities. Never create Firebase cloud users or print ID tokens.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {test} from 'node:test';
import {initializeApp, deleteApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,createUserWithEmailAndPassword,signOut} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,setDoc,getDoc,updateDoc} from 'firebase/firestore';
import {getStorage,connectStorageEmulator,ref,uploadBytes,getMetadata} from 'firebase/storage';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';

test('real local Auth sessions enforce profile, admin upload and student publication rules',async()=>{
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:9099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8080');
  assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST,'127.0.0.1:9199');
  const projectId='demo-saarthi-release';
  const env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8080,rules:await readFile(new URL('../../firestore.rules',import.meta.url),'utf8')},storage:{host:'127.0.0.1',port:9199,rules:await readFile(new URL('../../storage.rules',import.meta.url),'utf8')}});
  const apps=[];
  async function account(role){
    const app=initializeApp({projectId,apiKey:'demo-emulator-only',storageBucket:`${projectId}.appspot.com`},`fixture-${randomUUID()}`);
    apps.push(app);
    const auth=getAuth(app);
    connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
    const db=getFirestore(app);connectFirestoreEmulator(db,'127.0.0.1',8080);
    const storage=getStorage(app);connectStorageEmulator(storage,'127.0.0.1',9199);
    const email=`${role}-${randomUUID()}@example.test`;
    // Public synthetic fixture password; not a production credential.
    const {user}=await createUserWithEmailAndPassword(auth,email,'Local-fixture-only-2026!');
    if(role==='admin')await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'admins',user.uid),{fixture:true}));
    await assertSucceeds(setDoc(doc(db,'users',user.uid),{uid:user.uid,email,role}));
    return {auth,db,storage,user};
  }
  try{
    const admin=await account('admin'),student=await account('student'),other=await account('student');
    await assertFails(updateDoc(doc(student.db,'users',student.user.uid),{role:'admin'}));
    await assertFails(getDoc(doc(other.db,'users',student.user.uid)));
    const id=`auth-fixture-${randomUUID()}`;
    const path=`learning-materials/${admin.user.uid}/${randomUUID()}-branded-fixture.pdf`;
    await assertSucceeds(uploadBytes(ref(admin.storage,path),new TextEncoder().encode('%PDF-local-fixture'),{contentType:'application/pdf'}));
    await assertFails(getMetadata(ref(student.storage,path)));
    const draft={board:'CBSE',classGrade:'Class 12',subjectId:'biology',chapterId:'cells',contentType:'detailed_notes',version:1,requiresServerReview:true,approved:false,published:false,storagePath:path,attachmentType:'application/pdf'};
    await assertSucceeds(setDoc(doc(admin.db,'learning_contents',id),draft));
    await assertFails(getDoc(doc(student.db,'learning_contents',id)));
    await assertFails(updateDoc(doc(admin.db,'learning_contents',id),{approved:true,published:true}));
    // Trusted write emulates publication; backend review/API/Neon is a separate gate.
    await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'learning_contents',id),{approved:true,published:true}));
    await assertSucceeds(getDoc(doc(student.db,'learning_contents',id)));
    await signOut(student.auth);
    await assertFails(getDoc(doc(student.db,'learning_contents',id)));
  }finally{
    await Promise.all(apps.map(deleteApp));await env.cleanup();
  }
});
