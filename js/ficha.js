import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc, deleteDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const telas = ["telaConfig", "telaLogin", "telaLista", "telaFicha"];
function mostrar(nome) {
  $("carregando").hidden = true;
  telas.forEach((t) => ($(t).hidden = t !== nome));
}

/* ---------- Firebase ---------- */
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.indexOf("COLE") === 0) {
  mostrar("telaConfig");
  throw new Error("Firebase não configurado (js/firebase-config.js).");
}
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------- modelo ---------- */
const STATUS = [
  ["sorte", "Sorte", "🍀"], ["vontade", "Vontade", "🔥"],
  ["foco", "Foco", "🎯"], ["destreza", "Destreza", "🕊️"],
  ["forca", "Força", "💪"], ["agilidade", "Agilidade", "🏃"],
  ["intelecto", "Intelecto", "📖"], ["constituicao", "Constituição", "🛡️"],
  ["carisma", "Carisma", "🎭"]
];
const SLOTS = 30;

function novaFicha() {
  const status = {};
  STATUS.forEach((s) => (status[s[0]] = ""));
  return {
    info: { nome: "", idade: "", altura: "", fama: 0, hp: "", money: 0, sanidade: 100 },
    dom: { nome: "", categorias: "", edom: 100, edomMax: 100 },
    status: status,
    mochila: Array(SLOTS).fill(""),
    habilidades: [],
    passivas: [],
    aparencia: ""
  };
}

/* acesso por caminho "info.nome" */
function getPath(o, p) { return p.split(".").reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v) {
  const ks = p.split("."); const last = ks.pop();
  ks.reduce((a, k) => (a[k] = a[k] || {}), o)[last] = v;
}

/* estado */
let user = null, isMestre = false, verTodas = false;
let cur = null; // { id, ownerUid, ownerName, data }
let timer = null, pendente = false;

/* ---------- autenticação ---------- */
$("btnLogin").addEventListener("click", async () => {
  $("loginErro").textContent = "";
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { $("loginErro").textContent = "Não foi possível entrar (" + (e.code || e.message) + ")."; }
});
$("btnSair").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, async (u) => {
  user = u;
  cur = null; verTodas = false;
  if (!u) { $("user").hidden = true; mostrar("telaLogin"); return; }
  $("userNome").textContent = u.displayName || u.email || "";
  $("user").hidden = false;
  try { isMestre = (await getDoc(doc(db, "admins", u.uid))).exists(); } catch (e) { isMestre = false; }
  $("btnTodas").hidden = !isMestre;
  rota();
});

/* ---------- rotas (#idDaFicha) ---------- */
addEventListener("hashchange", () => { if (user) rota(); });
async function rota() {
  const id = location.hash.slice(1);
  if (id) await abrirFicha(id); else await abrirLista();
}

/* ---------- lista ---------- */
async function abrirLista() {
  await salvarAgora();
  cur = null;
  mostrar("telaLista");
  $("listaTitulo").textContent = verTodas ? "Todas as fichas" : "Minhas fichas";
  $("btnTodas").textContent = verTodas ? "Ver só as minhas" : "Ver todas (Mestre)";
  const cards = $("cards"); cards.textContent = "";
  $("vazio").hidden = true;
  try {
    const q = verTodas ? collection(db, "fichas") : query(collection(db, "fichas"), where("ownerUid", "==", user.uid));
    const snap = await getDocs(q);
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.updatedAt && b.updatedAt.seconds || 0) - (a.updatedAt && a.updatedAt.seconds || 0));
    $("vazio").hidden = lista.length > 0;
    lista.forEach((f) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "fc";
      const n = document.createElement("b"); n.textContent = f.nome || "Sem nome";
      const s = document.createElement("small");
      s.textContent = (f.dom && f.dom.nome ? f.dom.nome : "Sem dom") + (verTodas && f.ownerName ? " · " + f.ownerName : "");
      b.append(n, s);
      b.addEventListener("click", () => (location.hash = f.id));
      cards.append(b);
    });
  } catch (e) {
    $("vazio").hidden = false;
    $("vazio").textContent = "Erro ao carregar as fichas (" + (e.code || e.message) + ").";
  }
}
$("btnTodas").addEventListener("click", () => { verTodas = !verTodas; abrirLista(); });
$("btnNova").addEventListener("click", async () => {
  $("btnNova").disabled = true;
  try {
    const data = novaFicha();
    const ref = await addDoc(collection(db, "fichas"), {
      ...data, nome: "Sem nome", ownerUid: user.uid, ownerName: user.displayName || user.email || "", updatedAt: serverTimestamp()
    });
    location.hash = ref.id;
  } catch (e) { alert("Não foi possível criar a ficha (" + (e.code || e.message) + ")."); }
  $("btnNova").disabled = false;
});

