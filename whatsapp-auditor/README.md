# Auditor de WhatsApp — HERUPU JARVIS

Módulo **headless** (sem abrir nada) que faz a JARVIS **auditar as conversas do WhatsApp**,
achar **pedidos não respondidos** e **agendamentos solicitados**, e **te enviar um relatório
com a resposta sugerida** no seu próprio WhatsApp.

A análise usa o **Claude CLI** que já está instalado (o mesmo do seu plano) —
**sem custo de OpenAI**. É a versão automática do que você já faz com a extensão do Claude no Chrome.

Você escaneia o QR **uma única vez**; depois a sessão fica salva e roda sozinho em segundo plano.

---

## O que ele faz

1. **Auditoria completa**: varre as conversas e lista as que têm **pedido não respondido**.
2. **Agendamentos**: identifica quem está **solicitando um horário/atendimento**.
3. **Resposta sugerida**: para cada conversa, o Claude gera uma resposta pronta.
4. **Relatório**: envia tudo para o **seu número** (`AUDIT_TARGET`).
5. **Tempo real**: também monitora mensagens novas conforme chegam.
6. Modo padrão **`avisar`** (você responde). Modo `responder`: ele responde sozinho (cuidado).

---

## Pré-requisitos

- **Node.js** (já instalado pela JARVIS).
- **Claude CLI** instalado e **logado** (`claude auth login`). É o mesmo que a JARVIS usa.
  - Teste rápido: no terminal, `claude -p "diga ok"` deve responder `ok`.

---

## Instalação

### No Windows (mesma máquina da JARVIS)
1. Copie a pasta `whatsapp-auditor` para dentro da pasta da JARVIS.
2. Dê 2 cliques em **`INICIAR-AUDITOR.bat`**.
   - Na 1ª vez ele cria o `.env` a partir do exemplo (com seu número já preenchido).
   - Rode de novo, **escaneie o QR** (WhatsApp › Aparelhos conectados).

### No VPS Linux (Contabo)
```bash
cd whatsapp-auditor
cp .env.example .env
nano .env                 # confira AUDIT_TARGET e ajuste CHROME_PATH
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
| `AUDIT_TARGET` | **Seu** número (DDI+DDD+número, só dígitos). Ex.: `5596984153280` |
| `AUDIT_MODEL` | Modelo do Claude: `sonnet` (padrão) ou `opus` |
| `CLAUDE_BIN` | Caminho do Claude CLI (normalmente só `claude`) |
| `AUDIT_MODE` | `avisar` (você responde) ou `responder` (responde sozinho) |
| `AUDIT_SWEEP_MIN` | Re-auditar tudo a cada N minutos (`0` = só ao ligar) |
| `AUDIT_MAX_ITENS` | Máximo de conversas detalhadas no relatório |
| `AUDIT_IGNORE_GROUPS` | `true` para ignorar grupos |
| `CHROME_PATH` | Só no Linux: caminho do Chromium |

---

## Importante / Segurança

- **Sem OpenAI**: a análise roda pelo Claude do seu plano (custo fixo).
- Comece **sempre** no modo `avisar`. Só mude para `responder` depois de testar bastante.
- Usa o **WhatsApp Web** (mesma conta do celular). O WhatsApp permite vários aparelhos
  conectados, então dá pra rodar o auditor **e** usar o WhatsApp normalmente ao mesmo tempo.
- Não é a API oficial do WhatsApp Business — para volume comercial alto, considere
  **Evolution API + n8n**.
- A pasta `wa-session/` guarda o login. **Não** suba ela para o GitHub (já está no `.gitignore`).
