/**
 * TransformPDF — Theme Manager
 * Controls light/dark mode with system preference detection & persistence
 * Developer: Rabiul Hasan | rabiulhasan613@gmail.com
 */

'use strict';

const ThemeManager = (() => {
  const STORAGE_KEY = 'transformpdf_theme';
  let current = 'light';

  function _applyTheme(theme) {
    current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Update toggle button icon & aria
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? 'লাইট মোডে যান' : 'ডার্ক মোডে যান');
      btn.setAttribute('title', theme === 'dark' ? 'Switch to Light' : 'Switch to Dark');
    }

    // Meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#0ea5e9');
    }

    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initial = saved || (systemDark ? 'dark' : 'light');
    _applyTheme(initial);

    // System preference listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        _applyTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Keyboard shortcut: Ctrl+Shift+T
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        toggle();
      }
    });
  }

  function toggle() {
    _applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  function get() { return current; }

  return { init, toggle, get };
})();

window.ThemeManager = ThemeManager;