/* ---------- ficha ---------- */
function montarStatus() {
  const box = $("status");
  box.textContent = "";
  STATUS.forEach((s) => {
    const l = document.createElement("div"); l.className = "l";
    const sp = document.createElement("span");
    const ic = document.createElement("i"); ic.className = "ic"; ic.textContent = s[2];
    sp.append(ic, s[1]);
    const inp = document.createElement("input");
    inp.type = "number"; inp.placeholder = "1d20"; inp.dataset.k = "status." + s[0]; inp.setAttribute("aria-label", s[1]);
    const d = document.createElement("button");
    d.type = "button"; d.className = "dado"; d.textContent = "🎲"; d.title = "Rolar 1d20";
    d.dataset.roll = "1d20"; d.dataset.alvo = "status." + s[0];
    l.append(sp, inp, d);
    box.append(l);
  });
}
function montarMochila() {
  const box = $("mochila"); box.textContent = "";
  for (let i = 0; i < SLOTS; i++) {
    const inp = document.createElement("input");
    inp.type = "text"; inp.maxLength = 40; inp.placeholder = " "; inp.dataset.slot = i; inp.setAttribute("aria-label", "Espaço " + (i + 1));
    box.append(inp);
  }
}
montarStatus(); montarMochila();

function preencher() {
  const d = cur.data;
  document.querySelectorAll("[data-k]").forEach((el) => {
    const v = getPath(d, el.dataset.k);
    el.value = v == null ? "" : v;
  });
  document.querySelectorAll("[data-slot]").forEach((el) => (el.value = d.mochila[el.dataset.slot] || ""));
  renderLista("habilidades"); renderLista("passivas");
  atualizarDerivados();
}
function atualizarDerivados() {
  const usados = cur.data.mochila.filter((x) => String(x).trim()).length;
  $("espaco").textContent = "Espaço " + String(usados).padStart(2, "0") + "/" + SLOTS;
  const a = Number(cur.data.dom.edom) || 0, m = Number(cur.data.dom.edomMax) || 0;
  $("barEdom").style.width = (m > 0 ? Math.max(0, Math.min(100, (a / m) * 100)) : 0) + "%";
}

async function abrirFicha(id) {
  await salvarAgora();
  mostrar("telaFicha");
  try {
    const snap = await getDoc(doc(db, "fichas", id));
    if (!snap.exists()) { location.hash = ""; return; }
    const raw = snap.data();
    const base = novaFicha();
    const data = {
      info: { ...base.info, ...(raw.info || {}) },
      dom: { ...base.dom, ...(raw.dom || {}) },
      status: { ...base.status, ...(raw.status || {}) },
      mochila: base.mochila.map((_, i) => (raw.mochila && raw.mochila[i]) || ""),
      habilidades: Array.isArray(raw.habilidades) ? raw.habilidades : [],
      passivas: Array.isArray(raw.passivas) ? raw.passivas : [],
      aparencia: raw.aparencia || ""
    };
    cur = { id: id, ownerUid: raw.ownerUid, ownerName: raw.ownerName || "", data: data };
    const alheia = raw.ownerUid !== user.uid;
    $("dono").hidden = !alheia;
    $("dono").textContent = alheia ? "Ficha de " + (raw.ownerName || "outro jogador") : "";
    preencher();
    marcar("ok");
  } catch (e) {
    alert("Não foi possível abrir a ficha (" + (e.code || e.message) + ").");
    location.hash = "";
  }
}

