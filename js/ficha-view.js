import { db, guard, renderTopbar, el } from "./fb.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { STATUS, esc, fmt, num, normalizar, nomesNaoVazios, resumoEspaco, tipoRotulo, tipoIcone } from "./ficha-shared.js";

const { user, profile } = await guard();
const content = document.getElementById("content");
const id = new URLSearchParams(location.search).get("id");
if (!id) { location.replace("fichas.html"); throw new Error("sem id"); }

let raw, data, owner;
try {
  const snap = await getDoc(doc(db, "fichas", id));
  if (!snap.exists()) { location.replace("fichas.html"); throw new Error("ficha não existe"); }
  raw = snap.data();
} catch (e) {
  content.replaceChildren(el("div", { class: "msg", text: "Não foi possível abrir a ficha (" + (e.code || e.message) + ")." }));
  throw e;
}
data = normalizar(raw);
owner = { uid: raw.ownerUid, nome: raw.ownerName || "" };
const dono = owner.uid === user.uid;
const podeEditar = dono || profile.role === "master";
const voltar = dono ? "fichas.html" : "master.html";
renderTopbar(profile, dono ? "fichas" : "master", "Ficha de personagem");
document.title = (data.info.nome || "Ficha") + " | Never Heroes";

const dash = (v) => (v === "" || v == null ? "—" : esc(v));

function barra(atual, max, cls) {
  const m = num(max, 0), a = num(atual, 0);
  const pct = m > 0 ? Math.max(0, Math.min(100, (a / m) * 100)) : 0;
  return `<div class="res-bar ${cls || ""}"><span style="width:${pct}%"></span></div>`;
}

function cartaoItem(it, i) {
  const sub = fmt(num(it.espaco, 0) * (it.qty || 0));
  const usar = it.tipo === "consumivel" && podeEditar && it.qty > 0
    ? `<button type="button" class="btn mini sec" data-usar="${i}">Usar 1</button>` : "";
  return `<article class="inv-card is-${it.tipo}">
    <div class="inv-card-head">
      ${it.image ? `<img src="${it.image}" alt="${esc(it.name)}" class="inv-card-thumb">` : `<span class="inv-card-icon">${tipoIcone(it.tipo)}</span>`}
      <div class="inv-card-name">${esc(it.name)}</div>
      <span class="inv-card-qty" title="Quantidade">×${it.qty}</span>
    </div>
    ${it.tipo === "consumivel" ? `<div class="inv-card-tags"><span class="effect-tag">🧪 Consumível</span>${it.effectValue ? `<span class="effect-tag dice">🎲 ${esc(it.effectValue)}</span>` : ""}</div>${it.effectDesc ? `<p class="inv-card-desc"><b>Efeito:</b> ${esc(it.effectDesc)}</p>` : ""}` : ""}
    ${it.tipo === "mochila" ? `<div class="inv-card-tags"><span class="effect-tag backpack">🎒 Mochila ${it.backpackEquipped ? "(equipada)" : "(guardada)"}</span><span class="effect-tag">+${fmt(it.backpackBonus)} espaço</span></div>` : ""}
    ${it.description ? `<p class="inv-card-desc">${esc(it.description)}</p>` : ""}
    <div class="inv-card-foot"><span class="inv-card-kind">${tipoRotulo(it.tipo)}</span><span>${fmt(it.espaco)} por unidade · subtotal <b>${sub}</b></span>${usar}</div>
  </article>`;
}

