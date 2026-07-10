// Wrapper de localStorage — toda la persistencia de la app vive aquí.

const KEYS = {
  theme: "pz_theme",
  points: "pz_points",
  achievements: "pz_achievements",
  leaderboard: "pz_leaderboard",
  projects: "pz_projects",
  history: "pz_history",
  quizStats: "pz_quiz_stats",
  calcCount: "pz_calc_count",
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("No se pudo guardar en localStorage:", err);
  }
}

export const Storage = {
  // ---- tema ----
  getTheme() { return localStorage.getItem(KEYS.theme); },
  setTheme(theme) { localStorage.setItem(KEYS.theme, theme); },

  // ---- puntos ----
  getPoints() { return readJSON(KEYS.points, 0); },
  addPoints(amount) {
    const total = this.getPoints() + amount;
    writeJSON(KEYS.points, total);
    return total;
  },

  // ---- contador de cálculos ----
  getCalcCount() { return readJSON(KEYS.calcCount, 0); },
  incrementCalcCount() {
    const total = this.getCalcCount() + 1;
    writeJSON(KEYS.calcCount, total);
    return total;
  },

  // ---- logros ----
  getAchievements() { return readJSON(KEYS.achievements, []); },
  unlockAchievement(id) {
    const list = this.getAchievements();
    if (!list.includes(id)) {
      list.push(id);
      writeJSON(KEYS.achievements, list);
      return true;
    }
    return false;
  },

  // ---- leaderboard ----
  getLeaderboard() { return readJSON(KEYS.leaderboard, []); },
  addLeaderboardEntry(name, points) {
    const list = this.getLeaderboard();
    list.push({ name, points, date: new Date().toISOString() });
    list.sort((a, b) => b.points - a.points);
    const top = list.slice(0, 10);
    writeJSON(KEYS.leaderboard, top);
    return top;
  },
  resetLeaderboard() { writeJSON(KEYS.leaderboard, []); },

  // ---- historial de cálculos (para gráfico de línea/scatter) ----
  getHistory() { return readJSON(KEYS.history, []); },
  addHistoryEntry(entry) {
    const list = this.getHistory();
    list.push({ ...entry, ts: Date.now() });
    const trimmed = list.slice(-50);
    writeJSON(KEYS.history, trimmed);
    return trimmed;
  },

  // ---- proyectos guardados ----
  getProjects() { return readJSON(KEYS.projects, []); },
  saveProject(name, params) {
    const list = this.getProjects();
    const project = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name, params, date: new Date().toISOString() };
    list.unshift(project);
    const trimmed = list.slice(0, 50);
    writeJSON(KEYS.projects, trimmed);
    return trimmed;
  },
  deleteProject(id) {
    const list = this.getProjects().filter((p) => p.id !== id);
    writeJSON(KEYS.projects, list);
    return list;
  },

  // ---- estadísticas de quiz ----
  getQuizStats() { return readJSON(KEYS.quizStats, { correct: 0, attempts: 0 }); },
  registerQuizAttempt(isCorrect) {
    const stats = this.getQuizStats();
    stats.attempts += 1;
    if (isCorrect) stats.correct += 1;
    writeJSON(KEYS.quizStats, stats);
    return stats;
  },
};
