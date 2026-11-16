import { db, guard, renderTopbar, el, resizeImage, prepararImagem } from "./fb.js";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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
$("dono").textContent = (dono ? "Editor de ficha" : "Editando a ficha de " + (raw.ownerName || "outro jogador")) + " · preencha os campos e use o botão Salvar ficha no fim da página.";
$("carregando").hidden = true;
$("tela").hidden = false;

/* ---------- utilidades ---------- */
function getPath(o, p) { return p.split(".").reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v) { const ks = p.split("."); const last = ks.pop(); ks.reduce((a, k) => (a[k] = a[k] || {}), o)[last] = v; }

let sujo = false;
function marcarSujo() {
  if (sujo) return;
  sujo = true; $("salvo").className = "salvo pend"; $("salvo").textContent = "Alterações não salvas";
}
addEventListener("beforeunload", (e) => { if (sujo) { e.preventDefault(); e.returnValue = ""; } });
$("btnCancelar").addEventListener("click", async (e) => {
  if (!sujo) return;
  e.preventDefault();
  if (await confirmar("Descartar as alterações não salvas?", { sim: "Descartar", perigo: true })) { sujo = false; location.href = verUrl; }
});

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

function pintarRetrato() {
  $("retratoBox").replaceChildren(data.retrato ? el("img", { class: "apar-pic", src: data.retrato, alt: "Imagem do personagem" }) : el("div", { class: "apar-pic ph", text: "Sem imagem" }));
}
pintarRetrato();

$("tela").addEventListener("input", (e) => {
  const t = e.target;
  if (!t.dataset.k) return;
  setPath(data, t.dataset.k, t.type === "number" ? (t.value === "" ? "" : Number(t.value)) : t.value);
  if (t.dataset.k.indexOf("dom.edom") === 0) barEdom();
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
const aberto = {}; // acordeão: índices fechados
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
    <div class="inv-item-acc${aberto[i] === false ? " collapsed" : ""}">
      <button type="button" class="inv-item-acc-head" data-acc="${i}" aria-expanded="${aberto[i] !== false}">
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
      <span class="inv-card-kind">${tipoRotulo(it.tipo)}</span>
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
  } else if (b.dataset.imgRm !== undefined) {
    data.inventario[+b.dataset.imgRm].image = ""; renderInv(); marcarSujo();
  } else if (b.dataset.acc !== undefined) {
    const i = +b.dataset.acc; aberto[i] = aberto[i] === false ? true : false; renderInv();
  } else if (b.hasAttribute("data-add-item")) {
    data.inventario.push(itemVazio()); renderInv(true); marcarSujo();
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
    w.append(t, imgBox, rm); lista.append(w);
  });
}
renderLista("habilidades"); renderLista("passivas");
document.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
  data[b.dataset.add].push(b.dataset.add === "habilidades" ? { nome: "", custo: "", desc: "", image: "" } : { nome: "", desc: "", image: "" });
  renderLista(b.dataset.add); marcarSujo();
}));

/* ---------- salvar / excluir ---------- */
function mostrarErro(msg) { $("erro").replaceChildren(msg ? el("div", { class: "msg", text: msg }) : ""); }

async function salvar() {
  mostrarErro("");
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
  const b = $("btnSalvar"); b.disabled = true; $("salvo").className = "salvo pend"; $("salvo").textContent = "Salvando…";
  try {
    await setDoc(doc(db, "fichas", id), docData);
    sujo = false; location.href = verUrl;
  } catch (e) {
    b.disabled = false; $("salvo").className = "salvo err"; $("salvo").textContent = "Erro ao salvar";
    mostrarErro("Não foi possível salvar (" + (e.code || e.message) + ").");
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
