import { createRequire } from 'node:module';
import path from 'node:path';

// Pure loopback regression probe for GHSA-f596-whhp-79r4.
// The marker is a hard-coded synthetic fixture, never a real secret.
const packageDirectory = process.argv[2];
if (!packageDirectory) {
  console.error('Usage: node grpc-disclosure-probe.mjs <package-directory>');
  process.exit(2);
}
const require = createRequire(path.resolve(packageDirectory, 'package.json'));
const grpc = require('@grpc/grpc-js');
const version = require('@grpc/grpc-js/package.json').version;
const marker = 'SYNTHETIC_PRIVATE_DIAGNOSTIC_7391';
let failed = false;

for (const kind of ['serialize', 'deserialize']) {
  const common = {
    path: '/test.Probe/Call',
    requestStream: false,
    responseStream: false,
    requestSerialize: value => Buffer.from(JSON.stringify(value)),
    requestDeserialize: buffer => JSON.parse(buffer),
    responseSerialize: value => Buffer.from(JSON.stringify(value)),
    responseDeserialize: buffer => JSON.parse(buffer),
  };
  const service = {
    Call: {
      ...common,
      ...(kind === 'serialize'
        ? { responseSerialize: () => { throw Error(marker); } }
        : { requestDeserialize: () => { throw Error(marker); } }),
    },
  };
  const server = new grpc.Server();
  server.addService(service, { Call: (_call, callback) => callback(null, { ok: true }) });
  let client;
  try {
    const port = await new Promise((resolve, reject) => {
      server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(),
        (error, value) => error ? reject(error) : resolve(value));
    });
    const Client = grpc.makeGenericClientConstructor({ Call: common }, 'Probe');
    client = new Client(`127.0.0.1:${port}`, grpc.credentials.createInsecure());
    const error = await new Promise(resolve => {
      client.Call({ value: 1 }, { deadline: Date.now() + 5000 }, failure => resolve(failure));
    });
    const connected = error?.code === grpc.status.INTERNAL;
    const disclosed = error?.details?.includes(marker) ?? false;
    failed ||= !connected || disclosed;
    console.log(JSON.stringify({ version, kind, status: error?.code ?? null, connected, disclosed }));
  } catch {
    failed = true;
    console.log(JSON.stringify({ version, kind, status: null, connected: false, disclosed: null }));
  } finally {
    client?.close();
    server.forceShutdown();
  }
}
process.exitCode = failed ? 1 : 0;
