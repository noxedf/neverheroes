// Avisos, confirmação no estilo do site e opções de leitura (tamanho do texto e tema).
import { pintarIcones } from "./icons.js";
let caixa;
export function aviso(msg, tipo = "erro") {
  if (!caixa) { caixa = document.createElement("div"); caixa.className = "toasts"; caixa.setAttribute("aria-live", "polite"); document.body.append(caixa); }
  const t = document.createElement("div");
  t.className = "toast " + tipo; t.setAttribute("role", tipo === "erro" ? "alert" : "status"); t.textContent = msg;
  caixa.append(t);
  setTimeout(() => { t.classList.add("sai"); setTimeout(() => t.remove(), 300); }, tipo === "erro" ? 6500 : 3200);
}
export function confirmar(msg, o = {}) {
  return new Promise((res) => {
    const f = document.createElement("div"); f.className = "modal";
    f.innerHTML = '<div class="modal-box" role="alertdialog" aria-modal="true" aria-labelledby="mdMsg"><p id="mdMsg"></p><div class="modal-btns"><button type="button" class="btn sec" data-r="0"></button><button type="button" class="btn" data-r="1"></button></div></div>';
    f.querySelector("#mdMsg").textContent = msg;
    const [b0, b1] = f.querySelectorAll("button");
    b0.textContent = o.nao || "Cancelar"; b1.textContent = o.sim || "Confirmar";
    if (o.perigo) b1.classList.add("danger");
    const prev = document.activeElement;
    const fim = (v) => { document.removeEventListener("keydown", tecla); f.remove(); if (prev && prev.focus) prev.focus(); res(v); };
    const tecla = (e) => { if (e.key === "Escape") fim(false); };
    f.addEventListener("click", (e) => { if (e.target === f) fim(false); const b = e.target.closest("button[data-r]"); if (b) fim(b.dataset.r === "1"); });
    document.addEventListener("keydown", tecla); document.body.append(f); b1.focus();
  });
}
/* leitura */
const K = "nh-leitura"; let st = {};
try { st = JSON.parse(localStorage.getItem(K) || "{}"); } catch (e) { st = {}; }
if (st.t === "pergaminho") st.t = "claro"; // nome antigo do tema claro
function aplicar() {
  const d = document.documentElement;
  if (st.t) d.dataset.tema = st.t; else delete d.dataset.tema;
  d.style.fontSize = st.s && st.s !== 100 ? st.s + "%" : "";
  try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) { /* sem armazenamento */ }
  const v = document.getElementById("lvTam"); if (v) v.textContent = (st.s || 100) + "%";
  document.querySelectorAll("[data-tema-b]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.temaB || "") === (st.t || ""))));
}
function leitura() {
  const w = document.createElement("div"); w.className = "leitura";
  w.innerHTML = '<button type="button" class="leitura-btn" aria-expanded="false" aria-label="Opções de leitura">Aa</button><div class="leitura-painel" hidden><div class="lv-l">Tamanho do texto</div><div class="lv-r"><button type="button" class="btn mini sec" data-s="-10" aria-label="Diminuir texto">A−</button><b id="lvTam">100%</b><button type="button" class="btn mini sec" data-s="10" aria-label="Aumentar texto">A+</button></div><div class="lv-l">Tema</div><div class="lv-r"><button type="button" class="btn mini sec" data-tema-b="">Escuro</button><button type="button" class="btn mini sec" data-tema-b="claro">Claro</button></div></div>';
  const bt = w.querySelector(".leitura-btn"), pn = w.querySelector(".leitura-painel");
  bt.addEventListener("click", () => { pn.hidden = !pn.hidden; bt.setAttribute("aria-expanded", String(!pn.hidden)); });
  document.addEventListener("click", (e) => { if (!w.contains(e.target)) { pn.hidden = true; bt.setAttribute("aria-expanded", "false"); } });
  pn.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.s) st.s = Math.max(80, Math.min(140, (st.s || 100) + Number(b.dataset.s)));
    if (b.dataset.temaB !== undefined) st.t = b.dataset.temaB;
    aplicar();
  });
  document.body.append(w); aplicar();
}
leitura(); pintarIcones();
