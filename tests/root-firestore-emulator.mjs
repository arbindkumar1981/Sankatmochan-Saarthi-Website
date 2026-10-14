// Run only inside firebase emulators:exec. Imports resolve from the website root.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import test from 'node:test';
import {initializeApp, deleteApp} from 'firebase/app';
import {getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signOut} from 'firebase/auth';
import {getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, updateDoc, runTransaction, onSnapshot, terminate} from 'firebase/firestore';

test('website Firestore with grpc-js 1.13.7 preserves writes, transactions, watch and authorization', {timeout: 30000}, async () => {
  assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  const rootRequire = createRequire(import.meta.url);
  const firestoreRequire = createRequire(rootRequire.resolve('@firebase/firestore'));
  assert.equal(firestoreRequire('@grpc/grpc-js/package.json').version, '1.13.7');
  const clients = [];
  const denied = error => error.code === 'permission-denied';
  async function account() {
    const app = initializeApp({projectId: 'demo-saarthi-release', apiKey: 'demo-emulator-only'}, `root-sdk-${randomUUID()}`);
    const auth = getAuth(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', {disableWarnings: true});
    const db = getFirestore(app);
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    clients.push({app, db});
    const email = `root-${randomUUID()}@example.test`;
    const {user} = await createUserWithEmailAndPassword(auth, email, 'Synthetic-local-fixture-2026!');
    return {auth, db, user, email};
  }
  let unsubscribe;
  try {
    const student = await account(), other = await account();
    const profile = doc(student.db, 'users', student.user.uid);
    await setDoc(profile, {uid: student.user.uid, email: student.email, role: 'student', revision: 0});
    assert.equal((await getDoc(profile)).data().role, 'student');
    await runTransaction(student.db, async transaction => {
      const record = await transaction.get(profile);
      transaction.update(profile, {revision: record.data().revision + 1});
    });
    await new Promise((resolve, reject) => {
      unsubscribe = onSnapshot(profile, snapshot => {
        if (snapshot.data()?.revision === 1) resolve();
      }, reject);
    });
    unsubscribe(); unsubscribe = undefined;
    await assert.rejects(getDoc(doc(other.db, 'users', student.user.uid)), denied);
    await assert.rejects(updateDoc(profile, {role: 'admin'}), denied);
    await assert.rejects(setDoc(doc(student.db, 'admins', student.user.uid), {fixture: true}), denied);
    await signOut(student.auth);
    await assert.rejects(getDoc(profile), denied);
  } finally {
    unsubscribe?.();
    for (const {app, db} of clients) { await terminate(db); await deleteApp(app); }
  }
});
