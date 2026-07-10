import { downloadBlob, timestampSlug, showToast } from "./utils.js";

const SHARE_KEYS = ["Z11", "Z12", "Z21", "Z22", "I1", "I2"];
const CSV_ROWS = [
  ["Z11 (Ω)", "Z11"], ["Z12 (Ω)", "Z12"], ["Z21 (Ω)", "Z21"], ["Z22 (Ω)", "Z22"],
  ["I1 (A)", "I1"], ["I2 (A)", "I2"],
  ["V1 (V)", "V1"], ["V2 (V)", "V2"],
  ["Zin (Ω)", "Zin"], ["Zout (Ω)", "Zout"],
  ["Av", "Av"], ["Ai", "Ai"],
  ["P1 (W)", "P1"], ["P2 (W)", "P2"], ["Pdis (W)", "Pdis"],
  ["Eficiencia (%)", "eta"], ["Determinante", "det"],
];

export function toCSV(params) {
  const lines = ["Parámetro,Valor"];
  for (const [label, key] of CSV_ROWS) {
    const value = params[key];
    lines.push(`${label},${value === null || value === undefined ? "" : value}`);
  }
  return lines.join("\n");
}

export function downloadCSV(params) {
  downloadBlob(`parametros-z-${timestampSlug()}.csv`, toCSV(params), "text/csv;charset=utf-8;");
}

export function downloadJSON(params) {
  const payload = { generatedAt: new Date().toISOString(), parameters: params };
  downloadBlob(`parametros-z-${timestampSlug()}.json`, JSON.stringify(payload, null, 2), "application/json");
}

// html2canvas (el motor de captura de html2pdf) no entiende funciones CSS
// modernas como color-mix()/color() que Chrome usa en controles nativos de
// formulario. Por eso el PDF se genera a partir de un informe propio, aislado
// de los <input>/<select> de la UI, con colores fijos en hexadecimal.
function buildReportHTML(params, chartDataURL) {
  const rows = CSV_ROWS.map(([label, key]) => {
    const value = params[key];
    const text = value === null || value === undefined ? "—" : value;
    return `<tr><td style="padding:6px 10px;border-bottom:1px solid #dbe1ee;">${label}</td><td style="padding:6px 10px;border-bottom:1px solid #dbe1ee;font-family:monospace;">${text}</td></tr>`;
  }).join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#12172b;background:#ffffff;padding:28px;width:720px;">
      <h1 style="margin:0 0 4px;font-size:20px;">Calculadora de Parámetros Z</h1>
      <p style="color:#5b6478;margin:0 0 20px;font-size:12px;">Informe generado ${new Date().toLocaleString()}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #12172b;">Parámetro</th>
            <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #12172b;">Valor</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${chartDataURL ? `<h2 style="margin:24px 0 8px;font-size:15px;">Gráfico</h2><img src="${chartDataURL}" style="max-width:100%;border:1px solid #dbe1ee;" />` : ""}
    </div>`;
}

export async function downloadPDF(params, chartDataURL) {
  if (typeof window.html2pdf === "undefined") {
    showToast("El generador de PDF aún no está listo, intenta de nuevo en un momento.", "error");
    return false;
  }
  const container = document.getElementById("pdf-report");
  container.innerHTML = buildReportHTML(params, chartDataURL);
  try {
    await window.html2pdf()
      .set({
        margin: 10,
        filename: `parametros-z-${timestampSlug()}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .save();
    return true;
  } finally {
    container.innerHTML = "";
  }
}

export function generateShareURL(params) {
  const url = new URL(window.location.href);
  url.search = "";
  for (const key of SHARE_KEYS) {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.set(key, params[key]);
    }
  }
  return url.toString();
}

export function parseURLParams() {
  const url = new URL(window.location.href);
  const result = {};
  for (const key of SHARE_KEYS) {
    const raw = url.searchParams.get(key);
    if (raw !== null && raw !== "" && Number.isFinite(Number(raw))) {
      result[key] = Number(raw);
    }
  }
  return result;
}

export async function copyLinkToClipboard(params) {
  const link = generateShareURL(params);
  try {
    await navigator.clipboard.writeText(link);
    showToast("Enlace copiado al portapapeles.", "success");
  } catch {
    showToast(`Copia manual: ${link}`, "info", 6000);
  }
  return link;
}

export function renderQR(containerEl, text) {
  if (typeof window.QRCode === "undefined") {
    showToast("El generador de QR aún no está listo, intenta de nuevo en un momento.", "error");
    return;
  }
  containerEl.innerHTML = "";
  // eslint-disable-next-line no-new
  new window.QRCode(containerEl, {
    text,
    width: 240,
    height: 240,
    correctLevel: window.QRCode.CorrectLevel.M,
  });
}

export function downloadQRPNG(containerEl, filename) {
  const canvas = containerEl.querySelector("canvas");
  if (!canvas) {
    showToast("Genera el QR antes de descargarlo.", "error");
    return;
  }
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}
