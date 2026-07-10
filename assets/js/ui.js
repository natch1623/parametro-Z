import { formatEngineering } from "./calculator.js";
import { heatColor, clamp } from "./utils.js";
import { ACHIEVEMENTS } from "./gamification.js";

const RESULT_TILES = [
  ["V1", "V1", "V"], ["V2", "V2", "V"],
  ["Zin", "Zin", "Ω"], ["Zout", "Zout", "Ω"],
  ["Av", "Av", ""], ["Ai", "Ai", ""],
  ["P1", "P1", "W"], ["P2", "P2", "W"],
  ["Pdis", "Pdis", "W"], ["η (eficiencia)", "eta", "%"],
];

export function renderResults(params) {
  const grid = document.getElementById("results-grid");
  grid.innerHTML = RESULT_TILES.map(([label, key, unit]) => `
    <div class="stat-tile">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${formatEngineering(params[key], unit)}</div>
    </div>
  `).join("");
}

export function renderHeatmap(params) {
  const container = document.getElementById("heatmap");
  const cells = [
    ["Z11", params.Z11], ["Z12", params.Z12],
    ["Z21", params.Z21], ["Z22", params.Z22],
  ];
  const max = Math.max(...cells.map(([, v]) => Math.abs(v)), 1e-9);
  container.innerHTML = cells.map(([label, value]) => `
    <div class="heatmap-cell" style="background-color:${heatColor(Math.abs(value) / max)}">
      <div class="hm-label">${label}</div>
      <div class="hm-value">${formatEngineering(value, "Ω")}</div>
    </div>
  `).join("");
}

function strokeWidth(value, max) {
  const ratio = max > 0 ? Math.abs(value) / max : 0;
  return (1.5 + ratio * 4.5).toFixed(2);
}

function signColor(value) {
  if (value > 0) return "#16a34a";
  if (value < 0) return "#dc2626";
  return "#9aa4c2";
}

export function renderSchematic(params) {
  const container = document.getElementById("schematic-container");
  const maxI = Math.max(Math.abs(params.I1), Math.abs(params.I2), 1e-9);
  const w1 = strokeWidth(params.I1, maxI);
  const w2 = strokeWidth(params.I2, maxI);
  const c1 = signColor(params.I1);
  const c2 = signColor(params.I2);

  const ratio1 = clamp(Math.abs(params.I1) / maxI, 0, 1);
  const ratio2 = clamp(Math.abs(params.I2) / maxI, 0, 1);
  const dur1 = (3 - ratio1 * 2.2).toFixed(2);
  const dur2 = (3 - ratio2 * 2.2).toFixed(2);
  const path1 = params.I1 >= 0 ? "M20,70 L140,70" : "M140,70 L20,70";
  const path2 = params.I2 >= 0 ? "M380,70 L500,70" : "M500,70 L380,70";

  container.innerHTML = `
  <svg viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg" aria-label="Diagrama esquemático de la red de dos puertos">
    <line x1="20" y1="70" x2="140" y2="70" stroke="${c1}" stroke-width="${w1}" marker-end="url(#arrow1)" />
    <line x1="380" y1="70" x2="500" y2="70" stroke="${c2}" stroke-width="${w2}" marker-end="url(#arrow2)" />
    <line x1="20" y1="70" x2="20" y2="190" stroke="var(--color-text-muted)" stroke-width="2" />
    <line x1="500" y1="70" x2="500" y2="190" stroke="var(--color-text-muted)" stroke-width="2" />
    <line x1="20" y1="190" x2="500" y2="190" stroke="var(--color-text-muted)" stroke-width="2" />

    <rect x="140" y="30" width="240" height="140" rx="12" fill="var(--color-surface-2)" stroke="var(--color-primary)" stroke-width="2" />
    <text x="260" y="95" text-anchor="middle" font-size="20" font-weight="700" fill="var(--color-text)">[Z]</text>
    <text x="260" y="118" text-anchor="middle" font-size="11" fill="var(--color-text-muted)">Red de dos puertos</text>

    <text x="80" y="55" text-anchor="middle" font-size="13" fill="${c1}" font-family="monospace">I1 = ${formatEngineering(params.I1, "A")}</text>
    <text x="440" y="55" text-anchor="middle" font-size="13" fill="${c2}" font-family="monospace">I2 = ${formatEngineering(params.I2, "A")}</text>

    <text x="6" y="130" text-anchor="middle" font-size="13" fill="var(--color-text)" font-family="monospace" transform="rotate(-90 6 130)">V1 = ${formatEngineering(params.V1, "V")}</text>
    <text x="634" y="130" text-anchor="middle" font-size="13" fill="var(--color-text)" font-family="monospace" transform="rotate(90 634 130)">V2 = ${formatEngineering(params.V2, "V")}</text>

    <defs>
      <marker id="arrow1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="${c1}" />
      </marker>
      <marker id="arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="${c2}" />
      </marker>
    </defs>

    <circle r="5" fill="${c1}">
      <animateMotion dur="${dur1}s" repeatCount="indefinite" path="${path1}" />
    </circle>
    <circle r="5" fill="${c2}">
      <animateMotion dur="${dur2}s" repeatCount="indefinite" path="${path2}" />
    </circle>
  </svg>`;
}

export function renderAchievements(unlockedIds) {
  const grid = document.getElementById("achievements-grid");
  grid.innerHTML = ACHIEVEMENTS.map((a) => `
    <div class="achievement-badge ${unlockedIds.includes(a.id) ? "unlocked" : ""}" title="${a.description}">
      <span class="badge-icon">${a.icon}</span>
      <span class="badge-name">${a.name}</span>
    </div>
  `).join("");
}

export function renderLeaderboard(list) {
  const el = document.getElementById("leaderboard-list");
  if (!list.length) {
    el.innerHTML = `<li>Sin puntuaciones guardadas todavía.</li>`;
    return;
  }
  el.innerHTML = list.map((entry) => `
    <li><span>${entry.name}</span><span>${entry.points} pts</span></li>
  `).join("");
}

export function renderProjects(list, handlers) {
  const el = document.getElementById("projects-list");
  if (!list.length) {
    el.innerHTML = `<li>No hay proyectos guardados.</li>`;
    return;
  }
  el.innerHTML = list.map((p) => `
    <li>
      <span>${p.name}</span>
      <span class="project-actions">
        <button type="button" data-action="load" data-id="${p.id}">Cargar</button>
        <button type="button" class="delete" data-action="delete" data-id="${p.id}">Eliminar</button>
      </span>
    </li>
  `).join("");

  el.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === "load") handlers.onLoad(id);
      if (btn.dataset.action === "delete") handlers.onDelete(id);
    });
  });
}

export function setFieldError(id, message) {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(`${id}-error`);
  if (input) input.classList.toggle("invalid", Boolean(message));
  if (errorEl) errorEl.textContent = message || "";
}

export function updatePointsBadge(points) {
  document.getElementById("points-value").textContent = points;
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("theme-icon").textContent = theme === "dark" ? "☀️" : "🌙";
}
