import { db, guard, renderTopbar, el, resizeImage, prepararImagem } from "./fb.js";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { aviso, confirmar } from "./ui.js";
import { ico, pintarIcones } from "./icons.js";
import { STATUS, esc, num, fmt, normalizar, itemVazio, resumoEspaco, tipoRotulo, domExtraVazio } from "./ficha-shared.js";

const $ = (id) => document.getElementById(id);
const { user, profile } = await guard();
const id = new URLSearchParams(location.search).get("id");
if (!id) { location.replace("fichas.html"); throw new Error("sem id"); }

let raw;
try {
  const snap = await getDoc(doc(db, "fichas", id));
  if (!snap.exists()) { location.replace("fichas.html"); throw new Error("ficha não existe"); }
  raw = snap.data();
} catch (e) {
  $("carregando").textContent = "Não foi possível abrir a ficha (" + (e.code || e.message) + ").";
  throw e;
}
const dono = raw.ownerUid === user.uid;
if (!dono && profile.role !== "master") { location.replace("fichas.html"); throw new Error("sem permissão"); }

const data = normalizar(raw);
const verUrl = "ficha-view.html?id=" + encodeURIComponent(id);
renderTopbar(profile, dono ? "fichas" : "master", "Editor de ficha");
$("btnCancelar").href = verUrl;
$("dono").textContent = dono ? "Editor de ficha" : "Editando a ficha de " + (raw.ownerName || "outro jogador");
$("dono").append(el("span", { class: "dono-dica", text: " · preencha os campos e use o botão Salvar ficha no fim da página." }));
$("carregando").hidden = true;
$("tela").hidden = false;

/* ---------- utilidades ---------- */
function getPath(o, p) { return p.split(".").reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v) { const ks = p.split("."); const last = ks.pop(); ks.reduce((a, k) => (a[k] = a[k] || {}), o)[last] = v; }

const RASC = "nh-ed-rascunho:" + id;
let versao = raw.updatedAt || null;
const msDe = (t) => (t && t.toMillis ? t.toMillis() : 0);
const tamEl = el("span", { class: "tam" });
function corpoFicha() { return { info: data.info, dom: data.dom, domsExtra: data.domsExtra, status: data.status, inventario: data.inventario, habilidades: data.habilidades, passivas: data.passivas, aparencia: data.aparencia, retrato: data.retrato }; }
function atualizarTam() { const kb = Math.round(JSON.stringify(corpoFicha()).length / 1024); tamEl.textContent = "Tamanho " + kb + " / 900 KB"; tamEl.classList.toggle("alto", kb > 720); }
let tRasc;
function agendarRascunho() {
  clearTimeout(tRasc);
  tRasc = setTimeout(() => { atualizarTam(); try { localStorage.setItem(RASC, JSON.stringify({ em: Date.now(), d: corpoFicha() })); } catch (e) { /* sem espaço */ } }, 800);
}
const limparRascunho = () => { clearTimeout(tRasc); try { localStorage.removeItem(RASC); } catch (e) { /* ok */ } };

let sujo = false;
function marcarSujo() {
  agendarRascunho();
  if (sujo) return;
  sujo = true; $("salvo").className = "salvo pend"; $("salvo").textContent = "Alterações não salvas";
}
addEventListener("beforeunload", (e) => { if (sujo) { e.preventDefault(); e.returnValue = ""; } });
$("btnCancelar").addEventListener("click", async (e) => {
  if (!sujo) return;
  e.preventDefault();
  if (await confirmar("Descartar as alterações não salvas?", { sim: "Descartar", perigo: true })) { sujo = false; limparRascunho(); location.href = verUrl; }
});

/* ---------- rascunho salvo no aparelho ---------- */
try {
  const r = JSON.parse(localStorage.getItem(RASC) || "null");
  if (r && r.d && JSON.stringify(r.d) !== JSON.stringify(corpoFicha())) {
    const quando = new Date(r.em).toLocaleString("pt-BR");
    if (await confirmar("Há um rascunho não salvo desta ficha (" + quando + "). Restaurar?", { sim: "Restaurar", nao: "Descartar" })) { Object.assign(data, normalizar({ ...raw, ...r.d })); marcarSujo(); }
    else limparRascunho();
  }
} catch (e) { /* rascunho inválido */ }

