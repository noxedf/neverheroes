// Ícones em traço (mesmo estilo dos Dons Primordiais). Usam a cor do texto ao redor.
const P = {
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 10c0-1 1-1.6 2.5-1.6s2.5.7 2.5 1.7c0 2.3-5 1.2-5 3.5 0 1 1 1.7 2.5 1.7s2.5-.7 2.5-1.6"/>',
  brain: '<path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 3 4.5 3 3 0 0 0 4 1.5V5.5a3 3 0 0 0-3-1zM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-3 4.5 3 3 0 0 1-4 1.5"/>',
  edom: '<circle cx="12" cy="12" r="8.5"/><path d="M12 6.5l5.5 5.5-5.5 5.5L6.5 12z"/>',
  ring: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/>',
  clover: '<circle cx="9" cy="9" r="3"/><circle cx="15" cy="9" r="3"/><circle cx="9" cy="15" r="3"/><circle cx="15" cy="15" r="3"/><path d="M12 12l-1 8"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  feather: '<path d="M20 4c-8 0-13 5-13 12l-2 4M20 4c0 7-5 12-12 12M9 15h6"/>',
  dumbbell: '<path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-1h13v15H6a2 2 0 0 0-2 2zM6 19h13"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  die: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r=".9"/><circle cx="15" cy="15" r=".9"/><circle cx="12" cy="12" r=".9"/><circle cx="15" cy="9" r=".9"/><circle cx="9" cy="15" r=".9"/>',
  bag: '<path d="M8 8V6a4 4 0 0 1 8 0v2M5 8h14l1 12H4zM9 13h6"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  trend: '<path d="M4 19V5M4 19h16M8 15l4-5 3 3 5-7"/>'
};
export const ico = (n, c) => (P[n] ? `<svg class="i${c ? " " + c : ""}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>` : n == null ? "" : String(n));
export function pintarIcones(r) {
  (r || document).querySelectorAll("[data-i]").forEach((e) => { if (!e.firstChild) e.innerHTML = ico(e.dataset.i); });
}
