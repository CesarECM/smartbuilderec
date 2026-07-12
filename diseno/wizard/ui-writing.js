// ─── wizard/ui-writing.js — Efecto typewriter para sugerencias de IA ─────────

/**
 * Escribe `texto` en `elemento` carácter a carácter con un delay entre cada uno.
 * Si el elemento ya tiene contenido, lo reemplaza.
 * Devuelve una promesa que resuelve cuando termina la escritura.
 *
 * @param {HTMLElement} elemento  — textarea o element con .value / .textContent
 * @param {string}      texto     — texto completo a escribir
 * @param {number}      [delay=12] — milisegundos entre caracteres
 */
export function escribirConDelay(elemento, texto, delay = 12) {
  return new Promise(resolve => {
    const esInput = "value" in elemento;
    if (esInput) elemento.value = "";
    else         elemento.textContent = "";

    let i = 0;
    const tick = () => {
      if (i >= texto.length) { resolve(); return; }
      if (esInput) elemento.value += texto[i];
      else         elemento.textContent += texto[i];
      i++;
      setTimeout(tick, delay);
    };
    tick();
  });
}

/**
 * Igual que escribirConDelay pero cancela la escritura anterior si se llama
 * de nuevo sobre el mismo elemento antes de que termine.
 * Devuelve una función cancel().
 */
export function escribirConDelayCancelable(elemento, texto, delay = 12) {
  let cancelled = false;

  const promise = new Promise(resolve => {
    const esInput = "value" in elemento;
    if (esInput) elemento.value = "";
    else         elemento.textContent = "";

    let i = 0;
    const tick = () => {
      if (cancelled || i >= texto.length) { resolve(); return; }
      if (esInput) elemento.value += texto[i];
      else         elemento.textContent += texto[i];
      i++;
      setTimeout(tick, delay);
    };
    tick();
  });

  return { promise, cancel: () => { cancelled = true; } };
}
