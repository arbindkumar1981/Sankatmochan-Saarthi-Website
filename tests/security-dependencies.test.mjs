import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';
import postcss from 'postcss';
import {SourceMapConsumer, SourceMapGenerator} from 'source-map-js';

const require = createRequire(import.meta.url);
test('approved source-map and grpc versions resolve through their real consumers', () => {
  const firestore = createRequire(require.resolve('@firebase/firestore'));
  const css = createRequire(require.resolve('postcss'));
  assert.equal(firestore('@grpc/grpc-js/package.json').version, '1.13.6');
  assert.equal(css('source-map-js/package.json').version, '1.2.2');
});

test('source-map patch preserves generation, lookup and PostCSS map composition', async () => {
  const generator = new SourceMapGenerator({file: 'output.css'});
  generator.addMapping({generated: {line: 1, column: 0}, original: {line: 3, column: 2}, source: 'input.css'});
  generator.setSourceContent('input.css', '\n\n  a { color: red }');
  const consumer = new SourceMapConsumer(generator.toJSON());
  assert.deepEqual(consumer.originalPositionFor({line: 1, column: 0}), {source: 'input.css', line: 3, column: 2, name: null});
  const output = await postcss([]).process('a { color: red }', {from: 'input.css', to: 'output.css', map: {inline: false}});
  const mapped = new SourceMapConsumer(output.map.toJSON()).originalPositionFor({line: 1, column: 0});
  assert.equal(mapped.line, 1);
  assert.ok(mapped.source.endsWith('input.css'));
});

test('source-map rejects hostile indexed offsets before expensive flattening', () => {
  const leaf = {version: 3, sources: ['input.js'], names: [], mappings: 'AAAA'};
  const indexed = (line, map = leaf) => ({version: 3, sections: [{offset: {line, column: 0}, map}]});
  for (const line of [-1, 0.5, Infinity, 10000001, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => new SourceMapConsumer(indexed(line)), /offset/i);
  }
  assert.throws(() => new SourceMapConsumer(indexed(6000000, indexed(6000000))), /offset/i);
  const mappings = [];
  new SourceMapConsumer(indexed(2)).eachMapping(mapping => mappings.push(mapping));
  assert.equal(mappings.length, 1);
  assert.equal(mappings[0].source, 'input.js');
  assert.equal(mappings[0].generatedLine, 3);
});
