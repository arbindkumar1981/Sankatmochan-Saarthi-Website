// Subprocess-only synthetic transport. No request can reach the network.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const fixtures = JSON.parse(await readFile(new URL('./eight-assets.json', import.meta.url)));
const stored = new Map();
let generated = 0;
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(input);
  const headers = new Headers(options.headers);
  if (url.hostname === 'issue87-api-staging.invalid') {
    assert.equal(headers.get('X-Serverless-Authorization'), 'Bearer synthetic-run-token');
    if (!headers.has('Authorization')) return new Response('{}', {status:401});
    assert.equal(headers.get('Authorization'), 'Bearer synthetic-owner-token');
    const request = JSON.parse(options.body);
    const fixture = fixtures.find(row => row.asset_type === request.asset_type);
    assert.ok(fixture);
    generated++;
    return Response.json({...fixture,topic_id:request.topic_id,language:request.language,
      provenance:[{source:'Synthetic official fixture',evidence_fingerprint:'fixture-1',source_url:'https://ncert.nic.in/fixture-1'}],
      quality_checks:{synthetic:true}});
  }
  // An infrastructure credential must never reach Firebase or static Hosting.
  assert.equal(headers.has('X-Serverless-Authorization'), false);
  if (url.hostname === 'issue87-site-staging.invalid') {
    assert.equal(headers.has('Authorization'), false);
    return new Response('synthetic website');
  }
  assert.equal(url.hostname, 'firestore.googleapis.com');
  assert.match(url.pathname, /^\/v1\/projects\/issue87-saarthi-staging\/databases\/\(default\)\/documents\/users\/issue87-owner\/saved_materials\//);
  if (headers.get('Authorization') !== 'Bearer synthetic-owner-token') return new Response('{}', {status:403});
  if (options.method === 'PATCH') stored.set(url.href, JSON.parse(options.body));
  assert.ok(stored.has(url.href));
  return Response.json(stored.get(url.href));
};
process.on('beforeExit', () => {
  assert.equal(generated, 8);
  assert.equal(stored.size, 8);
});
