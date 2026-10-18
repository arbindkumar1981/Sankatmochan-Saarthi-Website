import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertStagingGatewayConfig} from '../staging-gateway-config.mjs';
const synthetic = {
  VITE_SAARTHI_API_URL: '/api', VITE_FIREBASE_PROJECT_ID: 'demo-saarthi-staging',
  VITE_FIREBASE_API_KEY: 'synthetic-not-a-key', VITE_FIREBASE_AUTH_DOMAIN: 'demo-saarthi-staging.firebaseapp.com',
  VITE_FIREBASE_STORAGE_BUCKET: 'demo-saarthi-staging.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123', VITE_FIREBASE_APP_ID: 'synthetic',
  VITE_FIRESTORE_DATABASE_ID: '(default)', VITE_CMS_TENANT_ID: 'school-a',
};
test('gateway build accepts explicit isolated configuration', () => assert.doesNotThrow(() => assertStagingGatewayConfig(synthetic)));
test('gateway build rejects cross-origin API and production or incomplete Firebase configuration', () => {
  for (const patch of [{VITE_SAARTHI_API_URL:'https://evil.invalid'}, {VITE_FIREBASE_PROJECT_ID:'sankatmochan-509100'},
    {VITE_FIREBASE_API_KEY:''}, {VITE_FIREBASE_AUTH_DOMAIN:'production.firebaseapp.com'},
    {VITE_FIREBASE_STORAGE_BUCKET:'production.appspot.com'}, {VITE_FIRESTORE_DATABASE_ID:''}]) {
    assert.throws(() => assertStagingGatewayConfig({...synthetic, ...patch}));
  }
});
