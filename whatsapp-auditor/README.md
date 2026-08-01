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
2. **Agendamentos**: identifica quem está **solicitando um horário/atendimento** e **avalia contra a agenda da atendente (Joseane)** — se está livre, em conflito, ou sugere os melhores horários.
3. **Ouve áudios** 🎧: transcreve as notas de voz que os clientes mandam e informa **quem** está pedindo e **o quê**.
4. **Fala em voz alta** 🗣️: como um secretário, narra as solicitações pra você (sem precisar olhar a tela).
5. **Resposta sugerida**: para cada conversa, o Claude gera uma resposta pronta (já com os horários, quando for agendamento).
6. **Relatório**: envia tudo para o **seu número** (`AUDIT_TARGET`).
7. **Tempo real**: também monitora mensagens novas conforme chegam.
8. Modo padrão **`avisar`** (você responde). Modo `responder`: ele responde sozinho (cuidado).

## Agenda (Joseane)

O arquivo **`agenda.json`** define o expediente e os compromissos da atendente. Edite-o com os
horários de trabalho e as reuniões já marcadas. Quando um cliente pede um horário, o HERUPU
verifica disponibilidade e propõe alternativas automaticamente.

## Voz — ouvir e falar

- **Ouvir (transcrição de áudios):** controlada por `STT_ENGINE`. **Padrão: `local` (grátis).**
  - A **análise do texto continua no Claude do seu plano** (sem custo). O Whisper é usado só
    para transformar o áudio em texto.
  - **Instalar o Whisper local (uma vez):**
    ```bash
    # Windows (PowerShell como Admin) — Python já vem com a JARVIS:
    winget install Gyan.FFmpeg
    pip install -U openai-whisper

    # Linux / VPS:
    sudo apt update && sudo apt install -y ffmpeg
    pip install -U openai-whisper
    ```
    Teste: `whisper --help` deve funcionar. Na 1ª transcrição ele baixa o modelo (~500 MB no `small`).
  - Dica de velocidade: para CPU, `whisper-ctranslate2` é bem mais rápido. Instale
    (`pip install whisper-ctranslate2`) e ponha `WHISPER_BIN=whisper-ctranslate2` no `.env`.
  - Alternativa paga e simples: `STT_ENGINE=openai` (Whisper API, ~centavos/min, precisa da chave).
- **Falar (secretário narra):** controlada por `VOZ_SAIDA=pc`.
  - **Windows:** usa a voz do sistema (grátis). Para voz em português, instale um pacote de voz
    pt-BR (Configurações › Hora e Idioma › Fala) e opcionalmente informe `VOZ_NOME`.
  - **Linux (VPS):** instale `espeak-ng` (`sudo apt install espeak-ng`). Lembre que o VPS só
    "fala" se tiver saída de áudio — em servidor sem som, use `VOZ_SAIDA=off` e leia o relatório.

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
| `STT_ENGINE` | Transcrição de áudio: `auto` / `openai` / `local` / `off` |
| `OPENAI_API_KEY` | Só para transcrição (se `openai`/`auto`) |
| `WHISPER_BIN` / `WHISPER_MODEL` | Whisper local (se `STT_ENGINE=local`) |
| `VOZ_SAIDA` | `pc` para falar em voz alta, `off` para só texto |
| `VOZ_NOME` | (Windows) nome da voz do sistema, ex.: `Microsoft Maria Desktop` |

---

## Importante / Segurança

- **Sem OpenAI**: a análise roda pelo Claude do seu plano (custo fixo).
- Comece **sempre** no modo `avisar`. Só mude para `responder` depois de testar bastante.
- Usa o **WhatsApp Web** (mesma conta do celular). O WhatsApp permite vários aparelhos
  conectados, então dá pra rodar o auditor **e** usar o WhatsApp normalmente ao mesmo tempo.
- Não é a API oficial do WhatsApp Business — para volume comercial alto, considere
  **Evolution API + n8n**.
- A pasta `wa-session/` guarda o login. **Não** suba ela para o GitHub (já está no `.gitignore`).
