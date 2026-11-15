import { db, guard, renderTopbar, el, resizeImage } from "./fb.js";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const STATUS = [
  ["sorte", "Sorte", "🍀"], ["vontade", "Vontade", "🔥"],
  ["foco", "Foco", "🎯"], ["destreza", "Destreza", "🕊️"],
  ["forca", "Força", "💪"], ["agilidade", "Agilidade", "🏃"],
  ["intelecto", "Intelecto", "📖"], ["constituicao", "Constituição", "🛡️"],
  ["carisma", "Carisma", "🎭"]
];
const SLOTS = 30;

const { user, profile } = await guard();
const id = new URLSearchParams(location.search).get("id");
if (!id) { location.replace("fichas.html"); throw new Error("sem id"); }

function getPath(o, p) { return p.split(".").reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v) {
  const ks = p.split("."); const last = ks.pop();
  ks.reduce((a, k) => (a[k] = a[k] || {}), o)[last] = v;
}
function base() {
  const status = {}; STATUS.forEach((s) => (status[s[0]] = ""));
  return {
    info: { nome: "", idade: "", altura: "", fama: 0, hp: "", money: 0, sanidade: 100 },
    dom: { nome: "", categorias: "", edom: 100, edomMax: 100 },
    status, mochila: Array(SLOTS).fill(""), habilidades: [], passivas: [], aparencia: "", retrato: ""
  };
}

let cur = null, timer = null, pendente = false;

/* ---------- montagem ---------- */
STATUS.forEach((s) => {
  const inp = el("input", { type: "number", placeholder: "1d20", "data-k": "status." + s[0], "aria-label": s[1] });
  $("status").append(el("div", { class: "l2" },
    el("span", {}, el("i", { class: "ic", text: s[2] }), s[1]), inp,
    el("button", { type: "button", class: "dado", title: "Rolar 1d20", "data-roll": "1d20", "data-alvo": "status." + s[0], text: "🎲" })));
});
for (let i = 0; i < SLOTS; i++)
  $("mochila").append(el("input", { type: "text", maxlength: "40", placeholder: " ", "data-slot": String(i), "aria-label": "Espaço " + (i + 1) }));

/* ---------- carregar ---------- */
try {
  const snap = await getDoc(doc(db, "fichas", id));
  if (!snap.exists()) { location.replace("fichas.html"); throw new Error("ficha não existe"); }
  const raw = snap.data(), b = base();
  cur = {
    ownerUid: raw.ownerUid, ownerName: raw.ownerName || "",
    data: {
      info: { ...b.info, ...(raw.info || {}) },
      dom: { ...b.dom, ...(raw.dom || {}) },
      status: { ...b.status, ...(raw.status || {}) },
      mochila: b.mochila.map((_, i) => (raw.mochila && raw.mochila[i]) || ""),
      habilidades: Array.isArray(raw.habilidades) ? raw.habilidades : [],
      passivas: Array.isArray(raw.passivas) ? raw.passivas : [],
      aparencia: raw.aparencia || "", retrato: raw.retrato || ""
    }
  };
} catch (e) {
  $("carregando").textContent = "Não foi possível abrir a ficha (" + (e.code || e.message) + ").";
  throw e;
}

const alheia = cur.ownerUid !== user.uid;
renderTopbar(profile, alheia ? "master" : "fichas", "Ficha");
if (alheia) {
  $("btnVoltar").href = "master.html";
  $("dono").hidden = false;
  $("dono").textContent = "Ficha de " + (cur.ownerName || "outro jogador");
}
$("carregando").hidden = true;
$("tela").hidden = false;

/* ---------- preencher ---------- */
function pintarRetrato() {
  $("retratoBox").replaceChildren(cur.data.retrato ? el("img", { class: "pic", src: cur.data.retrato, alt: "Retrato" }) : el("div", { class: "pic", text: "👤" }));
}
function derivados() {
  const usados = cur.data.mochila.filter((x) => String(x).trim()).length;
  $("espaco").textContent = "Espaço " + String(usados).padStart(2, "0") + "/" + SLOTS;
  const a = Number(cur.data.dom.edom) || 0, m = Number(cur.data.dom.edomMax) || 0;
  $("barEdom").style.width = (m > 0 ? Math.max(0, Math.min(100, (a / m) * 100)) : 0) + "%";
}
document.querySelectorAll("[data-k]").forEach((e) => { const v = getPath(cur.data, e.dataset.k); e.value = v == null ? "" : v; });
document.querySelectorAll("[data-slot]").forEach((e) => (e.value = cur.data.mochila[e.dataset.slot] || ""));
pintarRetrato(); derivados();
renderLista("habilidades"); renderLista("passivas");

