# 🚀 Como colocar no ar (deploy) — VIDRAP

O app é **estático** (HTML/CSS/JS). "Subir" = copiar a pasta `sistema-vidracaria/`
para um servidor web. Não precisa de banco de dados nem back-end.

## ✅ Requisitos
- **HTTPS obrigatório** — sem SSL o celular **não** instala como app e o modo
  offline (service worker) não liga. Praticamente todo host já oferece SSL grátis
  (Let's Encrypt).
- Servir os arquivos como estáticos (não precisa de PHP/Node).
- Ideal: um endereço curto e limpo, ex.: `https://app.vidrap.com.br/`
  (na raiz de um subdomínio a instalação fica mais bonita). Subpasta
  (`https://seudominio.com/vidrap/`) também funciona — os caminhos são relativos.

## Opção A — Hospedagem compartilhada (cPanel / FTP)
1. Acesse o **Gerenciador de Arquivos** (cPanel) ou conecte via **FTP** (FileZilla).
2. Crie uma pasta no `public_html`, ex.: `public_html/vidrap`
   (ou aponte um subdomínio `app.vidrap...` para essa pasta).
3. Envie **todo o conteúdo** de `sistema-vidracaria/` para lá:
   `index.html`, `manifest.webmanifest`, `sw.js`, `css/`, `js/`.
4. Garanta o **SSL ativo** para o domínio/subdomínio (cPanel → SSL/TLS ou AutoSSL).
5. Abra `https://.../vidrap/` no navegador. Pronto.

## Opção B — VPS com Nginx
```nginx
server {
    listen 443 ssl;
    server_name app.vidrap.com.br;

    ssl_certificate     /etc/letsencrypt/live/app.vidrap.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.vidrap.com.br/privkey.pem;

    root /var/www/vidrap;   # copie a pasta sistema-vidracaria/ para cá
    index index.html;

    # PWA: não cachear o service worker (para atualizações chegarem)
    location = /sw.js { add_header Cache-Control "no-cache"; }
    location = /manifest.webmanifest { types {} default_type application/manifest+json; }

    location / { try_files $uri $uri/ /index.html; }
}
```
Depois: `sudo nginx -t && sudo systemctl reload nginx`.

## Opção C — GitHub Pages (grátis, ótimo para testar/demonstrar)
1. No repositório: **Settings → Pages**.
2. Em *Build and deployment*, escolha **Deploy from a branch**.
3. Selecione o branch e a pasta (root), salve.
4. O link sai como `https://<usuario>.github.io/herupu-ia/sistema-vidracaria/`.
   > Observação: em repositório **privado**, o GitHub Pages exige plano pago.

## 📲 Instalar no celular do Haroldo (depois do deploy)
1. Abra o link **no Chrome (Android)** ou **Safari (iPhone)**.
2. **Android:** menu ⋮ → *Instalar app* / *Adicionar à tela inicial*.
   **iPhone:** botão Compartilhar → *Adicionar à Tela de Início*.
3. Vai aparecer o ícone **VIDRAP** dourado. Abre em tela cheia, como um app,
   e funciona **offline**.

## 🔁 Atualizações
Quando houver melhorias, basta **substituir os arquivos** no servidor. O service
worker detecta a nova versão na próxima abertura. (No Nginx, o `no-cache` no
`sw.js` acima ajuda a atualização a chegar rápido.)

## ⚠️ Dados do Haroldo
Os orçamentos/clientes ficam **no aparelho dele** (localStorage do navegador).
Oriente-o a usar **Ajustes → Exportar backup (JSON)** de tempos em tempos.
Para sincronizar entre aparelhos no futuro, dá para evoluir com um back-end
(ver "Próximos passos" no README).
