// Camada de ligação entre a Mesa (portada do Heartsoul, Firebase "compat") e o resto do Never Heroes.
// Mantém os nomes que os scripts mesa-*.js esperam: auth, db, guardPage, renderTopbar, escapeHtml, fmtDate...
firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

function escapeHtml(str) {
if (str === null || str === undefined) return '';
return String(str)
.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fmtDate(ts) {
if (!ts) return '';
const d = ts.toDate ? ts.toDate() : new Date(ts);
return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
async function getUserProfile(uid) {
const d = await db.collection('users').doc(uid).get();
return d.exists ? d.data() : null;
}
// Toda conta nova nasce como jogador (igual ao js/fb.js).
async function createUserProfile(user) {
const p = {
name: String(user.displayName || (user.email || '').split('@')[0] || 'Jogador').trim().slice(0, 60),
email: user.email || '',
role: 'player',
avatarImage: '',
createdAt: firebase.firestore.FieldValue.serverTimestamp()
};
await db.collection('users').doc(user.uid).set(p);
return p;
}
function nhHome(profile) { return profile.role === 'master' ? 'master.html' : 'fichas.html'; }

function guardPage(requiredRole, onReady) {
let started = false;
const connTimeout = setTimeout(() => {
const m = document.createElement('div');
m.className = 'error-msg';
m.style.margin = '20px';
m.textContent = 'Não foi possível conectar. Verifique a internet e recarregue a página.';
document.body.prepend(m);
}, 9000);
auth.onAuthStateChanged(async (user) => {
clearTimeout(connTimeout);
if (!user) { location.replace('index.html'); return; }
try {
let profile = await getUserProfile(user.uid);
if (!profile) profile = await createUserProfile(user);
if (requiredRole && profile.role !== requiredRole) { location.replace(nhHome(profile)); return; }
if (started) return;
started = true;
onReady(user, profile);
} catch (e) {
const m = document.createElement('div');
m.className = 'error-msg';
m.style.margin = '20px';
m.textContent = 'Erro ao carregar seu perfil (' + (e.code || e.message) + ').';
document.body.prepend(m);
}
});
}

function renderTopbar(profile) {
const mestre = profile.role === 'master';
const links = [{ id: 'fichas', texto: 'Fichas', href: 'fichas.html' }];
if (mestre) links.push({ id: 'master', texto: 'Painel do Mestre', href: 'master.html' });
links.push({ id: 'mesa', texto: 'Tabletop', href: 'mesa.html' });
window.nhBuildTopbar({
home: nhHome(profile), subtitulo: 'Tabletop', ativa: 'mesa',
grupos: [{ rotulo: 'Mesa', links }, { rotulo: 'Mundo', links: [{ id: 'conceitos', texto: 'Conceitos', href: 'conceitos.html' }] }],
flow: true,
user: { nome: profile.name, avatar: profile.avatarImage, mestre, papel: mestre ? 'Mestre' : 'Jogador' },
onSair: async () => { await auth.signOut(); location.replace('index.html'); }
});
}

// Subcoleções de uma mesa (apagadas em cascata ao excluir a mesa).
const TABLE_SUBCOLLECTIONS = [
'tokens', 'rolls', 'scenes', 'drawings', 'fog', 'pings', 'templates', 'initiative',
'presence', 'walls', 'doors', 'lights', 'visionMemory'
];
async function deleteAllDocs(ref) {
const snap = await ref.get();
const docs = snap.docs;
for (let i = 0; i < docs.length; i += 450) {
const batch = db.batch();
docs.slice(i, i + 450).forEach(d => batch.delete(d.ref));
await batch.commit();
}
}
async function deleteTableCascade(tableId) {
const tableRef = db.collection('tables').doc(tableId);
for (const sub of TABLE_SUBCOLLECTIONS) await deleteAllDocs(tableRef.collection(sub));
await tableRef.delete();
}

/* ---------- ficha do Never Heroes -> "sheet" que a mesa entende ---------- */
function nhImgOk(v) { return typeof v === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,/.test(v) ? v : ''; }
function nhSheetFromFicha(id, f) {
f = f || {};
const info = f.info || {};
const hp = parseFloat(String(info.hp == null ? '' : info.hp).replace(',', '.'));
return {
id,
raw: f,
characterName: String(info.nome || f.nome || '').trim() || 'Sem nome',
// retrato = imagem do personagem (Aparência); 'aparencia' é só o texto
appearanceImage: nhImgOk(f.retrato),
hpMax: isFinite(hp) && hp > 0 ? Math.round(hp) : null
};
}
// Reduz a imagem para caber no token (documento do Firestore tem limite de 1 MB). GIF pequeno entra como está.
function nhShrinkImage(src, max) {
return new Promise((resolve) => {
if (!src) { resolve(''); return; }
if (/^data:image\/gif/.test(src) && src.length < 150000) { resolve(src); return; }
const img = new Image();
img.onerror = () => resolve('');
img.onload = () => {
const k = Math.min(1, max / Math.max(img.width, img.height));
const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
const c = document.createElement('canvas'); c.width = w; c.height = h;
c.getContext('2d').drawImage(img, 0, 0, w, h);
resolve(c.toDataURL('image/webp', 0.85).startsWith('data:image/webp') ? c.toDataURL('image/webp', 0.85) : c.toDataURL('image/jpeg', 0.85));
};
img.src = src;
});
}
