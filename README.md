# Sistema HERUPU IA

Automação inteligente com WhatsApp + n8n + IA.

Este repositório também contém o **app HERUPU IA (PWA)** — uma página que o
cliente instala no celular e passa a ter o **ícone da HERUPU na tela inicial**.
Ao tocar no ícone, o app abre a conversa no **WhatsApp** da HERUPU.

---

## 📲 Como aparece o ícone de instalação

- **Android (Chrome):** ao abrir o site, aparece o botão **"Instalar aplicativo"**.
- **iPhone (Safari):** o app mostra o passo a passo — Compartilhar → **Adicionar à Tela de Início**.
- Depois de instalado, abre igual a um aplicativo, com o ícone da HERUPU.

---

## ⚙️ 1) Trocar o número do WhatsApp

Abra o arquivo **`config.js`** e troque só o número:

```js
whatsappNumber: "5511999999999",  // 55 (país) + DDD + número, só dígitos
```

Também dá para mudar a mensagem inicial e o nome exibido nesse mesmo arquivo.

---

## 🚀 2) Publicar de graça no GitHub Pages

1. No GitHub, abra este repositório → **Settings** → **Pages**.
2. Em **Source**, escolha **Deploy from a branch**.
3. Em **Branch**, selecione **`main`** e a pasta **`/ (root)`** e clique em **Save**.
4. Aguarde ~1 minuto. O endereço do app fica:

   ```
   https://herupuassistencia.github.io/herupu-ia/
   ```

5. Abra esse link no celular para instalar. (Requisito para o ícone de
   instalação: o site precisa estar em **HTTPS** — o GitHub Pages já fornece.)

> As mudanças deste app estão na branch de desenvolvimento
> `claude/herupu-mobile-install-icon-dmt15g`. Faça o **merge** dela na `main`
> (pelo Pull Request) antes de ativar o GitHub Pages na `main`.

---

## 🗂️ Arquivos do app

| Arquivo | Função |
|---|---|
| `index.html` | Tela do app (botão do WhatsApp + instalar) |
| `config.js` | **Onde você troca o número do WhatsApp** |
| `manifest.webmanifest` | Nome, cores e ícones do app |
| `sw.js` | Service worker (deixa instalável e offline) |
| `icons/` | Ícones do app (H em gradiente) |
| `scripts/generate-icons.js` | Gera os ícones novamente, se precisar |

Para regerar os ícones (opcional): `node scripts/generate-icons.js`