/* ---------- campos simples ---------- */
const icone = (n) => { const i = el("i", { class: "ic" }); i.innerHTML = ico(n); return i; };
STATUS.forEach((s) => {
  $("status").append(el("div", { class: "l2" },
    el("span", {}, icone(s[2]), s[1]),
    el("input", { id: "st-" + s[0], type: "number", placeholder: "1d20", "aria-label": s[1], "data-k": "status." + s[0] }),
    el("button", { type: "button", class: "dado", title: "Rolar 1d20", "data-roll": "1d20", "data-alvo": "status." + s[0], "data-i": "die", "aria-label": "Rolar 1d20" })));
});
pintarIcones();
document.querySelectorAll("[data-k]").forEach((e) => { const v = getPath(data, e.dataset.k); e.value = v == null ? "" : v; });

function barEdom() {
  const a = num(data.dom.edom, 0), m = num(data.dom.edomMax, 0);
  $("barEdom").style.width = (m > 0 ? Math.max(0, Math.min(100, (a / m) * 100)) : 0) + "%";
}
barEdom();

function validar() {
  const sn = data.info.sanidade, a = num(data.dom.edom, 0), m = num(data.dom.edomMax, 0);
  $("f-san").classList.toggle("invalido", sn !== "" && sn != null && (sn < 0 || sn > 100));
  $("f-edom").classList.toggle("invalido", m > 0 && a > m);
}
validar();

function pintarRetrato() {
  $("retratoBox").replaceChildren(data.retrato ? el("img", { class: "apar-pic", src: data.retrato, alt: "Imagem do personagem" }) : el("div", { class: "apar-pic ph", text: "Sem imagem" }));
}
pintarRetrato();

$("tela").addEventListener("input", (e) => {
  const t = e.target;
  if (!t.dataset.k) return;
  setPath(data, t.dataset.k, t.type === "number" ? (t.value === "" ? "" : Number(t.value)) : t.value);
  if (t.dataset.k.indexOf("dom.edom") === 0) barEdom();
  validar();
  marcarSujo();
});

function rolar(expr) {
  const m = /^(\d+)d(\d+)$/.exec(expr); if (!m) return 0;
  let t = 0; for (let i = 0; i < Number(m[1]); i++) t += 1 + Math.floor(Math.random() * Number(m[2]));
  return t;
}
$("tela").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-roll]"); if (!b) return;
  const v = rolar(b.dataset.roll);
  setPath(data, b.dataset.alvo, v);
  const i = $("tela").querySelector('[data-k="' + b.dataset.alvo + '"]'); if (i) i.value = v;
  marcarSujo();
});

$("inRetrato").addEventListener("change", async (e) => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try { data.retrato = await prepararImagem(f, 1100, 450); pintarRetrato(); marcarSujo(); } catch (err) { aviso(err.message); }
  e.target.value = "";
});
$("btnRetratoRm").addEventListener("click", () => { data.retrato = ""; pintarRetrato(); marcarSujo(); });

/* ---------- imagem de visualização do dom ---------- */
function blocoImagemDom(obj) {
  const box = el("div", { class: "hab-img dom-img-edit" });
  const pintar = () => {
    const inp = el("input", { type: "file", accept: "image/*", "aria-label": "Imagem ou GIF do dom" });
    inp.addEventListener("change", async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      try { obj.image = await prepararImagem(f, 700, 400); pintar(); marcarSujo(); } catch (err) { aviso(err.message); }
      inp.value = "";
    });
    const ctl = el("div", { class: "hab-ctl" }, el("span", { class: "lbl", text: "Imagem ou GIF de visualização do dom" }), inp);
    if (obj.image) {
      const x = el("button", { type: "button", class: "btn mini sec", text: "Remover imagem" });
      x.addEventListener("click", () => { obj.image = ""; pintar(); marcarSujo(); });
      ctl.append(x);
    }
    box.replaceChildren(obj.image ? el("img", { class: "hab-prev", src: obj.image, alt: "" }) : el("div", { class: "hab-prev ph", text: "Sem imagem" }), ctl);
  };
  pintar();
  return box;
}
$("domImgPrincipal").append(blocoImagemDom(data.dom));

