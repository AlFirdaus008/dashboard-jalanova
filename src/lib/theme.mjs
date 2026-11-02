export const THEME_STORAGE_KEY = 'jalanova-theme';
export const THEME_PREFERENCES = ['light', 'dark', 'default'];

export function normalizeThemePreference(value) {
  return THEME_PREFERENCES.includes(value) ? value : 'default';
}

export function readThemePreference(storage) {
  try {
    return normalizeThemePreference((storage ?? globalThis.localStorage)?.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'default';
  }
}

export function resolveTheme(preference, systemIsDark = false) {
  const value = normalizeThemePreference(preference);
  return value === 'default' ? (systemIsDark ? 'dark' : 'light') : value;
}

export function createThemeController({ storage, media, root, meta, events, forcedTheme, onChange = () => {} }) {
  const locked = forcedTheme === 'light' || forcedTheme === 'dark';
  let preference = locked ? forcedTheme : readThemePreference(storage);
  const apply = () => {
    const resolved = resolveTheme(preference, media?.matches);
    root.dataset.theme = resolved;
    root.dataset.themePreference = preference;
    root.style.colorScheme = resolved;
    meta?.setAttribute('content', resolved === 'dark' ? '#121b17' : '#fbfbf6');
    onChange({ preference, resolved });
  };
  const setPreference = value => {
    if (locked) return;
    preference = normalizeThemePreference(value);
    try { (storage ?? globalThis.localStorage)?.setItem(THEME_STORAGE_KEY, preference); } catch { /* The choice still works when browser storage is unavailable. */ }
    apply();
  };
  const handleSystemChange = () => { if (preference === 'default') apply(); };
  const handleStorageChange = event => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      preference = normalizeThemePreference(event.newValue);
      apply();
    }
  };
  if (!locked) {
    media?.addEventListener('change', handleSystemChange);
    events?.addEventListener('storage', handleStorageChange);
  }
  apply();
  return {
    setPreference,
    destroy() {
      media?.removeEventListener('change', handleSystemChange);
      events?.removeEventListener('storage', handleStorageChange);
    },
  };
}
