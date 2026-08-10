# 🪟 Orçamentos — Vidraçaria & Esquadrias (HERUPU IA)

Aplicativo **mobile-first** para o cliente que trabalha com **vidraçaria e esquadrias**
e usa **somente o celular**. O objetivo principal é **entregar orçamentos de forma
profissional e com agilidade** — pesquisado e inspirado nos melhores sistemas do
segmento (EsquadriApp, ECG Glass, WVetro, AlumiCalc, Meu Vidraceiro, Cálculo Certo).

Funciona 100% no navegador do celular, **sem servidor, sem instalação e offline**.
Pode ser **instalado na tela inicial** (PWA) e passa a abrir como um app.

## ▶️ Como usar
- **Testar agora:** abra `index.html` no navegador.
- **No celular do cliente (recomendado):** hospede a pasta (ex.: GitHub Pages) e, no
  celular, use *"Adicionar à tela de início"*. O app passa a funcionar como aplicativo,
  inclusive **offline**.

## ⭐ O que ele faz (recursos priorizados na pesquisa do segmento)

| Recurso | Descrição |
|--------|-----------|
| **Orçamento rápido** | Fluxo pensado para o dedo: escolhe cliente → adiciona itens → total sempre à vista → envia. |
| **Cálculo por m²** | Vidros e espelhos: informa largura × altura (cm) e calcula a área e o valor. |
| **Esquadrias por vão + folga** | Informa a **medida do vão**; o app calcula o valor e mostra a **medida do vidro já com a folga** (para o corte). Componentes fixos (kit box, roldanas, puxador…) somados automaticamente. |
| **Cobrança por vão ou por vidro** | Cada tipologia define se cobra pela área do vão ou do vidro cortado. |
| **Envio profissional** | 💬 **WhatsApp** com mensagem formatada, 📤 **Compartilhar** (share nativo) e 🖨️ **PDF/impressão**. |
| **Identidade da empresa** | Nome, slogan, telefone, CNPJ, **logo** (emoji ou imagem) e **cor da marca** — aparecem no orçamento. Ideal para começar a partir do cartão de visita. |
| **Clientes** | Cadastro rápido com busca; envio já usa o WhatsApp do cliente. |
| **Preços editáveis** | Tabela de esquadrias (tipologias, folgas, componentes) e produtos avulsos. |
| **Backup** | Exporta tudo em JSON (os dados ficam no aparelho). |

## 🧮 Como funciona o cálculo de esquadria
1. Escolhe a tipologia (ex.: *Box de Correr 8mm*, *Janela de Correr 2 folhas*).
2. Informa **largura × altura do vão** (cm) e a quantidade.
3. O app calcula:
   - **Área do vão** = L × A;
   - **Medida do vidro** = (L − folga) × (A − folga) — mostrada para o corte;
   - **Valor** = área (do vão *ou* do vidro, conforme configurado) × preço do m² **+ componentes**.

## 🗂️ Estrutura
```
sistema-vidracaria/
├── index.html            # shell mobile-first (app bar + navegação inferior)
├── manifest.webmanifest  # PWA (instalar na tela inicial)
├── sw.js                 # service worker (uso offline quando hospedado)
├── css/style.css         # estilos mobile-first
└── js/
    ├── db.js             # dados no localStorage (empresa, clientes, produtos, esquadrias, orçamentos)
    └── app.js            # telas, cálculo de orçamento, WhatsApp/compartilhar/PDF
```

## 🔧 Personalização
- **Empresa/marca:** em **Ajustes → Dados da empresa** (edite direto no app).
- **Preços/esquadrias:** em **Ajustes → Esquadrias** e **Produtos avulsos**.

## 🚀 Próximos passos possíveis
Integração com **n8n + API de WhatsApp** (Evolution/Z-API/oficial) para envio
automático, e sincronização em nuvem. O código já gera a mensagem em formato
padrão pronta para esses fluxos.

---
Parte do ecossistema **HERUPU IA** — automação inteligente com WhatsApp + n8n + IA.
