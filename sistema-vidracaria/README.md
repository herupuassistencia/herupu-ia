# 🪟 Sistema Vidraçaria — HERUPU IA

Sistema web simples e completo para gestão de uma **vidraçaria**: cadastro de
clientes, catálogo de vidros/acessórios com preço por m² ou por unidade,
criação de orçamentos com **cálculo automático de área** (largura × altura) e
envio do orçamento por **WhatsApp** ou impressão em PDF.

Funciona 100% no navegador — **não precisa de servidor, banco de dados nem
instalação**. Os dados ficam salvos localmente no próprio navegador
(`localStorage`).

## ▶️ Como usar

1. Abra o arquivo `index.html` no navegador (duplo clique já funciona).
2. Já vem com dados de demonstração (clientes e catálogo) para você testar.

## ✨ Funcionalidades

| Módulo | O que faz |
|--------|-----------|
| **Painel** | Resumo: nº de clientes, orçamentos, valor aprovado e em aberto |
| **Orçamentos** | Cria/edita orçamentos, adiciona itens, aplica desconto (R$ ou %), define status |
| **Clientes** | Cadastro com nome, telefone, e-mail e endereço + busca |
| **Catálogo** | Produtos de vidraçaria com preço por m² ou por unidade |

### Cálculo automático de vidro
Ao adicionar um item cobrado **por m²**, basta informar **largura** e **altura**
em centímetros e a quantidade. O sistema calcula a área
(`largura/100 × altura/100`) e multiplica pelo preço do m².

Itens cobrados **por unidade** (kits, puxadores, mão de obra) são somados
diretamente pela quantidade.

### Orçamento pronto para o cliente
Cada orçamento pode ser:
- 🖨️ **Impresso / salvo em PDF** (layout limpo para impressão);
- 💬 **Enviado por WhatsApp** — abre o WhatsApp já com a mensagem formatada
  (usa o telefone cadastrado do cliente).

## 🗂️ Estrutura

```
sistema-vidracaria/
├── index.html        # página única (SPA)
├── css/style.css     # estilos
└── js/
    ├── db.js         # persistência em localStorage + dados de exemplo
    └── app.js        # telas, orçamentos, cálculos, WhatsApp/impressão
```

## 🔧 Personalização rápida

- **Preços / produtos:** edite pelo módulo **Catálogo** ou ajuste a lista
  `SEED.catalogo` em `js/db.js`.
- **Nome da empresa:** troque "Vidraçaria HERUPU" em `js/app.js`
  (funções `verOrcamento` e `enviarWhats`).

## 🚀 Integração com automação (HERUPU IA / n8n)
O texto gerado no botão de WhatsApp segue um formato padrão que pode ser
consumido por fluxos do n8n para envio automático via API do WhatsApp.
Como os dados ficam em `localStorage`, use `DB.exportJSON()` no console do
navegador para exportar tudo em JSON quando quiser integrar com outros sistemas.

---
Feito para o ecossistema **HERUPU IA** — automação inteligente com WhatsApp + n8n + IA.
