// Modelo da ficha e regras do inventário (usado pela visualização e pelo editor).
export const STATUS = [
  ["sorte", "Sorte", "🍀"], ["vontade", "Vontade", "🔥"],
  ["foco", "Foco", "🎯"], ["destreza", "Destreza", "🕊️"],
  ["forca", "Força", "💪"], ["agilidade", "Agilidade", "🏃"],
  ["intelecto", "Intelecto", "📖"], ["constituicao", "Constituição", "🛡️"],
  ["carisma", "Carisma", "🎭"]
];
export const ESPACO_BASE = 30; // "Espaço 00/30" da ficha

export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export function num(v, d) { const n = parseFloat(v); return isFinite(n) ? n : (d === undefined ? 0 : d); }
const r2 = (n) => Math.round(n * 100) / 100;
export const fmt = (n) => String(r2(n)).replace(".", ",");

// Imagens só entram se forem data-URL de imagem: o Mestre abre fichas de outras pessoas.
export function safeImg(v) {
  return typeof v === "string" && v.length < 400000 && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v) ? v : "";
}

export function itemVazio() {
  return { name: "", espaco: 1, qty: 1, tipo: "comum", effectValue: "", effectDesc: "", backpackEquipped: false, backpackBonus: 0, description: "", image: "" };
}
export function itemShape(it) {
  if (typeof it === "string") return { ...itemVazio(), name: it.slice(0, 80) };
  it = it || {};
  const q = parseInt(it.qty, 10);
  return {
    name: String(it.name || "").slice(0, 80),
    espaco: Math.max(0, num(it.espaco, 1)),
    qty: isNaN(q) ? 1 : Math.max(0, q),
    tipo: it.tipo === "consumivel" || it.tipo === "mochila" ? it.tipo : "comum",
    effectValue: String(it.effectValue || "").slice(0, 40),
    effectDesc: String(it.effectDesc || "").slice(0, 300),
    backpackEquipped: !!it.backpackEquipped,
    backpackBonus: Math.max(0, num(it.backpackBonus, 0)),
    description: String(it.description || "").slice(0, 1500),
    image: safeImg(it.image)
  };
}

export function novaFicha() {
  const status = {}; STATUS.forEach((s) => (status[s[0]] = ""));
  return {
    info: { nome: "", idade: "", altura: "", fama: 0, hp: "", money: 0, sanidade: 100 },
    dom: { nome: "", categorias: "", edom: 100, edomMax: 100 },
    status, inventario: [itemVazio()], habilidades: [], passivas: [], aparencia: "", retrato: ""
  };
}

// Aceita fichas antigas (mochila = 30 textos) e converte para itens.
export function normalizar(raw) {
  raw = raw || {};
  const b = novaFicha();
  let inv;
  if (Array.isArray(raw.inventario)) inv = raw.inventario.map(itemShape);
  else if (Array.isArray(raw.mochila)) inv = raw.mochila.filter((x) => String(x || "").trim()).map(itemShape);
  else inv = [];
  const lista = (l, comCusto) => (Array.isArray(l) ? l : []).map((x) => ({
    nome: String((x && x.nome) || "").slice(0, 80),
    ...(comCusto ? { custo: x && x.custo !== undefined && x.custo !== "" ? num(x.custo, "") : "" } : {}),
    desc: String((x && x.desc) || "").slice(0, 1500)
  }));
  return {
    info: { ...b.info, ...(raw.info || {}) },
    dom: { ...b.dom, ...(raw.dom || {}) },
    status: { ...b.status, ...(raw.status || {}) },
    inventario: inv.length ? inv : [itemVazio()],
    habilidades: lista(raw.habilidades, true),
    passivas: lista(raw.passivas, false),
    aparencia: String(raw.aparencia || ""),
    retrato: safeImg(raw.retrato)
  };
}

export const nomesNaoVazios = (items) => (items || []).filter((i) => String(i.name || "").trim());
export function espacoUsado(items) {
  return r2(nomesNaoVazios(items).reduce((s, i) => s + num(i.espaco, 0) * (parseInt(i.qty, 10) || 0), 0));
}
export function capacidade(items) {
  return r2(ESPACO_BASE + (items || []).reduce((s, i) => s + (i.tipo === "mochila" && i.backpackEquipped ? num(i.backpackBonus, 0) : 0), 0));
}
export function estado(usado, cap) {
  const c = cap > 0 ? cap : 1;
  if (usado > c) return { chave: "sobrecarga", rotulo: "Sobrecarregada", cls: "malign" };
  if (usado === c) return { chave: "cheia", rotulo: "Mochila cheia", cls: "malign" };
  if (usado >= c * 0.8) return { chave: "quase", rotulo: "Quase cheia", cls: "info" };
  return { chave: "livre", rotulo: "Com espaço", cls: "benign" };
}
export function resumoEspaco(items) {
  const usado = espacoUsado(items), cap = capacidade(items), st = estado(usado, cap);
  const extra = r2(cap - ESPACO_BASE);
  const pct = cap > 0 ? Math.max(0, Math.min(100, (usado / cap) * 100)) : 0;
  return `<div class="weight-summary-row">
    <span>Espaço usado: <b>${fmt(usado)}</b> / ${fmt(cap)}${extra ? ` <small>(base ${ESPACO_BASE} · mochila +${fmt(extra)})</small>` : ""}</span>
    <span class="tag ${st.cls}">${st.rotulo}</span></div>
    <div class="weight-gauge"><span class="weight-gauge-fill ${st.cls}" style="width:${pct}%"></span></div>
    ${usado > cap ? `<p class="hint" style="margin:.5rem 0 0">Você carrega ${fmt(usado - cap)} de espaço além do limite.</p>` : ""}`;
}
export const tipoRotulo = (t) => (t === "consumivel" ? "🧪 Consumível" : t === "mochila" ? "🎒 Mochila" : "📦 Item comum");
export const tipoIcone = (t) => (t === "consumivel" ? "🧪" : t === "mochila" ? "🎒" : "📦");
