// Petit retour haptique (vibration) sur les appareils compatibles (Android).
export function haptic(ms = 10): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(ms);
    } catch {
      // ignore
    }
  }
}
