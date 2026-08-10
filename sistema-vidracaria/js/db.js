/* db.js — camada de persistência (localStorage). Tudo fica no aparelho do usuário.
   Modelo focado em orçamento rápido para VIDRAÇARIA + ESQUADRIAS. */
(function (global) {
  'use strict';

  var KEY = 'herupu_vidracaria_v2';

  function uid() {
    return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  var SEED = {
    // Dados do "cartão de visita" — o cliente edita em Configurações.
    empresa: {
      nome: 'Sua Vidraçaria',
      slogan: 'Vidros e Esquadrias',
      telefone: '',
      whatsapp: '',
      endereco: '',
      cnpj: '',
      cor: '#0ea5e9',
      logo: '🪟',            // emoji ou imagem (data URI)
      validadeDias: 7,
      condicoes: 'Valores sujeitos a confirmação de medidas no local. Prazo de entrega a combinar.'
    },

    clientes: [
      { id: uid(), nome: 'Cliente Exemplo', telefone: '(11) 90000-0000', endereco: '' }
    ],

    // Produtos avulsos (vidro/espelho/acessório/serviço) — por m² ou por unidade.
    produtos: [
      { id: uid(), nome: 'Vidro Temperado Incolor 8mm', modo: 'm2', preco: 280, categoria: 'Vidro' },
      { id: uid(), nome: 'Vidro Temperado Incolor 10mm', modo: 'm2', preco: 340, categoria: 'Vidro' },
      { id: uid(), nome: 'Vidro Comum Incolor 4mm', modo: 'm2', preco: 120, categoria: 'Vidro' },
      { id: uid(), nome: 'Espelho 4mm', modo: 'm2', preco: 190, categoria: 'Espelho' },
      { id: uid(), nome: 'Puxador Inox', modo: 'un', preco: 45, categoria: 'Acessório' },
      { id: uid(), nome: 'Mão de obra / Instalação', modo: 'un', preco: 150, categoria: 'Serviço' }
    ],

    // Esquadrias (tipologias): informa-se o VÃO e o sistema calcula preço + medida
    // do vidro já com a folga. Componentes fixos são somados por unidade.
    esquadrias: [
      {
        id: uid(), nome: 'Box de Correr Temperado 8mm', categoria: 'Box',
        precoM2: 360, cobrarPor: 'vao', folgaL: 1.5, folgaA: 2.0,
        componentes: [{ nome: 'Kit box (roldanas + perfis)', preco: 220, qtd: 1 }]
      },
      {
        id: uid(), nome: 'Janela de Correr 2 folhas', categoria: 'Janela',
        precoM2: 520, cobrarPor: 'vao', folgaL: 1.0, folgaA: 1.0,
        componentes: [{ nome: 'Fechadura + roldanas', preco: 90, qtd: 1 }]
      },
      {
        id: uid(), nome: 'Porta de Correr 2 folhas', categoria: 'Porta',
        precoM2: 620, cobrarPor: 'vao', folgaL: 1.0, folgaA: 1.5,
        componentes: [{ nome: 'Kit porta (trilho + roldanas + puxador)', preco: 260, qtd: 1 }]
      },
      {
        id: uid(), nome: 'Espelho sob medida (com lapidação)', categoria: 'Espelho',
        precoM2: 240, cobrarPor: 'vidro', folgaL: 0, folgaA: 0, componentes: []
      }
    ],

    orcamentos: []
  };

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) { localStorage.setItem(KEY, JSON.stringify(SEED)); return JSON.parse(JSON.stringify(SEED)); }
      var data = JSON.parse(raw);
      // preenche campos que possam faltar em versões antigas
      data.empresa = Object.assign({}, SEED.empresa, data.empresa || {});
      ['clientes', 'produtos', 'esquadrias', 'orcamentos'].forEach(function (k) {
        if (!Array.isArray(data[k])) data[k] = [];
      });
      return data;
    } catch (e) {
      console.error('Falha ao ler dados', e);
      return JSON.parse(JSON.stringify(SEED));
    }
  }
  function write(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function collection(name) {
    return {
      all: function () { return read()[name] || []; },
      get: function (id) { return (read()[name] || []).find(function (x) { return x.id === id; }); },
      add: function (obj) { var d = read(); obj.id = obj.id || uid(); d[name].push(obj); write(d); return obj; },
      update: function (id, patch) {
        var d = read(); var i = d[name].findIndex(function (x) { return x.id === id; });
        if (i > -1) { d[name][i] = Object.assign({}, d[name][i], patch, { id: id }); write(d); return d[name][i]; }
        return null;
      },
      remove: function (id) { var d = read(); d[name] = d[name].filter(function (x) { return x.id !== id; }); write(d); }
    };
  }

  global.DB = {
    uid: uid,
    clientes: collection('clientes'),
    produtos: collection('produtos'),
    esquadrias: collection('esquadrias'),
    orcamentos: collection('orcamentos'),
    empresa: {
      get: function () { return read().empresa; },
      save: function (patch) { var d = read(); d.empresa = Object.assign({}, d.empresa, patch); write(d); return d.empresa; }
    },
    resetDemo: function () { write(JSON.parse(JSON.stringify(SEED))); },
    exportJSON: function () { return JSON.stringify(read(), null, 2); },
    importJSON: function (json) { write(JSON.parse(json)); }
  };
})(window);
