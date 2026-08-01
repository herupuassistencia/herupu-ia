# Auditor de WhatsApp — HERUPU JARVIS

Módulo **headless** (sem abrir nada) que faz a JARVIS **ler as mensagens do WhatsApp**,
**identificar** tipo e urgência, e **te enviar a resposta sugerida** no seu próprio WhatsApp.

Você escaneia o QR **uma única vez**; depois a sessão fica salva e roda sozinho em segundo plano.

---

## O que ele faz

1. Conecta ao WhatsApp Web em modo **headless** (invisível).
2. A cada mensagem recebida: classifica (financeiro / venda / suporte / reclamação / geral) e urgência.
3. Se a chave OpenAI estiver configurada, gera um **resumo** e uma **sugestão de resposta** pronta.
4. Envia esse alerta para o **seu número** (`AUDIT_TARGET`).
5. Modo padrão **`avisar`**: você lê e responde. Modo `responder`: ele responde sozinho (cuidado).

---

## Instalação

### No Windows (mesma máquina da JARVIS)
1. Copie a pasta `whatsapp-auditor` para dentro da pasta da JARVIS.
2. Dê 2 cliques em **`INICIAR-AUDITOR.bat`**.
   - Na 1ª vez ele cria o `.env` a partir do exemplo — **edite** e preencha `AUDIT_TARGET`.
   - Rode de novo, **escaneie o QR** (WhatsApp > Aparelhos conectados).

### No VPS Linux (Contabo)
```bash
cd whatsapp-auditor
cp .env.example .env
nano .env                 # preencha AUDIT_TARGET, OPENAI_API_KEY e CHROME_PATH
# Instale o Chromium (uma vez):
sudo apt update && sudo apt install -y chromium-browser
# aponte CHROME_PATH=/usr/bin/chromium-browser no .env
npm install
node auditor.js           # escaneie o QR na primeira vez
```

Para rodar 24/7 no VPS, use **pm2**:
```bash
npm install -g pm2
pm2 start auditor.js --name jarvis-whatsapp
pm2 save
pm2 startup
```

---

## Configuração (`.env`)

| Variável | O que é |
|---|---|
| `AUDIT_TARGET` | **Seu** número (DDI+DDD+número, só dígitos). Ex.: `5511999998888` |
| `OPENAI_API_KEY` | A mesma chave que a JARVIS já usa (opcional, melhora a análise) |
| `AUDIT_MODE` | `avisar` (você responde) ou `responder` (responde sozinho) |
| `AUDIT_IGNORE_GROUPS` | `true` para ignorar grupos |
| `CHROME_PATH` | Só no Linux: caminho do Chromium |

---

## Importante / Segurança

- Comece **sempre** no modo `avisar`. Só mude para `responder` depois de testar bastante.
- O auditor usa o **WhatsApp Web** (mesma conta do seu celular). Não é a API oficial do WhatsApp
  Business — para volume alto ou uso comercial pesado, considere a **Evolution API + n8n**.
- A pasta `wa-session/` guarda o login. **Não** suba ela para o GitHub (já está no `.gitignore`).