/* ---------- doms extras ---------- */
const MAX_DOMS_EXTRA = 8;
function renderDoms(focoNovo) {
  const lista = $("domsExtra"); lista.textContent = "";
  const tem = data.domsExtra.length > 0;
  $("chipPrincipal").textContent = tem ? "Dom 1" : "Dom";
  $("notaEdom").hidden = !tem;
  data.domsExtra.forEach((d, i) => {
    const nome = el("input", { type: "text", maxlength: "80", placeholder: "—", "aria-label": "Dom " + (i + 2) });
    nome.value = d.nome; nome.addEventListener("input", () => { d.nome = nome.value; marcarSujo(); });
    const cat = el("input", { type: "text", maxlength: "120", placeholder: "—", "aria-label": "Categorias do dom " + (i + 2) });
    cat.value = d.categorias; cat.addEventListener("input", () => { d.categorias = cat.value; marcarSujo(); });
    const rm = el("button", { type: "button", class: "skill-remove dom-rm", "aria-label": "Remover dom " + (i + 2), title: "Remover este dom", text: "✕" });
    rm.addEventListener("click", async () => {
      if ((d.nome.trim() || d.categorias.trim() || d.image) && !await confirmar("Remover o dom \"" + (d.nome.trim() || "Dom " + (i + 2)) + "\"?")) return;
      data.domsExtra.splice(i, 1); renderDoms(); marcarSujo();
    });
    lista.append(el("div", { class: "dom-card extra" },
      el("div", { class: "dom-card-head" }, el("span", { class: "dom-chip", text: "Dom " + (i + 2) }), rm),
      el("div", { class: "dom" },
        el("div", { class: "l2" }, el("span", { text: "Dom" }), nome),
        el("div", { class: "l2" }, el("span", { text: "Categorias" }), cat)),
      blocoImagemDom(d)));
  });
  $("btnAddDom").hidden = data.domsExtra.length >= MAX_DOMS_EXTRA;
  if (focoNovo) { const ins = lista.querySelectorAll(".dom-card.extra input[type=text]"); if (ins.length >= 2) ins[ins.length - 2].focus(); }
}
renderDoms();
$("btnAddDom").addEventListener("click", () => {
  if (data.domsExtra.length >= MAX_DOMS_EXTRA) return;
  data.domsExtra.push(domExtraVazio()); renderDoms(true); marcarSujo();
});

/* ---------- mochila (modelo do Heartsoul) ---------- */
const box = $("inventario");
const aberto = {}; // acordeão: índices abertos (por padrão ficam recolhidos)
function resumo() { $("invResumo").innerHTML = resumoEspaco(data.inventario); }

