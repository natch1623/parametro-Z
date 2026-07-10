// Gestión de los 5 gráficos (Chart.js) sobre un único canvas compartido.

const THEME = {
  primary: "#2454ff",
  accent: "#7c3aed",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  grid: "rgba(128,128,128,0.2)",
};

export class ChartManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
    this.activeType = "bar";
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  textColor() {
    return getComputedStyle(document.body).getPropertyValue("--color-text").trim() || "#12172b";
  }

  buildConfig(type, params, history) {
    const textColor = this.textColor();
    const common = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor } },
        tooltip: { enabled: true },
        zoom: {
          pan: { enabled: true, mode: "xy" },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "xy" },
        },
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: THEME.grid } },
        y: { ticks: { color: textColor }, grid: { color: THEME.grid } },
      },
    };

    if (type === "bar") {
      return {
        type: "bar",
        data: {
          labels: ["Z11", "Z12", "Z21", "Z22"],
          datasets: [{
            label: "Magnitud (Ω)",
            data: [params.Z11, params.Z12, params.Z21, params.Z22].map((v) => Math.abs(v)),
            backgroundColor: [THEME.primary, THEME.accent, THEME.success, THEME.warning],
          }],
        },
        options: common,
      };
    }

    if (type === "line") {
      return {
        type: "line",
        data: {
          labels: history.map((_, i) => `#${i + 1}`),
          datasets: [
            { label: "V1 (V)", data: history.map((h) => h.V1), borderColor: THEME.primary, backgroundColor: "rgba(36,84,255,0.15)", fill: true, tension: 0.3 },
            { label: "V2 (V)", data: history.map((h) => h.V2), borderColor: THEME.accent, backgroundColor: "rgba(124,58,237,0.15)", fill: true, tension: 0.3 },
          ],
        },
        options: common,
      };
    }

    if (type === "pie") {
      const P1 = Math.abs(params.P1 || 0);
      const P2 = Math.abs(params.P2 || 0);
      const Pdis = Math.abs(params.Pdis || 0);
      return {
        type: "pie",
        data: {
          labels: ["P1 (entrada)", "P2 (salida)", "Disipada"],
          datasets: [{
            data: [P1, P2, Pdis],
            backgroundColor: [THEME.primary, THEME.success, THEME.danger],
          }],
        },
        options: { ...common, scales: undefined },
      };
    }

    if (type === "radar") {
      return {
        type: "radar",
        data: {
          labels: ["Z11", "Z12", "Z21", "Z22"],
          datasets: [{
            label: "Magnitud (Ω)",
            data: [params.Z11, params.Z12, params.Z21, params.Z22].map((v) => Math.abs(v)),
            borderColor: THEME.primary,
            backgroundColor: "rgba(36,84,255,0.25)",
          }],
        },
        options: {
          ...common,
          scales: {
            r: {
              ticks: { color: textColor, backdropColor: "transparent" },
              grid: { color: THEME.grid },
              angleLines: { color: THEME.grid },
              pointLabels: { color: textColor },
            },
          },
        },
      };
    }

    if (type === "scatter") {
      return {
        type: "scatter",
        data: {
          datasets: [{
            label: "V1 vs V2",
            data: history.map((h) => ({ x: h.V1, y: h.V2 })),
            backgroundColor: THEME.accent,
            pointRadius: 6,
          }],
        },
        options: {
          ...common,
          scales: {
            x: { title: { display: true, text: "V1 (V)", color: textColor }, ticks: { color: textColor }, grid: { color: THEME.grid } },
            y: { title: { display: true, text: "V2 (V)", color: textColor }, ticks: { color: textColor }, grid: { color: THEME.grid } },
          },
        },
      };
    }

    throw new Error(`Tipo de gráfico desconocido: ${type}`);
  }

  render(type, params, history) {
    this.activeType = type;
    this.destroy();
    const config = this.buildConfig(type, params, history);
    // eslint-disable-next-line no-undef
    this.chart = new Chart(this.canvas, config);
  }

  refresh(params, history) {
    this.render(this.activeType, params, history);
  }

  resetZoom() {
    if (this.chart && typeof this.chart.resetZoom === "function") {
      this.chart.resetZoom();
    }
  }

  downloadPNG(filename = "grafico-parametros-z.png") {
    if (!this.chart) return;
    const link = document.createElement("a");
    link.href = this.chart.toBase64Image();
    link.download = filename;
    link.click();
  }
}
