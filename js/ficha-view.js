import { db, guard, renderTopbar, el } from "./fb.js";
import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ampliarImagem, STATUS, esc, fmt, num, normalizar, nomesNaoVazios, resumoEspaco, tipoRotulo, tipoIcone } from "./ficha-shared.js";

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

function barraEdom(atual, max) {
  const m = num(max, 0), a = num(atual, 0);
  const pct = m > 0 ? Math.max(0, Math.min(100, (a / m) * 100)) : 0;
  return `<div class="barra-edom"><i style="width:${pct}%"></i></div>`;
}
const linha = (ic, nome, valor, extra) => `<div class="l2"><span>${ic ? `<i class="ic ${extra || ""}">${ic}</i>` : ""}${nome}</span><b class="val">${valor}</b></div>`;

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

  content.innerHTML = `
  <div class="toolbar view-actions">
    <a class="btn mini sec" href="${voltar}">← ${dono ? "Minhas fichas" : "Painel do Mestre"}</a>
    <div class="row-btns" style="margin:0">
      <button type="button" class="btn mini sec" id="btnImprimir">🖨️ Imprimir</button>
      ${podeEditar ? `<a class="btn mini" href="ficha-editor.html?id=${encodeURIComponent(id)}">✏️ Editar ficha</a>` : ""}
    </div>
  </div>
  ${dono ? "" : `<p class="dono">Ficha de ${esc(owner.nome || "jogador")}</p>`}

  <div class="ficha">
    <div class="ficha-logo">NEVER HEROES</div>

    <section class="bloco">
      <div class="aba"><i>✦</i>Informações</div>
      <div class="corpo">
        <div class="info-wrap">
        <div class="retrato">${d.retrato ? `<img class="pic" src="${d.retrato}" alt="Retrato">` : `<div class="pic">👤</div>`}</div>
        <div class="info">
          <div>
            ${linha("", "Nome", dash(nome))}${linha("", "Idade", dash(i.idade))}${linha("", "Altura", dash(i.altura))}
          </div>
          <div>
            ${linha("★", "Fama", dash(i.fama))}${linha("♥", "Hp", dash(i.hp), "rosa")}${linha("$", "Money", dash(i.money), "verde")}
            ${linha("🧠", "Sanidade", dash(i.sanidade) + (i.sanidade === "" || i.sanidade == null ? "" : "%"), "rosa")}
          </div>
        </div>
        </div>
        <div class="res-bar san"><span style="width:${Math.max(0, Math.min(100, num(i.sanidade, 0)))}%"></span></div>
      </div>
    </section>

    <section class="bloco">
      <div class="aba"><i>◎</i>Dom</div>
      <div class="corpo">
        ${(() => {
          const lista = [{ nome: dm.nome, categorias: dm.categorias }].concat(d.domsExtra.filter((x) => x.nome || x.categorias));
          const varios = lista.length > 1;
          return lista.map((x, k) => `<div class="dom-card${k ? " extra" : ""}">
            ${varios ? `<div class="dom-card-head"><span class="dom-chip">Dom ${k + 1}</span></div>` : ""}
            <div class="dom">${linha("", "Dom", dash(x.nome))}${linha("", "Categorias", dash(x.categorias))}</div>
          </div>`).join("") + `<div class="dom dom-edom">
            ${linha("🌀", "EDOM", dash(dm.edom) + " / " + dash(dm.edomMax), "azul")}
            ${barraEdom(dm.edom, dm.edomMax)}
            ${varios ? `<p class="hint dom-edom-nota">A EDOM é uma reserva só, usada por todos os seus doms.</p>` : ""}
          </div>`;
        })()}
      </div>
    </section>

    <section class="bloco">
      <div class="aba"><i>📈</i>Status</div>
      <div class="corpo"><div class="status">${STATUS.map((s) => linha(s[2], s[1], dash(d.status[s[0]]))).join("")}</div></div>
    </section>

    <section class="bloco">
      <div class="aba"><i>🎒</i>Mochila</div>
      <div class="corpo">
        <div class="weight-summary">${resumoEspaco(d.inventario)}</div>
        ${itens.length ? `<div class="inv-card-list">${d.inventario.map((it, k) => (String(it.name).trim() ? cartaoItem(it, k) : "")).join("")}</div>` : `<p class="hint" style="margin-top:1rem">Mochila vazia.</p>`}
      </div>
    </section>

    <section class="bloco">
      <div class="aba"><i>✦</i>Habilidades</div>
      <div class="corpo">
        ${habs.length ? `<div class="sheet-item-list">${habs.map((h) => `<div class="sheet-item"><div class="si-head"><span class="si-name">${esc(h.nome || "Sem nome")}</span>${h.custo !== "" && h.custo != null ? `<span class="si-meta">${esc(h.custo)} EDOM</span>` : ""}</div>${h.image ? `<img class="si-img" data-zoom src="${h.image}" alt="${esc(h.nome || "Habilidade")}">` : ""}${h.desc ? `<p>${esc(h.desc)}</p>` : ""}</div>`).join("")}</div>` : `<p class="hint" style="margin:0">Nenhuma habilidade.</p>`}
      </div>
    </section>

    <section class="bloco">
      <div class="aba"><i>🔒</i>Habilidades passivas</div>
      <div class="corpo">
        ${pass.length ? `<div class="sheet-item-list">${pass.map((h) => `<div class="sheet-item"><div class="si-head"><span class="si-name">${esc(h.nome || "Sem nome")}</span></div>${h.image ? `<img class="si-img" data-zoom src="${h.image}" alt="${esc(h.nome || "Habilidade")}">` : ""}${h.desc ? `<p>${esc(h.desc)}</p>` : ""}</div>`).join("")}</div>` : `<p class="hint" style="margin:0">Nenhuma habilidade passiva.</p>`}
      </div>
    </section>

    <section class="bloco">
      <div class="aba"><i>👤</i>Aparência</div>
      <div class="corpo">${d.retrato ? `<div class="apar-view"><img class="apar-pic" data-zoom src="${d.retrato}" alt="${esc(nome)}"></div>` : ""}${d.aparencia.trim() ? `<p class="sheet-text">${esc(d.aparencia)}</p>` : `<p class="hint" style="margin:0">Sem descrição.</p>`}</div>
    </section>
  </div>`;

  document.getElementById("btnImprimir").onclick = () => print();
  content.querySelectorAll("[data-zoom]").forEach((im) => im.addEventListener("click", () => ampliarImagem(im.src)));
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