function blocoItem(it, i, total) {
  const comum = it.tipo === "comum";
  return `<div class="inventory-item-block tipo-${it.tipo}">
    <div class="inventory-item">
      <label class="inv-field inv-field-name"><span>Item</span><input type="text" maxlength="80" data-f="name" data-i="${i}" placeholder="Nome do item" value="${esc(it.name)}"></label>
      <label class="inv-field"><span>Espaço</span><input type="number" min="0" step="0.5" data-f="espaco" data-i="${i}" value="${esc(it.espaco)}"></label>
      <label class="inv-field"><span>Qtd.</span><input type="number" min="0" step="1" data-f="qty" data-i="${i}" value="${esc(it.qty)}"></label>
      <button type="button" class="skill-remove" data-rm="${i}" aria-label="Remover item" ${total <= 1 ? 'style="visibility:hidden"' : ""}>✕</button>
    </div>
    <div class="inv-item-acc${aberto[i] !== true ? " collapsed" : ""}">
      <button type="button" class="inv-item-acc-head" data-acc="${i}" aria-expanded="${aberto[i] === true}">
        <span>${ico("box")}</span><span class="iah-title">Tipo, imagem e descrição</span><span class="iah-chevron">▾</span>
      </button>
      <div class="inv-item-acc-body">
        <div class="item-type-row">
          <label class="item-type-chip"><input type="checkbox" data-tipo="consumivel" data-i="${i}" ${it.tipo === "consumivel" ? "checked" : ""} ${it.tipo === "mochila" ? "disabled" : ""}> ${ico("flask")} Consumível</label>
          <label class="item-type-chip backpack"><input type="checkbox" data-tipo="mochila" data-i="${i}" ${it.tipo === "mochila" ? "checked" : ""} ${it.tipo === "consumivel" ? "disabled" : ""}> ${ico("bag")} Mochila</label>
        </div>
        ${it.tipo === "consumivel" ? `<div class="item-detail inv-effect-fields">
          <input type="text" maxlength="40" data-f="effectValue" data-i="${i}" placeholder="Dado/valor (ex.: 1d8+2)" value="${esc(it.effectValue)}">
          <input type="text" maxlength="300" data-f="effectDesc" data-i="${i}" placeholder="Descrição do efeito (ex.: cura 1d8)" value="${esc(it.effectDesc)}">
        </div>` : ""}
        ${it.tipo === "mochila" ? `<div class="item-detail inv-backpack-fields">
          <label class="item-equip-toggle"><input type="checkbox" data-equip="${i}" ${it.backpackEquipped ? "checked" : ""}> <span>Equipada agora</span></label>
          <label class="inv-backpack-bonus"><span>${ico("bag")} Espaço extra</span><input type="number" min="0" step="0.5" data-f="backpackBonus" data-i="${i}" value="${esc(it.backpackBonus)}"></label>
          <p class="hint" style="margin:.4rem 0 0">Soma ao limite de 30 enquanto estiver equipada. O espaço da própria mochila continua contando.</p>
        </div>` : ""}
        <div class="inv-extra-row">
          <div class="inv-image-field">
            <span class="lbl">Imagem do item</span>
            <div class="inv-image-uploader">
              ${it.image ? `<img src="${it.image}" alt="" class="inv-image-preview">` : `<div class="inv-image-placeholder">${ico("box")}</div>`}
              <div class="inv-image-controls">
                <input type="file" accept="image/*" data-img="${i}" aria-label="Imagem do item">
                ${it.image ? `<button type="button" class="btn mini sec" data-img-rm="${i}">Remover imagem</button>` : ""}
              </div>
            </div>
          </div>
          <label class="inv-desc-field"><span class="lbl">Descrição</span>
            <textarea rows="3" maxlength="1500" data-f="description" data-i="${i}" placeholder="Aparência, história ou detalhes de uso do item…">${esc(it.description)}</textarea></label>
        </div>
      </div>
    </div>
    <div class="inv-card-foot">
      <span class="inv-card-kind">${tipoRotulo(it.tipo)}</span><button type="button" class="btn mini sec" data-dup="${i}">Duplicar</button>
      <span>Subtotal <b data-sub="${i}">${fmt(num(it.espaco, 0) * (parseInt(it.qty, 10) || 0))}</b></span>
    </div>
  </div>`;
}

function renderInv(focoNovo) {
  const t = data.inventario.length;
  box.innerHTML = data.inventario.map((it, i) => blocoItem(it, i, t)).join("") +
    `<button type="button" class="btn mini sec" data-add-item>+ Adicionar item</button>`;
  resumo();
  if (focoNovo) { const n = box.querySelector('[data-f="name"][data-i="' + (t - 1) + '"]'); if (n) n.focus(); }
}
renderInv();

