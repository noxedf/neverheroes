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

/* opts: { home, subtitulo, ativa, grupos:[{rotulo, links:[{id,texto,href}]}], user:{nome, avatar}|null, onSair, flow } */
export function buildTopbar(opts) {
  const bar = document.getElementById("topbar");
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
  if (opts.user) {
    menu.append(h("span", { class: "topbar-divider" }));
    const av = opts.user.avatar
      ? h("img", { class: "topbar-avatar", src: opts.user.avatar, alt: "" })
      : h("span", { class: "topbar-avatar ph", text: "👤" });
    menu.append(h("div", { class: "topbar-user" },
      h("a", { class: "who" + (opts.ativa === "perfil" ? " on" : ""), href: "perfil.html", title: "Meu perfil" }, av, h("span", { text: opts.user.nome || "Perfil" })),
      h("button", { type: "button", class: "btn-link", text: "Sair", onclick: opts.onSair })));
  } else if (opts.entrar) {
    menu.append(h("span", { class: "topbar-divider" }));
    menu.append(h("div", { class: "topbar-user" }, h("a", { class: "btn mini", href: opts.entrar, text: "Entrar" })));
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
  document.addEventListener("click", (e) => { if (!bar.contains(e.target)) fechar(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(); });
  matchMedia("(min-width:861px)").addEventListener("change", fechar);

  bar.append(brand, toggle, menu);
}
