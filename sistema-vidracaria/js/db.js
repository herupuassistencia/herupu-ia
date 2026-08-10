/* db.js — camada de persistência (localStorage). Tudo fica no aparelho do usuário.
   Modelo focado em orçamento rápido para VIDRAÇARIA + ESQUADRIAS. */
(function (global) {
  'use strict';

  var KEY = 'herupu_vidracaria_v2';

  function uid() {
    return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  var SEED = {
    // Dados do "cartão de visita" — o cliente edita em Ajustes.
    // Pré-preenchido com os dados reais da VIDRAP (Haroldo).
    empresa: {
      nome: 'VIDRAP Vidraçaria',
      slogan: 'Esquadrias em alumínio • Box • Guarda-corpo',
      responsavel: 'Haroldo',
      telefone: '(96) 99124-9381',
      whatsapp: '(96) 99124-9381',
      endereco: '',
      cnpj: '21.634.827/0001-27',
      cor: '#ca8a04', // dourado da marca (preto + dourado)
      logo: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%22240%22%3E%3Crect%20width%3D%22240%22%20height%3D%22240%22%20rx%3D%2246%22%20fill%3D%22%230f172a%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2253%25%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20font-family%3D%22Arial%20Black%2CArial%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2250%22%20letter-spacing%3D%221%22%20fill%3D%22%23eab308%22%3EVIDRAP%3C%2Ftext%3E%3C%2Fsvg%3E',
      validadeDias: 7,
      condicoes: 'Valores sujeitos a confirmação de medidas no local. Prazo de entrega a combinar.'
    },

    clientes: [
      { id: uid(), nome: 'Cliente Exemplo', telefone: '(96) 99999-0000', endereco: '' }
    ],

    // Produtos avulsos — por m² ou por unidade. Cada um tem VARIAÇÕES (tipo/cor)
    // com preço próprio + MÃO DE OBRA. Tudo editável em Ajustes. Preços de exemplo.
    produtos: [
      {
        id: uid(), nome: 'Vidro Temperado 8mm', modo: 'm2', categoria: 'Vidro', maoObraM2: 80,
        variacoes: [{ nome: 'Incolor', preco: 300 }, { nome: 'Fumê', preco: 340 }, { nome: 'Verde', preco: 340 }]
      },
      {
        id: uid(), nome: 'Vidro Temperado 10mm', modo: 'm2', categoria: 'Vidro', maoObraM2: 90,
        variacoes: [{ nome: 'Incolor', preco: 360 }, { nome: 'Fumê', preco: 410 }]
      },
      {
        id: uid(), nome: 'Espelho 4mm', modo: 'm2', categoria: 'Espelho', maoObraM2: 60,
        variacoes: [{ nome: 'Prata', preco: 200 }, { nome: 'Bronze', preco: 240 }]
      },
      {
        id: uid(), nome: 'Motor para portão', modo: 'un', categoria: 'Motorização', maoObraUn: 200,
        variacoes: [{ nome: 'Padrão', preco: 900 }, { nome: 'Reforçado', preco: 1200 }]
      },
      {
        id: uid(), nome: 'Puxador / Acessório', modo: 'un', categoria: 'Acessório', maoObraUn: 0,
        variacoes: [{ nome: 'Padrão', preco: 60 }]
      },
      {
        id: uid(), nome: 'Mão de obra / Instalação', modo: 'un', categoria: 'Serviço', maoObraUn: 0,
        variacoes: [{ nome: 'Padrão', preco: 200 }]
      }
    ],

    // Esquadrias (tipologias): informa-se o VÃO e o sistema calcula preço + medida
    // do vidro já com a folga. Cada uma tem VARIAÇÕES (tipo/cor) com preço/m²,
    // MÃO DE OBRA por m² e componentes fixos. Tudo editável. Preços de exemplo.
    esquadrias: [
      {
        id: uid(), nome: 'Box para banheiro Temperado 8mm', categoria: 'Box',
        cobrarPor: 'vao', folgaL: 1.5, folgaA: 2.0, maoObraM2: 90,
        variacoes: [{ nome: 'Incolor', preco: 380 }, { nome: 'Fumê', preco: 430 }, { nome: 'Verde', preco: 430 }],
        componentes: [{ nome: 'Kit box (roldanas + perfis)', preco: 240, qtd: 1 }]
      },
      {
        id: uid(), nome: 'Janela de Correr em Alumínio 2 folhas', categoria: 'Esquadria',
        cobrarPor: 'vao', folgaL: 1.0, folgaA: 1.0, maoObraM2: 100,
        variacoes: [{ nome: 'Branco', preco: 550 }, { nome: 'Preto', preco: 610 }, { nome: 'Bronze', preco: 610 }],
        componentes: [{ nome: 'Fechadura + roldanas', preco: 100, qtd: 1 }]
      },
      {
        id: uid(), nome: 'Porta de Correr em Alumínio 2 folhas', categoria: 'Esquadria',
        cobrarPor: 'vao', folgaL: 1.0, folgaA: 1.5, maoObraM2: 110,
        variacoes: [{ nome: 'Branco', preco: 650 }, { nome: 'Preto', preco: 720 }],
        componentes: [{ nome: 'Kit porta (trilho + roldanas + puxador)', preco: 280, qtd: 1 }]
      },
      {
        id: uid(), nome: 'Portão Búzio em Alumínio', categoria: 'Portão',
        cobrarPor: 'vao', folgaL: 1.0, folgaA: 1.0, maoObraM2: 120,
        variacoes: [{ nome: 'Branco', preco: 720 }, { nome: 'Preto', preco: 800 }],
        componentes: [{ nome: 'Kit fechadura + dobradiças', preco: 180, qtd: 1 }]
      },
      {
        id: uid(), nome: 'Guarda-corpo em Alumínio + Vidro', categoria: 'Guarda-corpo',
        cobrarPor: 'vao', folgaL: 0, folgaA: 0, maoObraM2: 100,
        variacoes: [{ nome: 'Incolor', preco: 600 }, { nome: 'Fumê', preco: 660 }],
        componentes: [{ nome: 'Fixadores / espelhos', preco: 120, qtd: 1 }]
      },
      {
        id: uid(), nome: 'Espelho sob medida (com lapidação)', categoria: 'Espelho',
        cobrarPor: 'vidro', folgaL: 0, folgaA: 0, maoObraM2: 0,
        variacoes: [{ nome: 'Prata', preco: 240 }, { nome: 'Bronze', preco: 290 }],
        componentes: []
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
