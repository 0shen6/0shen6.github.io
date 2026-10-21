// Theme toggle: cycles light/dark and persists the choice in localStorage.
// With no stored choice the page follows prefers-color-scheme.

const STORAGE_KEY = "theme";
const THEMES = ["light", "dark"];
const THEME_COLORS = { dark: "#0b0f14", light: "#f6f4ee" };

const root = document.documentElement;
const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStored(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode, disabled): keep the in-page choice only.
  }
}

function systemTheme() {
  return media && media.matches ? "light" : "dark";
}

export function currentTheme() {
  const attr = root.getAttribute("data-theme");
  return THEMES.includes(attr) ? attr : systemTheme();
}

function syncMeta(theme) {
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", THEME_COLORS[theme]));
}

function syncButtons(theme) {
  const next = theme === "dark" ? "light" : "dark";
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.setAttribute("aria-label", `Switch to ${next} theme`);
    btn.setAttribute("title", `Switch to ${next} theme`);
  });
}

export function applyTheme(theme, { persist = false } = {}) {
  if (!THEMES.includes(theme)) return;
  root.setAttribute("data-theme", theme);
  syncMeta(theme);
  syncButtons(theme);
  if (persist) writeStored(theme);
}

export function toggleTheme() {
  const index = THEMES.indexOf(currentTheme());
  applyTheme(THEMES[(index + 1) % THEMES.length], { persist: true });
}

export function initTheme() {
  const stored = readStored();
  if (stored) {
    applyTheme(stored);
  } else {
    // Follow the OS without pinning data-theme, so CSS media queries stay in charge.
    root.removeAttribute("data-theme");
    syncMeta(systemTheme());
    syncButtons(systemTheme());
  }

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", toggleTheme);
  });

  if (media) {
    const onChange = () => {
      if (readStored()) return;
      syncMeta(systemTheme());
      syncButtons(systemTheme());
    };
    if (media.addEventListener) media.addEventListener("change", onChange);
    else if (media.addListener) media.addListener(onChange);
  }
}

initTheme();
