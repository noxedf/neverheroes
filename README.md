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
index.html, conceitos.html, fichas.html, ficha-view.html, ficha-editor.html, perfil.html, master.html  (contas e fichas)
css/app.css, css/topbar.css, css/refino.css (ajustes de celular, design e tema claro), js/fb.js, js/topbar.js, js/ficha-shared.js, js/ficha-view.js, js/ficha-editor.js
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
| `conceitos.html` | O conteúdo do RPG (Dom, EDOM, categorias, Semi-Deuses, regra de mesa) |
| `index.html` | Página inicial: entrar, criar conta, esqueci a senha, entrar com Google e login de Mestre |
| `fichas.html` | Minhas fichas: lista e cria personagens |
| `ficha-view.html?id=...` | A ficha só para leitura (resumo, status, mochila em cartões, habilidades, passivas, aparência). Consumíveis têm o botão "Usar 1" |
| `ficha-editor.html?id=...` | O editor: Salvar e Cancelar no fim da página, avisa se houver alterações não salvas |
| `perfil.html` | Nome, foto de perfil, sair e excluir conta |
| `mesa.html` | **Tabletop** (igual ao do Heartsoul, sem chat): mesas, mapas e cenas, tokens das fichas, dados, névoa/visão, iniciativa |
| `master.html` | Painel do Mestre: todas as fichas, agrupadas por jogador, com busca |

Arquivos: `css/app.css` (tema), `js/fb.js` (Firebase, topbar, login obrigatório), `js/firebase-config.js` (suas chaves) e `firestore.rules`.

### Configurar (uma vez)

1. No Firebase, **Build > Authentication > Sign-in method**: ative **E-mail/senha** e, se quiser o botão do Google, **Google**.
2. **Authentication > Settings > Authorized domains**: adicione `noxedf.github.io`.
3. **Build > Firestore Database > Create database** (modo produção).
4. Na aba **Rules** do Firestore, cole o conteúdo de `firestore.rules` e clique em **Publish**.
5. Cole o `firebaseConfig` do seu app web em `js/firebase-config.js`.

### Virar Mestre

1. Crie uma conta normal em `index.html` (aba **Sou Jogador > Criar conta**).
2. No Firestore, abra a coleção `users`, ache o documento da sua conta e mude o campo `role` de `player` para `master`.
3. Entre pela aba **Sou Mestre**. O Painel do Mestre mostra todas as fichas.

A mesma edição promove qualquer outra pessoa. Quem já tinha a coleção `admins` da versão anterior pode ignorá-la: ela não é mais usada.

### Como funciona

- Cada jogador vê e edita só as próprias fichas. O Mestre vê e edita todas (isso é garantido pelas regras do Firestore, não só escondido na tela).
- No editor, nada é gravado até clicar em **Salvar ficha**. Sair com alterações pendentes pede confirmação.
- A mochila funciona como a do Heartsoul: cada item tem nome, espaço por unidade, quantidade, tipo (comum, consumível ou mochila), imagem e descrição. O limite é 30 de espaço; uma Mochila equipada soma o espaço extra dela. Fichas antigas (30 campos de texto) são convertidas em itens ao abrir.
- A ficha mantém o visual de ficha do Never Heroes: logo, blocos com aba em seta, "Espaço 00/30" e, na mochila, o mesmo modelo do HeartSoul: resumo de espaço com medidor e itens com tipo, imagem e descrição.
- Dom: o dom principal mais o botão **+ Adicionar outro dom** (até 8 extras, cada um com nome e categorias). A EDOM é uma reserva só, compartilhada por todos os doms. Fichas antigas, sem doms extras, abrem normalmente. Os extras ficam no campo `domsExtra` da ficha.
- Conta: a barra do topo mostra foto, nome e papel (Jogador ou Mestre) em todas as páginas, inclusive no Conceitos. Quem não entrou vê o botão Entrar. No celular a conta fica ao lado do ☰.
- Status: Sorte, Vontade, Foco, Destreza, Força, Agilidade, Intelecto, Constituição, Carisma e **Instintos**. Fichas antigas, sem Instintos, abrem normalmente com o campo vazio.
- O botão 🎲 rola 1d20 nos status e 2d20 no HP.
- Habilidades e passivas aceitam uma imagem ou GIF de visualização (clique nela para ampliar). A Aparência tem a imagem do personagem em tamanho grande, sem recorte; o retrato pequeno de Informações e da lista de fichas usa essa mesma imagem.
- GIFs entram animados e sem alteração, com limite de 400 KB (450 KB na Aparência). Imagens comuns são reduzidas automaticamente. Tudo fica guardado no próprio documento da ficha, que tem limite de cerca de 900 KB no total.
- Fotos de perfil e imagens dos itens continuam sendo redimensionadas no navegador.


## Tabletop (mesa.html)

Portado da Mesa do Heartsoul. Scripts em `js/mesa/`, estilo em `css/mesa.css` e `css/mesa-base.css`.

- O Mestre cria mesas, gera mapas, troca de cena, usa névoa, paredes, portas, luzes, iniciativa e biblioteca de NPCs.
- O jogador entra na mesa com uma ficha: o token usa o nome e o retrato da ficha, e o HP vem de `Informações > HP`.
- HP é um valor único (a ficha do Never Heroes não tem HP por parte do corpo). O HP do token vale só na mesa.
- "Seus recursos" mostra a EDOM e grava na ficha. "Sua mochila" mostra os itens; consumíveis têm "Usar 1", que rola o dado do efeito e desconta 1 da ficha.
- Ao salvar a ficha no editor, o token dela nas mesas acompanha o novo nome e retrato.
- Qualquer pessoa logada vê as mesas; só o Mestre cria.
- **Republique o `firestore.rules`** (Firebase > Firestore > Rules > Publish), senão a Mesa dá erro de permissão.
