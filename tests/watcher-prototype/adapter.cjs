// Scoped Firebase CLI adapter based on reviewed PR #53; used by the vendored CLI.
const {EventEmitter} = require('node:events');
const path = require('node:path');
const chokidar = require('chokidar');
const anymatch = require('anymatch');
const picomatch = require('picomatch');
const normalize = value => value.replaceAll('\\', '/');
const list = value => Array.isArray(value) ? value.flat() : [value];

class FSWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    this.cwd = options.cwd || process.cwd();
    this.records = new Map();
    this.closed = false;
    const ignored = options.ignored ? anymatch(options.ignored, undefined, {dot: true}) : undefined;
    // anymatch accepts additional callback arguments as an array. Passing the
    // matcher directly loses Stats because its second parameter is returnIndex.
    this.raw = new chokidar.FSWatcher({...options, ...(ignored ? {ignored: (file, stats) => ignored([file, stats])} : {})});
    this.raw.on('all', (event, file, stats) => {
      if (!this.closed && this.matches(file, event.endsWith('Dir'))) {
        this.emit(event, file, stats);
        this.emit('all', event, file, stats);
      }
    });
    // Forward low-level events without changing the high-level glob filtering.
    this.raw.on('raw', (...args) => {
      if (!this.closed) this.emit('raw', ...args);
    });
    this.raw.on('ready', () => this.emit('ready'));
    this.raw.on('error', error => this.emit('error', error));
  }
  describe(input) {
    if (typeof input !== 'string' || input.length === 0 || input.length > 4096) {
      throw new TypeError('Prototype watch paths must be bounded nonempty strings');
    }
    // Explicit security limit, not a claim of compatibility with arbitrary patterns.
    let depth = 0;
    for (const character of input) {
      if (character === '{' && ++depth > 64) throw new RangeError('Prototype brace nesting exceeds 64');
      if (character === '}') depth = Math.max(0, depth - 1);
    }
    const negative = input.startsWith('!');
    const value = normalize(negative ? input.slice(1) : input);
    const scan = picomatch.scan(value);
    const absolute = normalize(path.resolve(this.cwd, value));
    const base = scan.isGlob ? scan.base || '.' : value;
    return {negative, glob: scan.isGlob, absolute, base, baseAbsolute: normalize(path.resolve(this.cwd, base)),
      matcher: scan.isGlob ? picomatch(absolute, {dot: true}) : undefined};
  }
  add(inputs) {
    if (this.closed) throw new Error('Prototype watcher is closed');
    for (const input of list(inputs)) {
      const record = this.describe(input);
      this.records.set(input, record);
      if (!record.negative) this.raw.add(record.base);
    }
    return this;
  }
  matches(file, directory = false) {
    const absolute = normalize(path.resolve(this.cwd, file));
    const matchesRecord = record => record.glob
      ? record.matcher(absolute) || (directory && (absolute === record.baseAbsolute || absolute.startsWith(record.baseAbsolute + '/')))
      : absolute === record.absolute || absolute.startsWith(record.absolute + '/');
    return [...this.records.values()].some(record => !record.negative && matchesRecord(record)) &&
      ![...this.records.values()].some(record => record.negative && matchesRecord(record));
  }
  unwatch(inputs) {
    for (const input of list(inputs)) {
      const record = this.records.get(input);
      if (!record) continue;
      this.records.delete(input);
      if (![...this.records.values()].some(other => !other.negative && other.baseAbsolute === record.baseAbsolute)) this.raw.unwatch(record.base);
    }
    return this;
  }
  getWatched() { return this.raw.getWatched(); }
  async close() { this.closed = true; this.records.clear(); await this.raw.close(); }
}
module.exports = {FSWatcher, watch: (paths, options) => new FSWatcher(options).add(paths)};
