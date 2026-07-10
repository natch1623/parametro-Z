import { Calculator, formatEngineering } from "./calculator.js";

export const ACHIEVEMENTS = [
  { id: "first_calc", icon: "🎯", name: "Primer paso", description: "Realiza tu primer cálculo." },
  { id: "hundred_calc", icon: "💯", name: "Computador", description: "Realiza 100 cálculos." },
  { id: "perfect_gain", icon: "🎚️", name: "Ganancia perfecta", description: "Obtén Av ≈ 1 (±2%)." },
  { id: "power_engineer", icon: "🔋", name: "Ingeniero de potencia", description: "Logra una eficiencia η > 90%." },
  { id: "quiz_master", icon: "🧠", name: "Quiz master", description: "Responde 10 preguntas correctas." },
  { id: "patience", icon: "⏳", name: "Paciencia", description: "Intenta el quiz 50 veces." },
  { id: "collector", icon: "🗂️", name: "Coleccionista", description: "Guarda 5 proyectos." },
  { id: "professional", icon: "🎓", name: "Profesional", description: "Exporta un PDF de resultados." },
];

export const POINTS = {
  CALC: 10,
  QUIZ_CORRECT: 50,
  ACHIEVEMENT: 100,
};

// Devuelve la lista de ids de logros recién desbloqueados según el contexto actual.
export function evaluateAchievements(context, alreadyUnlocked) {
  const has = (id) => alreadyUnlocked.includes(id);
  const newly = [];

  if (!has("first_calc") && context.calcCount >= 1) newly.push("first_calc");
  if (!has("hundred_calc") && context.calcCount >= 100) newly.push("hundred_calc");
  if (!has("perfect_gain") && context.av !== null && Math.abs(Math.abs(context.av) - 1) <= 0.02) newly.push("perfect_gain");
  if (!has("power_engineer") && context.eta !== null && context.eta > 90) newly.push("power_engineer");
  if (!has("quiz_master") && context.quizCorrect >= 10) newly.push("quiz_master");
  if (!has("patience") && context.quizAttempts >= 50) newly.push("patience");
  if (!has("collector") && context.projectsCount >= 5) newly.push("collector");

  return newly;
}

function randomFloat(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateQuizProblem(difficulty = "medio") {
  let Z11, Z12, Z21, Z22, I1, I2, askFor;

  if (difficulty === "facil") {
    Z11 = randomChoice([100, 200, 500, 1000, 2000]);
    Z22 = randomChoice([50, 100, 250, 500]);
    Z12 = 0;
    Z21 = 0;
    I1 = randomChoice([0.01, 0.02, 0.05, 0.1]);
    I2 = randomChoice([-0.005, -0.01, -0.02]);
    askFor = randomChoice(["V1", "V2"]);
  } else if (difficulty === "medio") {
    Z11 = randomFloat(200, 3000, 0);
    Z12 = randomFloat(1, 100, 1);
    Z21 = randomFloat(1000, 50000, 0);
    Z22 = randomFloat(100, 5000, 0);
    I1 = randomFloat(0.0001, 0.05, 5);
    I2 = -randomFloat(0.0001, 0.01, 5);
    askFor = randomChoice(["V1", "V2"]);
  } else {
    Z11 = randomFloat(100, 5000, 2);
    Z12 = randomFloat(0.1, 200, 2);
    Z21 = randomFloat(500, 100000, 2);
    Z22 = randomFloat(50, 10000, 2);
    I1 = randomFloat(0.00001, 0.02, 6);
    I2 = -randomFloat(0.00001, 0.005, 6);
    askFor = randomChoice(["Zin", "Zout", "Av", "eta"]);
  }

  const calc = new Calculator();
  calc.setZMatrix(Z11, Z12, Z21, Z22);
  calc.setCurrents(I1, I2);
  const params = calc.getParameters();

  const unitMap = { V1: "V", V2: "V", Zin: "Ω", Zout: "Ω", Av: "", eta: "%" };
  const correctAnswer = params[askFor];

  const promptText =
    `Z11 = ${formatEngineering(Z11, "Ω")}   Z12 = ${formatEngineering(Z12, "Ω")}\n` +
    `Z21 = ${formatEngineering(Z21, "Ω")}   Z22 = ${formatEngineering(Z22, "Ω")}\n` +
    `I1 = ${formatEngineering(I1, "A")}   I2 = ${formatEngineering(I2, "A")}\n\n` +
    `¿Cuál es el valor de ${askFor}? (${unitMap[askFor] || "unidad"})`;

  return { difficulty, given: { Z11, Z12, Z21, Z22, I1, I2 }, askFor, correctAnswer, unit: unitMap[askFor] || "", promptText };
}

export function checkQuizAnswer(userAnswer, correctAnswer) {
  const user = Number(userAnswer);
  if (!Number.isFinite(user) || correctAnswer === null || correctAnswer === undefined) {
    return { correct: false, diffPercent: null };
  }
  if (Math.abs(correctAnswer) < 1e-9) {
    const correct = Math.abs(user - correctAnswer) < 1e-6;
    return { correct, diffPercent: 0 };
  }
  const diffPercent = Math.abs((user - correctAnswer) / correctAnswer) * 100;
  return { correct: diffPercent <= 2, diffPercent };
}