/* ---------- salvar ---------- */
function marcar(s) {
  const e = $("salvo");
  e.className = "salvo" + (s === "pend" ? " pend" : s === "err" ? " err" : "");
  e.textContent = s === "pend" ? "Salvando…" : s === "err" ? "Erro ao salvar" : "Salvo";
}
function agendar() { pendente = true; marcar("pend"); clearTimeout(timer); timer = setTimeout(salvar, 800); }
async function salvar() {
  clearTimeout(timer);
  if (!pendente) return;
  pendente = false;
  try {
    await setDoc(doc(db, "fichas", id), {
      ...cur.data,
      nome: (cur.data.info.nome || "").trim() || "Sem nome",
      ownerUid: cur.ownerUid, ownerName: cur.ownerName, updatedAt: serverTimestamp()
    });
    if (!pendente) marcar("ok");
  } catch (e) { pendente = true; marcar("err"); }
}
addEventListener("beforeunload", (e) => { if (pendente) { salvar(); e.preventDefault(); e.returnValue = ""; } });
addEventListener("pagehide", () => { if (pendente) salvar(); });

/* ---------- eventos ---------- */
$("tela").addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.k) {
    setPath(cur.data, t.dataset.k, t.type === "number" ? (t.value === "" ? "" : Number(t.value)) : t.value);
    derivados(); agendar();
  } else if (t.dataset.slot !== undefined) {
    cur.data.mochila[t.dataset.slot] = t.value; derivados(); agendar();
  }
});
function rolar(expr) {
  const m = /^(\d+)d(\d+)$/.exec(expr); if (!m) return 0;
  let t = 0; for (let i = 0; i < Number(m[1]); i++) t += 1 + Math.floor(Math.random() * Number(m[2]));
  return t;
}
$("tela").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.roll) {
    const v = rolar(b.dataset.roll);
    setPath(cur.data, b.dataset.alvo, v);
    const i = $("tela").querySelector('[data-k="' + b.dataset.alvo + '"]'); if (i) i.value = v;
    agendar();
  } else if (b.dataset.add) {
    cur.data[b.dataset.add].push(b.dataset.add === "habilidades" ? { nome: "", custo: "", desc: "" } : { nome: "", desc: "" });
    renderLista(b.dataset.add); agendar();
  }
});

$("inRetrato").addEventListener("change", async (e) => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try { cur.data.retrato = await resizeImage(f, 320); pintarRetrato(); agendar(); }
  catch (err) { alert(err.message); }
  e.target.value = "";
});
$("btnRetratoRm").addEventListener("click", () => { cur.data.retrato = ""; pintarRetrato(); agendar(); });

function renderLista(chave) {
  const box = $(chave); box.textContent = "";
  const custo = chave === "habilidades";
  cur.data[chave].forEach((it, i) => {
    const w = el("div", { class: "item" });
    const nome = el("input", { type: "text", class: "nome", maxlength: "80", placeholder: "Nome" });
    nome.value = it.nome || ""; nome.addEventListener("input", () => { it.nome = nome.value; agendar(); });
    w.append(nome);
    if (custo) {
      const c = el("input", { type: "number", class: "custo", min: "0", placeholder: "Custo EDOM" });
      c.value = it.custo === undefined ? "" : it.custo;
      c.addEventListener("input", () => { it.custo = c.value === "" ? "" : Number(c.value); agendar(); });
      w.append(c);
    }
    const t = el("textarea", { rows: "3", maxlength: "1500", placeholder: "Descrição" });
    t.value = it.desc || ""; t.addEventListener("input", () => { it.desc = t.value; agendar(); });
    const rm = el("button", { type: "button", class: "btn mini danger rm", text: "Remover" });
    rm.addEventListener("click", () => {
      if (!confirm("Remover \"" + (it.nome || "este item") + "\"?")) return;
      cur.data[chave].splice(i, 1); renderLista(chave); agendar();
    });
    w.append(t, rm); box.append(w);
  });
}

$("btnExcluir").addEventListener("click", async () => {
  if (!confirm("Excluir esta ficha para sempre?")) return;
  pendente = false; clearTimeout(timer);
  try { await deleteDoc(doc(db, "fichas", id)); location.replace(alheia ? "master.html" : "fichas.html"); }
  catch (e) { alert("Não foi possível excluir (" + (e.code || e.message) + ")."); }
});
