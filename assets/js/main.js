import { Calculator, PRESETS } from "./calculator.js";
import { Storage } from "./storage.js";
import { debounce, showToast } from "./utils.js";
import { ChartManager } from "./charts.js";
import { ACHIEVEMENTS, POINTS, evaluateAchievements, generateQuizProblem, checkQuizAnswer } from "./gamification.js";
import {
  downloadCSV, downloadJSON, downloadPDF, generateShareURL, parseURLParams,
  copyLinkToClipboard, renderQR, downloadQRPNG,
} from "./exportModule.js";
import {
  renderResults, renderHeatmap, renderSchematic, renderAchievements,
  renderLeaderboard, renderProjects, setFieldError, updatePointsBadge, applyTheme,
} from "./ui.js";

const FIELD_IDS = ["z11", "z12", "z21", "z22", "i1", "i2"];
const chartManager = new ChartManager("main-chart");

let lastParams = null;
let currentQuizProblem = null;

// ---------------------------------------------------------------------
// Cálculo / validación
// ---------------------------------------------------------------------

function readAndValidate() {
  let allValid = true;
  const values = {};
  for (const id of FIELD_IDS) {
    const el = document.getElementById(id);
    const result = Calculator.validateInput(el.value);
    setFieldError(id, result.valid ? "" : result.message);
    if (!result.valid) allValid = false;
    else values[id.toUpperCase()] = result.value;
  }
  return allValid ? values : null;
}

function buildParamsFromValues(values) {
  const calc = new Calculator();
  calc.setZMatrix(values.Z11, values.Z12, values.Z21, values.Z22);
  calc.setCurrents(values.I1, values.I2);
  return calc.getParameters();
}

function renderAll(params) {
  lastParams = params;
  renderResults(params);
  renderHeatmap(params);
  renderSchematic(params);
  chartManager.refresh(params, Storage.getHistory());
}

function fillInputs(values) {
  for (const key of Object.keys(values)) {
    const el = document.getElementById(key.toLowerCase());
    if (el) el.value = values[key];
  }
}

function refreshAchievementsAndPoints(paramsForContext) {
  const quizStats = Storage.getQuizStats();
  const context = {
    calcCount: Storage.getCalcCount(),
    av: paramsForContext ? paramsForContext.Av : null,
    eta: paramsForContext ? paramsForContext.eta : null,
    quizCorrect: quizStats.correct,
    quizAttempts: quizStats.attempts,
    projectsCount: Storage.getProjects().length,
  };
  const newly = evaluateAchievements(context, Storage.getAchievements());
  newly.forEach((id) => unlockAchievement(id));
  renderAchievements(Storage.getAchievements());
  updatePointsBadge(Storage.getPoints());
}

function unlockAchievement(id) {
  const wasNew = Storage.unlockAchievement(id);
  if (wasNew) {
    Storage.addPoints(POINTS.ACHIEVEMENT);
    const meta = ACHIEVEMENTS.find((a) => a.id === id);
    showToast(`🏅 Logro desbloqueado: ${meta.name} (+${POINTS.ACHIEVEMENT} pts)`, "achievement", 4500);
  }
  return wasNew;
}

function commitCalculation(params) {
  Storage.incrementCalcCount();
  Storage.addHistoryEntry(params);
  Storage.addPoints(POINTS.CALC);
  renderAll(params);
  updatePointsBadge(Storage.getPoints());
  refreshAchievementsAndPoints(params);
  showToast(`Cálculo registrado (+${POINTS.CALC} pts)`, "success");
}

const debouncedPreview = debounce(() => {
  const values = readAndValidate();
  if (values) renderAll(buildParamsFromValues(values));
}, 300);

// ---------------------------------------------------------------------
// Inputs / presets
// ---------------------------------------------------------------------