box.addEventListener("input", (e) => {
  const t = e.target, f = t.dataset.f; if (!f) return;
  const it = data.inventario[+t.dataset.i]; if (!it) return;
  if (f === "espaco" || f === "backpackBonus") it[f] = Math.max(0, num(t.value, 0));
  else if (f === "qty") it.qty = Math.max(0, parseInt(t.value, 10) || 0);
  else it[f] = t.value;
  const sub = box.querySelector('[data-sub="' + t.dataset.i + '"]');
  if (sub) sub.textContent = fmt(num(it.espaco, 0) * (it.qty || 0));
  resumo(); marcarSujo();
});
box.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.dataset.tipo) {
    const it = data.inventario[+t.dataset.i];
    it.tipo = t.checked ? t.dataset.tipo : "comum";
    renderInv(); marcarSujo();
  } else if (t.dataset.equip !== undefined) {
    data.inventario[+t.dataset.equip].backpackEquipped = t.checked; resumo(); marcarSujo();
  } else if (t.dataset.img !== undefined) {
    const f = t.files && t.files[0]; if (!f) return;
    try { data.inventario[+t.dataset.img].image = await resizeImage(f, 240); renderInv(); marcarSujo(); }
    catch (err) { aviso(err.message); }
  }
});
box.addEventListener("click", async (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.rm !== undefined) {
    const i = +b.dataset.rm, it = data.inventario[i];
    if (String(it.name).trim() && !await confirmar("Remover \"" + it.name + "\"?")) return;
    data.inventario.splice(i, 1);
    if (!data.inventario.length) data.inventario.push(itemVazio());
    renderInv(); marcarSujo();
  } else if (b.dataset.dup !== undefined) {
    const i = +b.dataset.dup; data.inventario.splice(i + 1, 0, { ...data.inventario[i], backpackEquipped: false }); aberto[i + 1] = true; renderInv(); marcarSujo();
  } else if (b.dataset.imgRm !== undefined) {
    data.inventario[+b.dataset.imgRm].image = ""; renderInv(); marcarSujo();
  } else if (b.dataset.acc !== undefined) {
    const i = +b.dataset.acc; aberto[i] = aberto[i] !== true; renderInv();
  } else if (b.hasAttribute("data-add-item")) {
    data.inventario.push(itemVazio()); aberto[data.inventario.length - 1] = true; renderInv(true); marcarSujo();
  }
});

/* ---------- habilidades e passivas ---------- */
function renderLista(chave) {
  const lista = $(chave); lista.textContent = "";
  const custo = chave === "habilidades";
  data[chave].forEach((it, i) => {
    const w = el("div", { class: "item" });
    const nome = el("input", { type: "text", class: "nome", maxlength: "80", placeholder: "Nome", "aria-label": "Nome" });
    nome.value = it.nome || ""; nome.addEventListener("input", () => { it.nome = nome.value; marcarSujo(); });
    w.append(nome);
    if (custo) {
      const c = el("input", { type: "number", class: "custo", min: "0", placeholder: "Custo EDOM", "aria-label": "Custo de EDOM" });
      c.value = it.custo === undefined ? "" : it.custo;
      c.addEventListener("input", () => { it.custo = c.value === "" ? "" : Number(c.value); marcarSujo(); });
      w.append(c);
    }
    const t = el("textarea", { rows: "3", maxlength: "1500", placeholder: "Descrição", "aria-label": "Descrição" });
    t.value = it.desc || ""; t.addEventListener("input", () => { it.desc = t.value; marcarSujo(); });
    const rm = el("button", { type: "button", class: "btn mini danger rm", text: "Remover" });
    rm.addEventListener("click", async () => {
      if (!await confirmar("Remover \"" + (it.nome || "este item") + "\"?")) return;
      data[chave].splice(i, 1); renderLista(chave); marcarSujo();
    });
    const imgBox = el("div", { class: "hab-img" });
    const pintar = () => {
      const ctl = el("div", { class: "hab-ctl" });
      const inp = el("input", { type: "file", accept: "image/*", "aria-label": "Imagem ou GIF" });
      inp.addEventListener("change", async () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        try { it.image = await prepararImagem(f, 700, 400); pintar(); marcarSujo(); } catch (err) { aviso(err.message); }
        inp.value = "";
      });
      ctl.append(el("span", { class: "lbl", text: "Imagem ou GIF (visualização)" }), inp);
      if (it.image) {
        const x = el("button", { type: "button", class: "btn mini sec", text: "Remover imagem" });
        x.addEventListener("click", () => { it.image = ""; pintar(); marcarSujo(); });
        ctl.append(x);
      }
      imgBox.replaceChildren(it.image ? el("img", { class: "hab-prev", src: it.image, alt: "" }) : el("div", { class: "hab-prev ph", text: "Sem imagem" }), ctl);
    };
    pintar();
    const cont = el("small", { class: "cont" });
    const contar = () => { cont.textContent = t.value.length + " / 1500"; };
    t.addEventListener("input", contar); contar();
    const mover = (d) => { const j = i + d; if (j < 0 || j >= data[chave].length) return; [data[chave][i], data[chave][j]] = [data[chave][j], data[chave][i]]; renderLista(chave); marcarSujo(); };
    const sobe = el("button", { type: "button", class: "btn mini sec", "aria-label": "Mover para cima", text: "↑" });
    const desce = el("button", { type: "button", class: "btn mini sec", "aria-label": "Mover para baixo", text: "↓" });
    sobe.disabled = i === 0; desce.disabled = i === data[chave].length - 1;
    sobe.addEventListener("click", () => mover(-1)); desce.addEventListener("click", () => mover(1));
    w.append(t, cont, imgBox, el("div", { class: "item-acoes" }, sobe, desce, rm)); lista.append(w);
  });
}
renderLista("habilidades"); renderLista("passivas");
document.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
  data[b.dataset.add].push(b.dataset.add === "habilidades" ? { nome: "", custo: "", desc: "", image: "" } : { nome: "", desc: "", image: "" });
  renderLista(b.dataset.add); marcarSujo();
}));

