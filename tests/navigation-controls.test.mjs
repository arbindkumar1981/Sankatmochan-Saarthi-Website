import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const result = await build({ absWorkingDir: fileURLToPath(new URL('../', import.meta.url)), stdin: { contents: "export * from './src/services/websiteConfig'; export * from './src/services/navigationAppearance';", resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false });
const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const config = () => structuredClone(api.DEFAULT_WEBSITE_CONFIG);

test('legacy settings retain dashboard/admin access without changing stored identities', () => {
  const c = config(); c.navigation = c.navigation.filter(x => !['materials', 'admin'].includes(x.id));
  api.validateWebsiteConfig(c);
  const rows = api.managedNavigation(c.navigation);
  assert.equal(rows[0].id, 'materials'); assert.equal(rows.at(-1).id, 'admin');
  assert.equal(c.navigation.length, 6);
});
test('menu appearance and reorder round trip without modifying destinations or learning records', () => {
  const c = config(), original = structuredClone(c.navigation);
  c.navigation[1] = { ...c.navigation[1], icon: 'home', subtitle: 'Start learning', hindiSubtitle: 'सीखें' };
  c.navigation = api.moveMenuItem(c.navigation, 1, 1);
  const saved = api.validateWebsiteConfig(JSON.parse(JSON.stringify(c)));
  assert.equal(saved.navigation[2].id, 'learning'); assert.equal(saved.navigation[2].icon, 'home');
  assert.deepEqual(original.map(x => x.id).sort(), saved.navigation.map(x => x.id).sort());
  assert.deepEqual(api.moveMenuItem(original, 0, -1), original);
  assert.deepEqual(c.modules, config().modules);
});
test('remove and restore retain icon and identity; protected access cannot be removed', () => {
  const c = config(), row = c.navigation.find(x => x.id === 'youtube'); row.icon = 'video'; row.deleted = true;
  assert.ok(api.validateWebsiteConfig(c)); row.deleted = false;
  assert.equal(api.validateWebsiteConfig(c).navigation.find(x => x.id === 'youtube').icon, 'video');
  for (const id of ['materials', 'admin']) { const changed = config(); changed.navigation.find(x => x.id === id).deleted = true; assert.throws(() => api.validateWebsiteConfig(changed), /access/); }
});
test('custom pages and learning resources permit safe icons and reject scripts or unbounded descriptions', () => {
  const c = config(); c.pages.push({ id: 'help', title: 'Study help', hindiTitle: '', body: 'Support details', hindiBody: '', icon: 'phone' });
  c.modules.push({ id: 'resource-extra', label: 'Extra notes', hindiLabel: '', icon: 'file' });
  assert.ok(api.validateWebsiteConfig(c));
  for (const rows of [c.navigation, c.modules, c.pages]) { const old = rows[0].icon; rows[0].icon = '<script>'; assert.throws(() => api.validateWebsiteConfig(c), /icon/); rows[0].icon = old; }
  c.navigation[0].subtitle = 'x'.repeat(161); assert.throws(() => api.validateWebsiteConfig(c), /descriptions/);
});
