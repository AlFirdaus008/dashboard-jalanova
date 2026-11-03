import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { THEME_STORAGE_KEY, normalizeThemePreference, readThemePreference, resolveTheme, createThemeController } from '../src/lib/theme.mjs';

function environment({ saved = null, dark = false, storageBlocked = false, forcedTheme } = {}) {
  let value = saved;
  const storage = {
    getItem(key) { assert.equal(key, THEME_STORAGE_KEY); if (storageBlocked) throw Error('Blocked'); return value; },
    setItem(key, next) { assert.equal(key, THEME_STORAGE_KEY); if (storageBlocked) throw Error('Blocked'); value = next; },
  };
  const media = new EventTarget(); media.matches = dark;
  const events = new EventTarget();
  const root = { dataset: {}, style: {} };
  const states = [];
  const meta = { content: '', setAttribute(name, next) { assert.equal(name, 'content'); this.content = next; } };
  const controller = createThemeController({ storage, media, events, root, meta, forcedTheme, onChange: state => states.push(state) });
  return {
    storage, root, meta, states, controller, get stored() { return value; },
    systemChange(next) { media.matches = next; media.dispatchEvent(new Event('change')); },
    storageChange(next) { const event = new Event('storage'); Object.assign(event, { key: THEME_STORAGE_KEY, newValue: next }); events.dispatchEvent(event); },
  };
}

test('Default follows the device, while explicit light/dark always override it', () => {
  assert.equal(resolveTheme('default', true), 'dark');
  assert.equal(resolveTheme('default', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(normalizeThemePreference('invalid'), 'default');
  assert.equal(readThemePreference({ getItem: () => 'invalid' }), 'default');
});

test('theme preference persists and survives controller recreation', () => {
  const e = environment({ dark: false });
  e.controller.setPreference('dark');
  assert.equal(e.stored, 'dark');
  assert.equal(e.root.dataset.theme, 'dark');
  assert.equal(e.root.dataset.themePreference, 'dark');
  assert.equal(e.root.style.colorScheme, 'dark');
  assert.equal(e.meta.content, '#012a44');
  e.controller.destroy();
  const fresh = environment({ saved: e.stored, dark: false });
  assert.equal(fresh.root.dataset.theme, 'dark');
  fresh.controller.setPreference('light');
  assert.equal(fresh.root.style.colorScheme, 'light');
  assert.equal(fresh.meta.content, '#f0f8ff');
  fresh.controller.destroy();
});

test('device changes are live only in Default; returning to Default resumes them', () => {
  const e = environment({ dark: false });
  e.systemChange(true); assert.equal(e.root.dataset.theme, 'dark');
  e.controller.setPreference('light');
  e.systemChange(false); e.systemChange(true);
  assert.equal(e.root.dataset.theme, 'light');
  e.controller.setPreference('default');
  assert.equal(e.root.dataset.theme, 'dark');
  e.systemChange(false); assert.equal(e.root.dataset.theme, 'light');
  const count = e.states.length;
  e.controller.destroy(); e.systemChange(true);
  assert.equal(e.states.length, count);
});

test('blocked browser storage still permits theme changes for the current session', () => {
  const e = environment({ dark: true, storageBlocked: true });
  assert.equal(e.root.dataset.themePreference, 'default');
  assert.equal(e.root.dataset.theme, 'dark');
  assert.doesNotThrow(() => e.controller.setPreference('light'));
  assert.equal(e.root.dataset.theme, 'light');
  e.controller.destroy();
});

test('theme changes synchronize across tabs and storage reset restores Default', () => {
  const e = environment({ saved: 'light', dark: true });
  e.storageChange('dark'); assert.equal(e.root.dataset.theme, 'dark');
  e.storageChange(null);
  assert.equal(e.root.dataset.themePreference, 'default');
  assert.equal(e.root.dataset.theme, 'dark');
  e.systemChange(false); assert.equal(e.root.dataset.theme, 'light');
  e.controller.destroy();
});

test('temporarily locked light theme ignores stored choices, device changes and requests to switch', () => {
  const e = environment({ saved: 'dark', dark: true, forcedTheme: 'light' });
  assert.equal(e.root.dataset.theme, 'light');
  assert.equal(e.root.style.colorScheme, 'light');
  assert.equal(e.meta.content, '#f0f8ff');
  e.systemChange(false); e.systemChange(true); e.storageChange('dark');
  e.controller.setPreference('dark'); e.controller.setPreference('default');
  assert.equal(e.root.dataset.theme, 'light');
  assert.equal(e.states.length, 1);
  assert.equal(e.stored, 'dark');
  e.controller.destroy();
});

test('pre-paint bootstrap always applies light, including with a saved dark choice or blocked storage', () => {
  const bootstrap = fs.readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');
  for (const saved of [null, 'default', 'light', 'dark', 'invalid']) for (const dark of [false, true]) {
    const root = { dataset: {}, style: {} };
    const context = { localStorage: { getItem: () => saved }, matchMedia: () => ({ matches: dark }), document: { documentElement: root, querySelector: () => null } };
    vm.runInNewContext(bootstrap, context);
    assert.equal(root.dataset.theme, 'light');
    assert.equal(root.dataset.themePreference, 'light');
    assert.equal(root.style.colorScheme, root.dataset.theme);
  }
  const root = { dataset: {}, style: {} };
  vm.runInNewContext(bootstrap, { localStorage: { getItem() { throw Error('Blocked'); } }, matchMedia: () => ({ matches: true }), document: { documentElement: root, querySelector: () => null } });
  assert.equal(root.dataset.theme, 'light');
});