/* ---------- salvar / excluir ---------- */
function mostrarErro(msg) { $("erro").replaceChildren(msg ? el("div", { class: "msg", text: msg }) : ""); }

async function salvar(ficar) {
  mostrarErro("");
  const sn = data.info.sanidade;
  if (sn !== "" && sn != null) { data.info.sanidade = Math.max(0, Math.min(100, Number(sn))); $("f-san").value = data.info.sanidade; validar(); }
  const itens = data.inventario.filter((i) => String(i.name).trim() || i.image || String(i.description).trim());
  const docData = {
    info: data.info, dom: data.dom,
    domsExtra: data.domsExtra.filter((d) => d.nome.trim() || d.categorias.trim() || d.image), status: data.status,
    inventario: itens.length ? itens : [], habilidades: data.habilidades, passivas: data.passivas,
    aparencia: data.aparencia, retrato: data.retrato,
    nome: String(data.info.nome || "").trim() || "Sem nome",
    ownerUid: raw.ownerUid, ownerName: raw.ownerName || "", updatedAt: serverTimestamp()
  };
  if (JSON.stringify(docData).length > 900000) { mostrarErro("A ficha ficou grande demais. Remova ou reduza algumas imagens e GIFs e tente de novo."); return; }
  try {
    const atual = await getDoc(doc(db, "fichas", id));
    if (atual.exists() && msDe(atual.data().updatedAt) > msDe(versao) && !(await confirmar("Esta ficha foi alterada em outro lugar depois que você a abriu. Salvar agora vai sobrescrever essas mudanças. Continuar?", { sim: "Sobrescrever", perigo: true }))) return;
  } catch (e) { /* sem checagem, segue */ }
  const b = $("btnSalvar"); b.disabled = true; $("salvo").className = "salvo pend"; $("salvo").textContent = "Salvando…";
  try {
    await setDoc(doc(db, "fichas", id), docData);
    sujo = false; limparRascunho();
    if (dono) sincronizarTokens(docData).catch(() => {});
    if (ficar) {
      const n = await getDoc(doc(db, "fichas", id)).catch(() => null);
      if (n && n.exists()) versao = n.data().updatedAt;
      b.disabled = false; $("salvo").className = "salvo"; $("salvo").textContent = "Salvo ✓"; aviso("Ficha salva.", "ok"); return;
    }
    location.href = verUrl;
  } catch (e) {
    b.disabled = false; $("salvo").className = "salvo err"; $("salvo").textContent = "Erro ao salvar";
    mostrarErro("Não foi possível salvar (" + (e.code || e.message) + ").");
  }
}
// Tabletop: se esta ficha está numa mesa, o token acompanha o nome e a imagem salvos aqui.
function reduzirParaToken(src, max) {
  return new Promise((resolve) => {
    if (!src) { resolve(""); return; }
    if (/^data:image\/gif/.test(src) && src.length < 150000) { resolve(src); return; }
    const im = new Image();
    im.onerror = () => resolve("");
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      const w = c.toDataURL("image/webp", 0.85);
      resolve(w.startsWith("data:image/webp") ? w : c.toDataURL("image/jpeg", 0.85));
    };
    im.src = src;
  });
}
async function sincronizarTokens(d) {
  const u = await getDoc(doc(db, "users", user.uid));
  const mesas = (u.exists() && Array.isArray(u.data().activeTables)) ? u.data().activeTables : [];
  if (!mesas.length) return;
  const img = await reduzirParaToken(d.retrato, 256);
  for (const t of mesas) {
    try {
      const ref = doc(db, "tables", t, "tokens", user.uid);
      const s = await getDoc(ref);
      if (s.exists() && s.data().sheetId === id) await updateDoc(ref, { name: d.nome, image: img || s.data().image || "", updatedAt: serverTimestamp() });
    } catch (e) { /* mesa apagada ou sem permissão */ }
  }
}
// Enter dentro de um campo não deve salvar (e sair da página) sem querer
$("tela").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault(); });
$("tela").addEventListener("submit", (e) => { e.preventDefault(); salvar(); });

