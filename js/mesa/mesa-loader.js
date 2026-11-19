// Carrega a Mesa: primeiro o SDK "compat" do Firebase, depois os scripts na ordem certa.
import { firebaseConfig } from "../firebase-config.js";
import { buildTopbar } from "../topbar.js";

window.FIREBASE_CONFIG = firebaseConfig;
window.nhBuildTopbar = buildTopbar;

const SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
const ordem = [
  SDK + "firebase-app-compat.js", SDK + "firebase-auth-compat.js", SDK + "firebase-firestore-compat.js",
  "js/mesa/nh-compat.js", "js/mesa/mapgen.js", "js/mesa/mesa-board.js", "js/mesa/mesa-tools.js",
  "js/mesa/npc-library.js", "js/mesa/mesa-tokens.js", "js/mesa/mesa-dice.js",
  "js/mesa/mesa-init.js"
];
const carregar = (src) => new Promise((ok, falha) => {
  const s = document.createElement("script");
  s.src = src; s.async = false;
  s.onload = ok; s.onerror = () => falha(new Error("Não foi possível carregar " + src));
  document.head.append(s);
});
try {
  for (const src of ordem) await carregar(src);
} catch (e) {
  const d = document.createElement("div");
  d.className = "error-msg"; d.style.margin = "20px"; d.textContent = e.message;
  document.body.prepend(d);
}