function wireInputs() {
  FIELD_IDS.forEach((id) => {
    document.getElementById(id).addEventListener("input", debouncedPreview);
  });

  document.getElementById("calculate-btn").addEventListener("click", () => {
    const values = readAndValidate();
    if (!values) {
      showToast("Corrige los campos marcados en rojo.", "error");
      return;
    }
    commitCalculation(buildParamsFromValues(values));
  });

  document.getElementById("preset-select").addEventListener("change", (e) => {
    const key = e.target.value;
    if (!key || !PRESETS[key]) return;
    const preset = PRESETS[key];
    fillInputs({ Z11: preset.Z11, Z12: preset.Z12, Z21: preset.Z21, Z22: preset.Z22, I1: preset.I1, I2: preset.I2 });
    FIELD_IDS.forEach((id) => setFieldError(id, ""));
    commitCalculation(buildParamsFromValues(preset));
    showToast(`Preset cargado: ${preset.label}`, "info");
  });
}

// ---------------------------------------------------------------------
// Proyectos guardados
// ---------------------------------------------------------------------

function refreshProjectsList() {
  renderProjects(Storage.getProjects(), {
    onLoad: (id) => {
      const project = Storage.getProjects().find((p) => p.id === id);
      if (!project) return;
      fillInputs(project.params);
      FIELD_IDS.forEach((fid) => setFieldError(fid, ""));
      commitCalculation(buildParamsFromValues(project.params));
      showToast(`Proyecto "${project.name}" cargado.`, "info");
    },
    onDelete: (id) => {
      Storage.deleteProject(id);
      refreshProjectsList();
      showToast("Proyecto eliminado.", "info");
    },
  });
}

function saveCurrentAsProject(name) {
  const values = readAndValidate();
  if (!values) {
    showToast("Corrige los campos marcados en rojo antes de guardar.", "error");
    return;
  }
  Storage.saveProject(name, values);
  refreshProjectsList();
  refreshAchievementsAndPoints(lastParams);
  showToast(`Proyecto "${name}" guardado.`, "success");
}

function wireProjects() {
  document.getElementById("save-project-btn").addEventListener("click", () => {
    const nameInput = document.getElementById("project-name");
    const name = nameInput.value.trim() || "Proyecto sin nombre";
    saveCurrentAsProject(name);
    nameInput.value = "";
  });

  document.getElementById("save-preset-btn").addEventListener("click", () => {
    const count = Storage.getProjects().length + 1;
    saveCurrentAsProject(`Preset personalizado ${count}`);
  });

  refreshProjectsList();
}

// ---------------------------------------------------------------------
// Gráficos
// ---------------------------------------------------------------------

function wireCharts() {
  document.querySelectorAll(".chart-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".chart-tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      chartManager.render(tab.dataset.chart, lastParams, Storage.getHistory());
    });
  });

  document.getElementById("chart-reset-zoom").addEventListener("click", () => chartManager.resetZoom());
  document.getElementById("chart-download").addEventListener("click", () => chartManager.downloadPNG());
}

// ---------------------------------------------------------------------
// Quiz + gamificación
// ---------------------------------------------------------------------

function wireQuiz() {
  document.getElementById("quiz-new-btn").addEventListener("click", () => {
    const difficulty = document.getElementById("quiz-difficulty").value;
    currentQuizProblem = generateQuizProblem(difficulty);
    document.getElementById("quiz-problem").textContent = currentQuizProblem.promptText;
    document.getElementById("quiz-feedback").textContent = "";
    document.getElementById("quiz-feedback").className = "quiz-feedback";
    document.getElementById("quiz-answer").value = "";
  });

  document.getElementById("quiz-submit-btn").addEventListener("click", () => {
    if (!currentQuizProblem) {
      showToast("Genera un problema primero.", "error");
      return;
    }
    const userAnswer = document.getElementById("quiz-answer").value;
    const { correct, diffPercent } = checkQuizAnswer(userAnswer, currentQuizProblem.correctAnswer);
    Storage.registerQuizAttempt(correct);
    const feedbackEl = document.getElementById("quiz-feedback");

    if (correct) {
      Storage.addPoints(POINTS.QUIZ_CORRECT);
      feedbackEl.textContent = `¡Correcto! (+${POINTS.QUIZ_CORRECT} pts). Presiona "Nuevo problema" para continuar.`;
      feedbackEl.className = "quiz-feedback correct";
    } else {
      feedbackEl.textContent = `Incorrecto (desviación ${diffPercent === null ? "N/D" : diffPercent.toFixed(1) + "%"}). ` +
        `La respuesta correcta era ${currentQuizProblem.correctAnswer.toFixed(6)} ${currentQuizProblem.unit}. Presiona "Nuevo problema" para continuar.`;
      feedbackEl.className = "quiz-feedback incorrect";
    }
    currentQuizProblem = null;
    updatePointsBadge(Storage.getPoints());
    refreshAchievementsAndPoints(lastParams);
  });
}

