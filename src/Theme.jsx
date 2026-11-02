import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { createThemeController, readThemePreference, resolveTheme } from './lib/theme.mjs';

const ThemeContext = createContext(null);
const options = [
  { value: 'light', label: 'Terang', description: 'Gunakan tema terang', Icon: Sun },
  { value: 'dark', label: 'Gelap', description: 'Gunakan tema gelap', Icon: Moon },
  { value: 'default', label: 'Default', description: 'Ikuti tema perangkat', Icon: Monitor },
];

export function ThemeProvider({ children, forcedTheme }) {
  const controller = useRef(null);
  const [theme, setTheme] = useState(() => {
    const preference = forcedTheme || readThemePreference();
    return { preference, resolved: resolveTheme(preference, window.matchMedia('(prefers-color-scheme: dark)').matches) };
  });
  useEffect(() => {
    controller.current = createThemeController({
      forcedTheme,
      media: window.matchMedia('(prefers-color-scheme: dark)'),
      root: document.documentElement,
      meta: document.querySelector('meta[name="theme-color"]'),
      events: window,
      onChange: setTheme,
    });
    return () => { controller.current?.destroy(); controller.current = null; };
  }, [forcedTheme]);
  return <ThemeContext.Provider value={{ ...theme, locked: Boolean(forcedTheme), setPreference: value => controller.current?.setPreference(value) }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeSwitch() {
  const { preference, setPreference, locked } = useTheme();
  const buttons = useRef([]);
  if (locked) return null;
  function onKeyDown(event) {
    const index = options.findIndex(option => option.value === preference);
    const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % options.length
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index + options.length - 1) % options.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    setPreference(options[next].value);
    buttons.current[next]?.focus();
  }
  return <div className="theme-switch" role="radiogroup" aria-label="Tema tampilan" onKeyDown={onKeyDown}>
    {options.map(({ value, label, description, Icon }, index) => <button
      key={value} ref={element => { buttons.current[index] = element; }}
      role="radio" aria-checked={preference === value} aria-label={`${label}: ${description}`}
      title={description} tabIndex={preference === value ? 0 : -1}
      className={preference === value ? 'active' : ''} onClick={() => setPreference(value)}
    ><Icon size={14} strokeWidth={1.7} /><span>{label}</span></button>)}
  </div>;
}
