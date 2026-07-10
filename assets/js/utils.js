// Utilidades compartidas.

export function debounce(fn, wait = 300) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Interpola de verde (bajo) a rojo (alto) en HSL, t entre 0 y 1.
export function heatColor(t) {
  const clamped = clamp(t, 0, 1);
  const hue = 120 - clamped * 120; // 120=verde, 0=rojo
  return `hsl(${hue}, 75%, 65%)`;
}

export function showToast(message, type = "info", ms = 3200) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

export function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
