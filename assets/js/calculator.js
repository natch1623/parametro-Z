// Lógica de cálculo de parámetros Z para redes de dos puertos.
// V1 = Z11*I1 + Z12*I2
// V2 = Z21*I1 + Z22*I2

export class Calculator {
  constructor() {
    this.Z11 = 0;
    this.Z12 = 0;
    this.Z21 = 0;
    this.Z22 = 0;
    this.I1 = 0;
    this.I2 = 0;
  }

  setZMatrix(z11, z12, z21, z22) {
    this.Z11 = z11;
    this.Z12 = z12;
    this.Z21 = z21;
    this.Z22 = z22;
  }

  setCurrents(i1, i2) {
    this.I1 = i1;
    this.I2 = i2;
  }

  calculateV1() {
    return this.Z11 * this.I1 + this.Z12 * this.I2;
  }

  calculateV2() {
    return this.Z21 * this.I1 + this.Z22 * this.I2;
  }

  determinant() {
    return this.Z11 * this.Z22 - this.Z12 * this.Z21;
  }

  // Matriz [Y] = [Z]^-1, útil para conversiones y como referencia bonus.
  inverse() {
    const det = this.determinant();
    if (det === 0) return null;
    return {
      Y11: this.Z22 / det,
      Y12: -this.Z12 / det,
      Y21: -this.Z21 / det,
      Y22: this.Z11 / det,
    };
  }

  getParameters() {
    const V1 = this.calculateV1();
    const V2 = this.calculateV2();
    const Zin = this.I1 !== 0 ? V1 / this.I1 : null;
    const Zout = this.I2 !== 0 ? V2 / this.I2 : null;
    const Av = V1 !== 0 ? V2 / V1 : null;
    const Ai = this.I1 !== 0 ? this.I2 / this.I1 : null;
    const P1 = V1 * this.I1;
    const P2 = V2 * this.I2;
    const Pdis = P1 - P2;
    const eta = P1 !== 0 ? Math.abs(P2 / P1) * 100 : null;

    return {
      Z11: this.Z11, Z12: this.Z12, Z21: this.Z21, Z22: this.Z22,
      I1: this.I1, I2: this.I2,
      V1, V2, Zin, Zout, Av, Ai, P1, P2, Pdis, eta,
      det: this.determinant(),
    };
  }

  static validateInput(rawValue, { min = -Infinity, max = Infinity } = {}) {
    if (rawValue === "" || rawValue === null || rawValue === undefined) {
      return { valid: false, message: "Requerido" };
    }
    const n = Number(rawValue);
    if (!Number.isFinite(n)) {
      return { valid: false, message: "Debe ser numérico" };
    }
    if (n < min || n > max) {
      return { valid: false, message: `Rango: ${min} a ${max}` };
    }
    return { valid: true, value: n };
  }
}

export const PRESETS = {
  bjt: {
    label: "BJT pequeña señal",
    Z11: 1000, Z12: 5, Z21: 80000, Z22: 50000,
    I1: 0.00002, I2: -0.0016,
  },
  filtro: {
    label: "Filtro pasa-bajos",
    Z11: 2200, Z12: 0, Z21: 0, Z22: 600,
    I1: 0.001, I2: -0.0005,
  },
  ampInv: {
    label: "Amplificador inversor",
    Z11: 10000, Z12: 0, Z21: -100000, Z22: 100,
    I1: 0.0001, I2: -0.00095,
  },
};

export function formatEngineering(value, unit = "") {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) {
    return `${value.toExponential(3)} ${unit}`.trim();
  }
  const decimals = abs >= 100 ? 2 : abs >= 1 ? 3 : 5;
  return `${value.toFixed(decimals)} ${unit}`.trim();
}
