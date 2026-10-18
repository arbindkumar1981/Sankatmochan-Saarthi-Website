// Build-time isolation gate; never prints configuration values.
export function assertStagingGatewayConfig(env) {
  if (env.VITE_SAARTHI_API_URL !== '/api') throw new Error('Staging gateway requires same-origin /api.');
  const project = env.VITE_FIREBASE_PROJECT_ID;
  if (!/^[a-z][a-z0-9-]*-staging$/.test(project || '')) throw new Error('Isolated staging Firebase project required.');
  for (const name of ['API_KEY', 'AUTH_DOMAIN', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID']) {
    if (!env[`VITE_FIREBASE_${name}`]) throw new Error('Complete staging Firebase configuration required.');
  }
  if (env.VITE_FIREBASE_AUTH_DOMAIN !== `${project}.firebaseapp.com`
      || ![`${project}.appspot.com`, `${project}.firebasestorage.app`].includes(env.VITE_FIREBASE_STORAGE_BUCKET)
      || env.VITE_FIRESTORE_DATABASE_ID !== '(default)'
      || !/^[A-Za-z0-9_-]+$/.test(env.VITE_CMS_TENANT_ID || '')) {
    throw new Error('Staging Firebase resources and school must match the approved isolation manifest.');
  }
}
