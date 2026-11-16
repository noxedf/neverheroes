import { ico } from "./icons.js";
// Barra superior (estilo Heartsoul). Não depende do Firebase, então serve também ao Conceitos.
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  Object.keys(props || {}).forEach((k) => {
    if (k === "class") e.className = props[k];
    else if (k === "text") e.textContent = props[k];
    else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), props[k]);
    else e.setAttribute(k, props[k]);
  });
  kids.flat().forEach((c) => { if (c != null) e.append(c); });
  return e;
}

const avatar = (user, cls) => {
  if (user.avatar) return h("img", { class: cls, src: user.avatar, alt: "" });
  const s = h("span", { class: cls + " ph" }); s.innerHTML = ico("user"); return s;
};

/* opts: { home, subtitulo, ativa, grupos:[{rotulo, links:[{id,texto,href}]}],
           user:{nome, avatar, papel, mestre}|null, onSair, entrar, flow } */
export function buildTopbar(opts) {
  const bar = document.getElementById("topbar");
  // Reconstruir a barra (ex.: depois do login ser conhecido) não acumula listeners.
  if (bar._ac) bar._ac.abort();
  const ac = (bar._ac = new AbortController());
  const sig = { signal: ac.signal };

  bar.className = "topbar" + (opts.flow ? " flow" : "");
  bar.textContent = "";

  const brand = h("a", { class: "brand", href: opts.home || "index.html" },
    h("img", { class: "brand-seal", src: "images/icon.svg", alt: "" }),
    h("div", {},
      h("div", { class: "brand-title", text: "NEVER HEROES" }),
      opts.subtitulo ? h("div", { class: "brand-sub", text: opts.subtitulo }) : null));

  const menu = h("div", { class: "topbar-menu", id: "topbarMenu" });
  (opts.grupos || []).forEach((g, i) => {
    if (i) menu.append(h("span", { class: "topbar-divider" }));
    const grupo = h("div", { class: "topbar-group", "data-group-label": g.rotulo || "" });
    g.links.forEach((l) => grupo.append(h("a", { class: "tl" + (l.id === opts.ativa ? " on" : ""), href: l.href, text: l.texto })));
    menu.append(grupo);
  });

  // No celular o menu fica recolhido: a conta (ou o Entrar) fica sempre à vista ao lado do ☰.
  let rapido = null;
  if (opts.user) {
    menu.append(h("span", { class: "topbar-divider" }));
    const papel = h("span", { class: "topbar-role" + (opts.user.mestre ? " m" : ""), text: opts.user.papel || (opts.user.mestre ? "Mestre" : "Jogador") });
    menu.append(h("div", { class: "topbar-user" },
      h("a", { class: "who" + (opts.ativa === "perfil" ? " on" : ""), href: "perfil.html", title: "Meu perfil" },
        avatar(opts.user, "topbar-avatar"),
        h("span", { class: "who-txt" }, h("span", { class: "who-name", text: opts.user.nome || "Perfil" }), papel)),
      h("button", { type: "button", class: "btn-link", text: "Sair", onclick: opts.onSair })));
    rapido = h("a", { class: "topbar-me", href: "perfil.html", "aria-label": "Meu perfil: " + (opts.user.nome || "") }, avatar(opts.user, "topbar-avatar"));
  } else if (opts.entrar) {
    menu.append(h("span", { class: "topbar-divider" }));
    menu.append(h("div", { class: "topbar-user" }, h("a", { class: "btn mini", href: opts.entrar, text: "Entrar" })));
    rapido = h("a", { class: "btn mini topbar-me-entrar", href: opts.entrar, text: "Entrar" });
  }

  const toggle = h("button", { type: "button", class: "topbar-toggle", "aria-label": "Abrir menu", "aria-expanded": "false", "aria-controls": "topbarMenu", text: "☰" });
  const fechar = () => { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "☰"; };
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const abre = !menu.classList.contains("open");
    menu.classList.toggle("open", abre);
    toggle.setAttribute("aria-expanded", String(abre));
    toggle.textContent = abre ? "✕" : "☰";
  });
  document.addEventListener("click", (e) => { if (!bar.contains(e.target)) fechar(); }, sig);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(); }, sig);
  matchMedia("(min-width:861px)").addEventListener("change", fechar, sig);

  bar.append(brand, h("div", { class: "topbar-right" }, rapido, toggle), menu);
}
