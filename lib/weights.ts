export function weightInGrams(weight: unknown, unit: unknown) {
  if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0 || (unit !== "kg" && unit !== "lb")) return null;
  return Math.round(weight * (unit === "kg" ? 1000 : 453.59237));
}

export function weightFromGrams(grams: number, unit: "kg" | "lb") {
  return grams / (unit === "kg" ? 1000 : 453.59237);
}
