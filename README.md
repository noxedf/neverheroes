# Never Heroes

Site do RPG Never Heroes (HTML, CSS e JavaScript puros, sem dependências).

## Estrutura

```
index.html
css/style.css
js/main.js
images/banner.png   (imagem de pré-visualização do link, 1200x630)
images/icon.svg     (ícone do site, vetorial)
images/icon.png     (ícone do site, 512x512)
login.html, fichas.html, ficha.html, perfil.html, master.html  (contas e fichas)
css/app.css, js/fb.js, js/ficha.js
js/firebase-config.js  (suas chaves do Firebase)
firestore.rules     (regras de segurança do banco)
```

## Como atualizar o repositório

1. Extraia o zip.
2. No repositório `noxedf/neverheroes`, clique em **Add file > Upload files**.
3. Arraste **o conteúdo** da pasta `never-heroes` (o `index.html`, as pastas `css`, `js` e `images` e este README), não a pasta em si.
4. Confirme com **Commit changes**. Os arquivos antigos com o mesmo nome são substituídos.

## GitHub Pages

Em **Settings > Pages**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`. O site fica em:

`https://noxedf.github.io/neverheroes/`

As fontes (Cinzel e Cormorant Garamond) vêm do Google Fonts, então o site precisa de internet para exibi-las corretamente.

## Banner ao compartilhar o link (Discord e outros)

As tags de pré-visualização já apontam para `https://noxedf.github.io/neverheroes/images/banner.png`.
Se o Discord mostrar uma imagem antiga depois de uma troca, é cache: envie o link com `?v=2` no final.


## Fichas dos jogadores (Firebase)

O site tem uma área de contas e fichas, no mesmo esquema do Heartsoul, guardada no **Firestore**:

| Página | O que faz |
| --- | --- |
| `login.html` | Entrar, criar conta, esqueci a senha, entrar com Google e login de Mestre |
| `fichas.html` | Minhas fichas: lista e cria personagens |
| `ficha.html?id=...` | A ficha (Informações, Dom, Status, Mochila, Habilidades, Passivas, Aparência) |
| `perfil.html` | Nome, foto de perfil, sair e excluir conta |
| `master.html` | Painel do Mestre: todas as fichas, agrupadas por jogador, com busca |

Arquivos: `css/app.css` (tema), `js/fb.js` (Firebase, topbar, login obrigatório), `js/ficha.js`, `js/firebase-config.js` (suas chaves) e `firestore.rules`.

### Configurar (uma vez)

1. No Firebase, **Build > Authentication > Sign-in method**: ative **E-mail/senha** e, se quiser o botão do Google, **Google**.
2. **Authentication > Settings > Authorized domains**: adicione `noxedf.github.io`.
3. **Build > Firestore Database > Create database** (modo produção).
4. Na aba **Rules** do Firestore, cole o conteúdo de `firestore.rules` e clique em **Publish**.
5. Cole o `firebaseConfig` do seu app web em `js/firebase-config.js`.

### Virar Mestre

1. Crie uma conta normal em `login.html` (aba **Sou Jogador > Criar conta**).
2. No Firestore, abra a coleção `users`, ache o documento da sua conta e mude o campo `role` de `player` para `master`.
3. Entre pela aba **Sou Mestre**. O Painel do Mestre mostra todas as fichas.

A mesma edição promove qualquer outra pessoa. Quem já tinha a coleção `admins` da versão anterior pode ignorá-la: ela não é mais usada.

### Como funciona

- Cada jogador vê e edita só as próprias fichas. O Mestre vê e edita todas (isso é garantido pelas regras do Firestore, não só escondido na tela).
- A ficha salva sozinha cerca de 1 segundo depois da última alteração.
- O botão 🎲 rola 1d20 nos status e 2d20 no HP.
- Fotos (perfil e retrato) são redimensionadas no navegador e guardadas no próprio documento.