$("btnExcluir").addEventListener("click", async () => {
  if (!(await confirmar("Excluir esta ficha para sempre?", { sim: "Excluir", perigo: true }))) return;
  try { await deleteDoc(doc(db, "fichas", id)); sujo = false; location.replace(dono ? "fichas.html" : "master.html"); }
  catch (e) { mostrarErro("Não foi possível excluir (" + (e.code || e.message) + ")."); }
});

/* ---------- seções recolhíveis e itens compactos ---------- */
const CHAVE = "nh-ed-fechadas:" + id;
let fechadas = [];
const SEC = ["info", "dom", "status", "mochila", "habilidades", "passivas", "aparencia"];
const celular = matchMedia("(max-width:640px)");
try {
  const salvo = localStorage.getItem(CHAVE);
  fechadas = salvo === null ? (celular.matches ? SEC.slice(1) : []) : JSON.parse(salvo);
} catch (e) { fechadas = []; }
const plural = (n, a, b) => n + " " + (n === 1 ? a : b);
const tem = (v) => v !== "" && v != null;
function textoResumo(k) {
  const d = data;
  if (k === "info") return [d.info.nome || "Sem nome", tem(d.info.hp) && "HP " + d.info.hp, tem(d.info.sanidade) && "Sanidade " + d.info.sanidade + "%"].filter(Boolean).join(" · ");
  if (k === "dom") return [d.dom.nome, tem(d.dom.edomMax) && "EDOM " + (d.dom.edom || 0) + "/" + d.dom.edomMax, d.domsExtra.length && "+" + plural(d.domsExtra.length, "dom", "doms")].filter(Boolean).join(" · ");
  if (k === "status") return STATUS.filter((s) => tem(d.status[s[0]])).length + "/" + STATUS.length + " status preenchidos";
  if (k === "mochila") return plural(d.inventario.filter((i) => String(i.name).trim()).length, "item", "itens");
  if (k === "aparencia") return (d.retrato ? "Com imagem" : "Sem imagem") + (String(d.aparencia || "").trim() ? " · com texto" : "");
  const l = d[k].filter((x) => String(x.nome).trim());
  return l.length ? plural(l.length, k === "passivas" ? "passiva" : "habilidade", k === "passivas" ? "passivas" : "habilidades") + ": " + l.slice(0, 3).map((x) => x.nome).join(", ") + (l.length > 3 ? "…" : "") : "Vazio";
}
const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(fechadas)); } catch (e) { /* sem armazenamento */ } };
const blocos = [...document.querySelectorAll(".ficha > .bloco")];
blocos.forEach((b, i) => {
  const k = SEC[i], aba = b.querySelector(".aba"), corpo = b.querySelector(".corpo");
  b.id = "sec-" + k; corpo.id = "corpo-" + k; aba.setAttribute("aria-controls", corpo.id);
  const res = el("p", { class: "resumo-sec" }); corpo.prepend(res);
  aba.append(el("span", { class: "aba-chev", "aria-hidden": "true", text: "▾" }));
  aba.setAttribute("role", "button"); aba.tabIndex = 0;
  b._set = (fechar, salvar = true) => {
    b.classList.toggle("fechado", fechar); aba.setAttribute("aria-expanded", String(!fechar));
    if (fechar) res.textContent = textoResumo(k);
    const j = fechadas.indexOf(k);
    if (fechar && j < 0) fechadas.push(k); else if (!fechar && j >= 0) fechadas.splice(j, 1);
    if (salvar) guardar();
  };
  aba.addEventListener("click", () => {
    const abrir = b.classList.contains("fechado");
    b._set(!abrir);
    if (abrir && celular.matches) setTimeout(() => { if (b.getBoundingClientRect().top < 0) b.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30);
  });
  corpo.addEventListener("click", () => { if (b.classList.contains("fechado")) b._set(false); });
  aba.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aba.click(); } });
  b._set(fechadas.includes(k), false);
});
const medirTopo = () => { const t = $("topbar"); document.documentElement.style.setProperty("--topo-h", (t ? t.offsetHeight : 0) + "px"); };
medirTopo(); addEventListener("resize", medirTopo);

