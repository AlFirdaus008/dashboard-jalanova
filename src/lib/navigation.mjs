// Commit only the newest navigation when rapid clicks overlap browser snapshots.
export function createRouteTransition({ document, commit, reducedMotion = () => false }) {
  let active = null;
  let version = 0;
  return {
    navigate(route) {
      const request = ++version;
      active?.skipTransition();
      const update = () => { if (request === version) commit(route); };
      if (!document.startViewTransition || reducedMotion()) { update(); return; }
      try {
        const transition = document.startViewTransition(update);
        active = transition;
        transition.ready.catch(() => {});
        transition.finished.catch(() => {}).finally(() => { if (active === transition) active = null; });
      } catch { update(); }
    },
    destroy() { version++; active?.skipTransition(); active = null; },
  };
}