function render() {
  const d = data, i = d.info, dm = d.dom;
  const itens = nomesNaoVazios(d.inventario);
  const nome = i.nome || raw.nome || "Sem nome";

  const habs = d.habilidades.filter((h) => h.nome || h.desc);
  const pass = d.passivas.filter((h) => h.nome || h.desc);
  const secoes = [["sec-resumo", "Resumo"], ["sec-status", "Status"], ["sec-mochila", "Mochila"], ["sec-hab", "Habilidades"], ["sec-pas", "Passivas"], ["sec-apar", "Aparência"]];

  content.innerHTML = `
  <div class="toolbar view-actions">
    <a class="btn mini sec" href="${voltar}">← ${dono ? "Minhas fichas" : "Painel do Mestre"}</a>
    <div class="row-btns" style="margin:0">
      <button type="button" class="btn mini sec" id="btnImprimir">🖨️ Imprimir</button>
      ${podeEditar ? `<a class="btn mini" href="ficha-editor.html?id=${encodeURIComponent(id)}">✏️ Editar ficha</a>` : ""}
    </div>
  </div>

  <div class="panel sheet-hero">
    ${d.retrato ? `<img class="sheet-portrait" src="${d.retrato}" alt="Retrato">` : `<div class="sheet-portrait ph">👤</div>`}
    <div class="sheet-id">
      <div class="eyebrow" style="margin:0 0 .3rem">${dono ? "Seu personagem" : "Ficha de " + esc(owner.nome || "jogador")}</div>
      <h1>${esc(nome)}</h1>
      <div class="sheet-meta">
        <span>Idade: <b>${dash(i.idade)}</b></span><span>Altura: <b>${dash(i.altura)}</b></span>
        <span>Dom: <b>${dash(dm.nome)}</b></span><span>Categorias: <b>${dash(dm.categorias)}</b></span>
      </div>
    </div>
  </div>

  <nav class="secnav" aria-label="Seções">${secoes.map((s) => `<a href="#${s[0]}">${s[1]}</a>`).join("")}</nav>

  <div class="panel" id="sec-resumo">
    <h3 class="panel-title">Resumo</h3>
    <div class="sum-grid">
      <div class="sum-tile"><div class="sa-name">★ Fama</div><div class="sa-val">${dash(i.fama)}</div></div>
      <div class="sum-tile"><div class="sa-name"><span class="rosa">♥</span> Hp</div><div class="sa-val">${dash(i.hp)}</div></div>
      <div class="sum-tile"><div class="sa-name"><span class="verde">$</span> Money</div><div class="sa-val">${dash(i.money)}</div></div>
    </div>
    <div class="res-line"><span>🧠 Sanidade</span><b>${dash(i.sanidade)}%</b></div>
    ${barra(i.sanidade, 100, "san")}
    <div class="res-line"><span>🌀 EDOM</span><b>${dash(dm.edom)} / ${dash(dm.edomMax)}</b></div>
    ${barra(dm.edom, dm.edomMax, "edom")}
  </div>

  <div class="panel" id="sec-status">
    <h3 class="panel-title">Status</h3>
    <div class="sum-grid st">${STATUS.map((s) => `<div class="sum-tile"><div class="sa-name"><span>${s[2]}</span> ${s[1]}</div><div class="sa-val">${dash(d.status[s[0]])}</div></div>`).join("")}</div>
  </div>

  <div class="panel" id="sec-mochila">
    <h3 class="panel-title">Mochila</h3>
    <div class="weight-summary">${resumoEspaco(d.inventario)}</div>
    ${itens.length ? `<div class="inv-card-list">${d.inventario.map((it, k) => (String(it.name).trim() ? cartaoItem(it, k) : "")).join("")}</div>` : `<p class="hint" style="margin-top:1rem">Mochila vazia.</p>`}
  </div>

  <div class="panel" id="sec-hab">
    <h3 class="panel-title">Habilidades</h3>
    ${habs.length ? `<div class="sheet-item-list">${habs.map((h) => `<div class="sheet-item"><div class="si-head"><span class="si-name">${esc(h.nome || "Sem nome")}</span>${h.custo !== "" && h.custo != null ? `<span class="si-meta">${esc(h.custo)} EDOM</span>` : ""}</div>${h.desc ? `<p>${esc(h.desc)}</p>` : ""}</div>`).join("")}</div>` : `<p class="hint">Nenhuma habilidade.</p>`}
  </div>

  <div class="panel" id="sec-pas">
    <h3 class="panel-title">Habilidades passivas</h3>
    ${pass.length ? `<div class="sheet-item-list">${pass.map((h) => `<div class="sheet-item"><div class="si-head"><span class="si-name">${esc(h.nome || "Sem nome")}</span></div>${h.desc ? `<p>${esc(h.desc)}</p>` : ""}</div>`).join("")}</div>` : `<p class="hint">Nenhuma habilidade passiva.</p>`}
  </div>

  <div class="panel" id="sec-apar">
    <h3 class="panel-title">Aparência</h3>
    ${d.aparencia.trim() ? `<p class="sheet-text">${esc(d.aparencia)}</p>` : `<p class="hint">Sem descrição.</p>`}
  </div>`;

  document.getElementById("btnImprimir").onclick = () => print();
  content.querySelectorAll("[data-usar]").forEach((b) => b.addEventListener("click", () => usar(parseInt(b.dataset.usar, 10), b)));
}

async function usar(i, btn) {
  const it = data.inventario[i];
  if (!it || it.qty <= 0) return;
  if (!confirm("Usar 1 unidade de \"" + it.name + "\"?" + (it.effectDesc ? "\n\nEfeito: " + it.effectDesc : ""))) return;
  btn.disabled = true;
  it.qty -= 1;
  try {
    await updateDoc(doc(db, "fichas", id), { inventario: data.inventario, updatedAt: serverTimestamp() });
    render();
  } catch (e) {
    it.qty += 1; btn.disabled = false;
    alert("Não foi possível salvar (" + (e.code || e.message) + ").");
  }
}

render();
