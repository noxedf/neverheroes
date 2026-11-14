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
ficha.html          (fichas dos jogadores)
css/ficha.css
js/ficha.js
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

A página `ficha.html` guarda as fichas no **Firestore**, com login pelo **Google**. Cada jogador vê e edita só as próprias fichas; o Mestre vê e edita todas. O site continua sem build: o Firebase é carregado direto do CDN.

### Configurar (uma vez)

1. Em https://console.firebase.google.com, crie um projeto (o plano gratuito basta).
2. **Build > Authentication > Get started > Sign-in method**: ative **Google**.
3. Em **Authentication > Settings > Authorized domains**, adicione `noxedf.github.io` (e `localhost`, se for testar no seu computador).
4. **Build > Firestore Database > Create database** (modo produção, escolha uma região).
5. Na aba **Rules** do Firestore, cole o conteúdo de `firestore.rules` e clique em **Publish**.
6. **Configurações do projeto > Seus apps > Web (`</>`)**: registre um app e copie o objeto `firebaseConfig` para `js/firebase-config.js`. Essas chaves não são secretas; quem protege os dados são as regras.

### Virar Mestre

1. Entre uma vez em `ficha.html` com a sua conta.
2. No Firestore, crie a coleção `admins` e um documento cujo **ID seja o seu UID** (Authentication > Users > coluna "User UID"). O conteúdo pode ser qualquer campo, por exemplo `mestre: true`.
3. Recarregue a página: aparece o botão **Ver todas (Mestre)**.

### Como funciona

- Os dados ficam na coleção `fichas`: `info`, `dom`, `status`, `mochila` (30 espaços), `habilidades`, `passivas` e `aparencia`.
- Salva sozinho, cerca de 1 segundo depois da última alteração.
- O botão 🎲 rola 1d20 nos status e 2d20 no HP.
- Cada ficha tem um link próprio (`ficha.html#ID`).
