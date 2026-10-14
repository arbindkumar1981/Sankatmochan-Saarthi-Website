import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const gaxiosRequire = createRequire(require.resolve('gaxios'));
const uuid = gaxiosRequire('uuid');
const {Gaxios} = require('gaxios');

test('gaxios resolves the exact approved UUID with CommonJS v4 compatibility', () => {
  assert.equal(gaxiosRequire('uuid/package.json').version, '11.1.1');
  assert.equal(require('gaxios/package.json').version, '6.7.1');
  const manifest = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
  assert.deepEqual(manifest.overrides['gaxios@6.7.1'], {uuid: '11.1.1'});
  const ids = Array.from({length: 100}, () => uuid.v4());
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.ok(uuid.validate(id));
    assert.equal(uuid.version(id), 4);
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  }
});

test('actual gaxios multipart path emits valid distinct boundaries and intact bodies', async () => {
  const boundaries = [];
  const client = new Gaxios();
  for (let index = 0; index < 2; index++) {
    const response = await client.request({
      url: 'https://example.invalid/uuid-compatibility',
      method: 'POST',
      multipart: [
        {headers: {'Content-Type': 'application/json'}, content: '{"fixture":true}'},
        {headers: {'Content-Type': 'text/plain'}, content: 'synthetic fixture'},
      ],
      // Exercise request preparation and the real body stream without network or credentials.
      adapter: async options => {
        const boundary = options.headers['Content-Type'].split('boundary=')[1];
        assert.ok(uuid.validate(boundary));
        assert.equal(uuid.version(boundary), 4);
        boundaries.push(boundary);
        const chunks = [];
        for await (const chunk of options.body) chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks).toString('utf8');
        assert.equal(body, `--${boundary}\r\nContent-Type: application/json\r\n\r\n{"fixture":true}\r\n--${boundary}\r\nContent-Type: text/plain\r\n\r\nsynthetic fixture\r\n--${boundary}--`);
        return {status: 200, statusText: 'OK', headers: {}, data: 'verified', config: options};
      },
    });
    assert.equal(response.data, 'verified');
  }
  assert.notEqual(boundaries[0], boundaries[1]);
});

test('patched UUID rejects undersized caller buffers for v3, v5 and v6', () => {
  for (const version of ['v3', 'v5']) {
    assert.throws(() => uuid[version]('fixture', uuid[version].DNS, new Uint8Array(15)), RangeError);
    assert.throws(() => uuid[version]('fixture', uuid[version].DNS, new Uint8Array(16), 1), RangeError);
  }
  assert.throws(() => uuid.v6({}, new Uint8Array(15)), RangeError);
  assert.throws(() => uuid.v6({}, new Uint8Array(16), 1), RangeError);
});
