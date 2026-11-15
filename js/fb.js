// Base compartilhada: Firebase, perfil do usuário, proteção de página e topbar.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { buildTopbar } from "./topbar.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function el(tag, props, ...kids) {
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

export async function getProfile(uid) {
  const s = await getDoc(doc(db, "users", uid));
  return s.exists() ? s.data() : null;
}

// Toda conta nova nasce como jogador. Virar Mestre é manual (README).
export async function createProfile(user, name) {
  const p = {
    name: (name || user.displayName || (user.email || "").split("@")[0] || "Jogador").trim().slice(0, 60),
    email: user.email || "",
    role: "player",
    avatarImage: "",
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, "users", user.uid), p);
  return p;
}

export const home = (profile) => (profile.role === "master" ? "master.html" : "fichas.html");

// Espera o login. Sem login, vai para a tela de entrada.
export function guard(role) {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      document.body.prepend(el("div", { class: "msg", text: "Não foi possível conectar. Verifique a internet e recarregue a página." }));
    }, 9000);
    onAuthStateChanged(auth, async (u) => {
      clearTimeout(t);
      if (!u) { location.replace("index.html"); return; }
      try {
        let profile = await getProfile(u.uid);
        if (!profile) profile = await createProfile(u);
        if (role && profile.role !== role) { location.replace(home(profile)); return; }
        resolve({ user: u, profile });
      } catch (e) {
        document.body.prepend(el("div", { class: "msg", text: "Erro ao carregar seu perfil (" + (e.code || e.message) + ")." }));
      }
    });
  });
}

export function avatarNode(profile, cls) {
  if (profile && profile.avatarImage) return el("img", { class: cls, src: profile.avatarImage, alt: "" });
  return el("span", { class: cls, text: "👤" });
}

export function renderTopbar(profile, ativa, subtitulo) {
  const grupos = [{ rotulo: "Mesa", links: [{ id: "fichas", texto: "Fichas", href: "fichas.html" }] }];
  if (profile.role === "master") grupos[0].links.push({ id: "master", texto: "Painel do Mestre", href: "master.html" });
  grupos.push({ rotulo: "Mundo", links: [{ id: "conceitos", texto: "Conceitos", href: "conceitos.html" }] });
  buildTopbar({
    home: home(profile), subtitulo, ativa, grupos,
    user: { nome: profile.name, avatar: profile.avatarImage },
    onSair: async () => { await signOut(auth); location.replace("index.html"); }
  });
}

// Recorta ao centro e reduz a imagem (fica pequena o bastante para o Firestore).
export function resizeImage(file, dim) {
  dim = dim || 320;
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) { reject(new Error("Escolha um arquivo de imagem válido.")); return; }
    const r = new FileReader();
    r.onerror = () => reject(new Error("Não foi possível ler esse arquivo."));
    r.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível ler essa imagem."));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const d = Math.min(dim, side);
        const c = document.createElement("canvas");
        c.width = d; c.height = d;
        c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, d, d);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });
}

export function fmtData(ts) {
  if (!ts || !ts.seconds) return "";
  return new Date(ts.seconds * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export const FONTS = "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap";
