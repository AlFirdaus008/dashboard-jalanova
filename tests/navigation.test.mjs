import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouteTransition } from '../src/lib/navigation.mjs';

function browser() {
  const frames = [], committed = [];
  const document = { startViewTransition(update) {
    const transition = { update, skips:0, ready:Promise.resolve(), finished:Promise.resolve(), skipTransition() { this.skips++; } };
    frames.push(transition); return transition;
  } };
  return { document, frames, committed, commit:route => committed.push(route) };
}
test('route changes wait for the browser snapshot before committing', () => {
  const e = browser(); const transition = createRouteTransition(e);
  transition.navigate('dashboard');
  assert.deepEqual(e.committed, []);
  e.frames[0].update();
  assert.deepEqual(e.committed, ['dashboard']);
});
test('fast navigation commits only the latest route and skips the previous animation', () => {
  const e = browser(); const transition = createRouteTransition(e);
  transition.navigate('dashboard'); transition.navigate('authority'); transition.navigate('about');
  e.frames[2].update(); e.frames[0].update(); e.frames[1].update();
  assert.deepEqual(e.committed, ['about']);
  assert.equal(e.frames[0].skips, 1); assert.equal(e.frames[1].skips, 1);
});
test('reduced motion and unsupported browsers navigate immediately', () => {
  const e = browser();
  createRouteTransition({ ...e, reducedMotion:() => true }).navigate('about');
  assert.equal(e.frames.length, 0); assert.deepEqual(e.committed, ['about']);
  createRouteTransition({ document:{}, commit:e.commit }).navigate('dashboard');
  assert.deepEqual(e.committed, ['about','dashboard']);
});
test('a rejected browser transition falls back, and teardown prevents pending commits', () => {
  const committed = [];
  createRouteTransition({ document:{ startViewTransition() { throw Error('unavailable'); } }, commit:r => committed.push(r) }).navigate('dashboard');
  assert.deepEqual(committed, ['dashboard']);
  const e = browser(); const transition = createRouteTransition(e);
  transition.navigate('authority'); transition.destroy(); e.frames[0].update();
  assert.deepEqual(e.committed, []); assert.equal(e.frames[0].skips, 1);
});