function wireLeaderboard() {
  renderLeaderboard(Storage.getLeaderboard());

  document.getElementById("leaderboard-save-btn").addEventListener("click", () => {
    const nameInput = document.getElementById("leaderboard-name");
    const name = nameInput.value.trim() || "Anónimo";
    const list = Storage.addLeaderboardEntry(name, Storage.getPoints());
    renderLeaderboard(list);
    nameInput.value = "";
    showToast("Puntuación guardada en la tabla de posiciones.", "success");
  });

  document.getElementById("leaderboard-reset-btn").addEventListener("click", () => {
    if (!confirm("¿Reiniciar la tabla de posiciones local? Esta acción no se puede deshacer.")) return;
    Storage.resetLeaderboard();
    renderLeaderboard([]);
  });
}

// ---------------------------------------------------------------------
// Exportación / compartir
// ---------------------------------------------------------------------

function wireExport() {
  document.getElementById("export-csv-btn").addEventListener("click", () => {
    if (!lastParams) return;
    downloadCSV(lastParams);
  });

  document.getElementById("export-json-btn").addEventListener("click", () => {
    if (!lastParams) return;
    downloadJSON(lastParams);
  });

  document.getElementById("export-pdf-btn").addEventListener("click", async () => {
    if (!lastParams) return;
    showToast("Generando PDF…", "info");
    const chartDataURL = chartManager.chart ? chartManager.chart.toBase64Image() : null;
    const ok = await downloadPDF(lastParams, chartDataURL);
    if (ok) {
      showToast("PDF descargado.", "success");
      unlockAchievement("professional");
      renderAchievements(Storage.getAchievements());
      updatePointsBadge(Storage.getPoints());
    }
  });

  document.getElementById("copy-link-btn").addEventListener("click", () => {
    if (!lastParams) return;
    copyLinkToClipboard(lastParams);
  });

  document.getElementById("show-qr-btn").addEventListener("click", () => {
    if (!lastParams) return;
    const modal = document.getElementById("qr-modal");
    modal.classList.remove("hidden");
    renderQR(document.getElementById("qr-canvas-container"), generateShareURL(lastParams));
  });

  document.getElementById("qr-modal-close").addEventListener("click", () => {
    document.getElementById("qr-modal").classList.add("hidden");
  });

  document.getElementById("qr-download-btn").addEventListener("click", () => {
    downloadQRPNG(document.getElementById("qr-canvas-container"), "parametros-z-qr.png");
  });
}

// ---------------------------------------------------------------------
// Tema
// ---------------------------------------------------------------------

function wireTheme() {
  const saved = Storage.getTheme();
  const initial = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(initial);

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    Storage.setTheme(next);
    applyTheme(next);
    if (lastParams) renderAll(lastParams);
  });
}

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------

function init() {
  wireTheme();
  wireInputs();
  wireProjects();
  wireCharts();
  wireQuiz();
  wireLeaderboard();
  wireExport();

  updatePointsBadge(Storage.getPoints());
  renderAchievements(Storage.getAchievements());

  const urlParams = parseURLParams();
  if (Object.keys(urlParams).length) {
    fillInputs(urlParams);
    showToast("Parámetros cargados desde el enlace compartido.", "info");
  }

  const values = readAndValidate();
  if (values) renderAll(buildParamsFromValues(values));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