// itens de habilidades, passivas e doms extras: botão para recolher cada um
const mini = { habilidades: new Set(), passivas: new Set(), domsExtra: new Set() };
function compactar(listaId, seletor) {
  const lista = $(listaId), fechados = mini[listaId];
  const varrer = () => lista.querySelectorAll(":scope > " + seletor).forEach((w, i) => {
    if (w.querySelector(".min-toggle")) return;
    const b = el("button", { type: "button", class: "min-toggle", "aria-label": "Recolher ou expandir", text: "▾" });
    const aplicar = (f) => { w.classList.toggle("mini-fechado", f); b.setAttribute("aria-expanded", String(!f)); if (f) fechados.add(i); else fechados.delete(i); };
    b.addEventListener("click", () => aplicar(!w.classList.contains("mini-fechado")));
    const cab = w.querySelector(".dom-card-head");
    if (cab) cab.insertBefore(b, cab.lastElementChild); else w.append(b);
    aplicar(fechados.has(i));
  });
  new MutationObserver(varrer).observe(lista, { childList: true }); varrer();
}
compactar("habilidades", ".item"); compactar("passivas", ".item"); compactar("domsExtra", ".dom-card");

/* ---------- salvar e continuar, tamanho, rolar todos, contador ---------- */
const bCont = el("button", { type: "button", class: "btn sec", id: "btnContinuar", text: "Salvar e continuar" });
$("btnSalvar").after(bCont); $("salvo").after(tamEl); atualizarTam();
bCont.addEventListener("click", () => salvar(true));
const bRolar = el("button", { type: "button", class: "btn mini sec", text: "Rolar todos (1d20)" });
$("status").before(bRolar);
bRolar.addEventListener("click", async () => {
  if (STATUS.some((x) => tem(data.status[x[0]])) && !await confirmar("Rolar todos os status de novo? Os valores atuais serão substituídos.", { sim: "Rolar" })) return;
  STATUS.forEach((x) => { const v = rolar("1d20"); data.status[x[0]] = v; $("st-" + x[0]).value = v; });
  marcarSujo();
});
const taAp = document.querySelector('textarea[data-k="aparencia"]');
const contAp = el("small", { class: "cont" }); taAp.after(contAp);
const contarAp = () => { contAp.textContent = taAp.value.length + " / 3000"; };
taAp.addEventListener("input", contarAp); contarAp();

/* ---------- celular: barra de salvar enxuta ---------- */
const barraSalvar = document.querySelector(".save-bar");
const extraSalvar = el("div", { class: "save-extra" });
barraSalvar.after(extraSalvar);
function posicionarRodape() {
  if (celular.matches) { extraSalvar.append($("btnCancelar"), tamEl, $("btnExcluir")); }
  else { bCont.after($("btnCancelar")); $("salvo").after(tamEl); barraSalvar.append($("btnExcluir")); }
}
posicionarRodape();
celular.addEventListener("change", posicionarRodape);
