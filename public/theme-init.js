// Theme selection is temporarily disabled. Keep the logo readable before React loads.
(() => {
  const theme = 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#fbfbf6');
})();