/* edição */
function marcar(estado) {
  const el = $("salvo");
  el.className = "salvo" + (estado === "pend" ? " pend" : estado === "err" ? " err" : "");
  el.textContent = estado === "pend" ? "Salvando…" : estado === "err" ? "Erro ao salvar" : "Salvo";
}
function agendar() {
  if (!cur) return;
  pendente = true; marcar("pend");
  clearTimeout(timer);
  timer = setTimeout(salvarAgora, 800);
}
async function salvarAgora() {
  clearTimeout(timer);
  if (!pendente || !cur) return;
  pendente = false;
  const c = cur;
  try {
    await setDoc(doc(db, "fichas", c.id), {
      ...c.data,
      nome: (c.data.info.nome || "").trim() || "Sem nome",
      ownerUid: c.ownerUid,
      ownerName: c.ownerName,
      updatedAt: serverTimestamp()
    });
    if (cur === c && !pendente) marcar("ok");
  } catch (e) { pendente = true; marcar("err"); }
}
addEventListener("beforeunload", (e) => { if (pendente) { salvarAgora(); e.preventDefault(); e.returnValue = ""; } });

const telaFicha = $("telaFicha");
telaFicha.addEventListener("input", (e) => {
  const el = e.target;
  if (!cur) return;
  if (el.dataset.k) {
    const v = el.type === "number" ? (el.value === "" ? "" : Number(el.value)) : el.value;
    setPath(cur.data, el.dataset.k, v);
    atualizarDerivados(); agendar();
  } else if (el.dataset.slot !== undefined) {
    cur.data.mochila[el.dataset.slot] = el.value;
    atualizarDerivados(); agendar();
  }
});

/* dados */
function rolar(expr) {
  const m = /^(\d+)d(\d+)$/.exec(expr);
  if (!m) return 0;
  let t = 0;
  for (let i = 0; i < Number(m[1]); i++) t += 1 + Math.floor(Math.random() * Number(m[2]));
  return t;
}
telaFicha.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || !cur) return;
  if (b.dataset.roll) {
    const v = rolar(b.dataset.roll);
    setPath(cur.data, b.dataset.alvo, v);
    const inp = telaFicha.querySelector('[data-k="' + b.dataset.alvo + '"]');
    if (inp) inp.value = v;
    agendar();
  } else if (b.dataset.add) {
    cur.data[b.dataset.add].push(b.dataset.add === "habilidades" ? { nome: "", custo: "", desc: "" } : { nome: "", desc: "" });
    renderLista(b.dataset.add); agendar();
  }
});

/* habilidades e passivas */
function renderLista(chave) {
  const box = $(chave); box.textContent = "";
  const comCusto = chave === "habilidades";
  cur.data[chave].forEach((it, i) => {
    const w = document.createElement("div"); w.className = "item";
    const nome = document.createElement("input");
    nome.type = "text"; nome.className = "nome"; nome.maxLength = 80; nome.placeholder = "Nome"; nome.value = it.nome || "";
    nome.addEventListener("input", () => { it.nome = nome.value; agendar(); });
    w.append(nome);
    if (comCusto) {
      const c = document.createElement("input");
      c.type = "number"; c.className = "custo"; c.min = "0"; c.placeholder = "Custo EDOM"; c.value = it.custo === undefined ? "" : it.custo;
      c.addEventListener("input", () => { it.custo = c.value === "" ? "" : Number(c.value); agendar(); });
      w.append(c);
    }
    const t = document.createElement("textarea");
    t.rows = 3; t.maxLength = 1500; t.placeholder = "Descrição"; t.value = it.desc || "";
    t.addEventListener("input", () => { it.desc = t.value; agendar(); });
    const rm = document.createElement("button");
    rm.type = "button"; rm.className = "btn mini perigo rm"; rm.textContent = "Remover";
    rm.addEventListener("click", () => {
      if (!confirm("Remover \"" + (it.nome || "este item") + "\"?")) return;
      cur.data[chave].splice(i, 1); renderLista(chave); agendar();
    });
    w.append(t, rm);
    box.append(w);
  });
}

/* voltar / excluir */
$("btnVoltar").addEventListener("click", () => { location.hash = ""; });
$("btnExcluir").addEventListener("click", async () => {
  if (!cur) return;
  if (!confirm("Excluir esta ficha para sempre?")) return;
  const id = cur.id;
  pendente = false; clearTimeout(timer); cur = null;
  try { await deleteDoc(doc(db, "fichas", id)); } catch (e) { alert("Não foi possível excluir (" + (e.code || e.message) + ")."); }
  location.hash = "";
});
