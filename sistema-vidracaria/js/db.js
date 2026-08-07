/* db.js — camada de persistência simples usando localStorage.
   Todos os dados ficam no navegador do usuário. */
(function (global) {
  'use strict';

  var KEY = 'herupu_vidracaria_v1';

  var SEED = {
    clientes: [
      { id: uid(), nome: 'Maria Oliveira', telefone: '(11) 98888-1234', email: 'maria@email.com', endereco: 'Rua das Flores, 120 - São Paulo/SP' },
      { id: uid(), nome: 'Construtora Alfa', telefone: '(11) 3344-5566', email: 'contato@alfa.com.br', endereco: 'Av. Industrial, 4500 - Guarulhos/SP' }
    ],
    // Catálogo de produtos: preço por m² (vidros) ou por unidade (acessórios)
    catalogo: [
      { id: uid(), nome: 'Vidro Temperado Incolor 8mm', unidade: 'm2', preco: 280, categoria: 'Vidro' },
      { id: uid(), nome: 'Vidro Temperado Incolor 10mm', unidade: 'm2', preco: 340, categoria: 'Vidro' },
      { id: uid(), nome: 'Vidro Temperado Fumê 8mm', unidade: 'm2', preco: 320, categoria: 'Vidro' },
      { id: uid(), nome: 'Vidro Comum Incolor 4mm', unidade: 'm2', preco: 120, categoria: 'Vidro' },
      { id: uid(), nome: 'Espelho 4mm', unidade: 'm2', preco: 190, categoria: 'Espelho' },
      { id: uid(), nome: 'Box de Banheiro Temperado 8mm', unidade: 'm2', preco: 360, categoria: 'Box' },
      { id: uid(), nome: 'Kit Box Padrão (roldanas + perfis)', unidade: 'un', preco: 220, categoria: 'Acessório' },
      { id: uid(), nome: 'Puxador Inox', unidade: 'un', preco: 45, categoria: 'Acessório' },
      { id: uid(), nome: 'Dobradiça para Vidro', unidade: 'un', preco: 38, categoria: 'Acessório' },
      { id: uid(), nome: 'Mão de Obra / Instalação', unidade: 'un', preco: 150, categoria: 'Serviço' }
    ],
    orcamentos: []
  };

  function uid() {
    return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        localStorage.setItem(KEY, JSON.stringify(SEED));
        return JSON.parse(JSON.stringify(SEED));
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Falha ao ler dados', e);
      return JSON.parse(JSON.stringify(SEED));
    }
  }

  function write(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function collection(name) {
    return {
      all: function () { return read()[name] || []; },
      get: function (id) { return (read()[name] || []).find(function (x) { return x.id === id; }); },
      add: function (obj) {
        var data = read();
        obj.id = obj.id || uid();
        data[name].push(obj);
        write(data);
        return obj;
      },
      update: function (id, patch) {
        var data = read();
        var idx = data[name].findIndex(function (x) { return x.id === id; });
        if (idx > -1) {
          data[name][idx] = Object.assign({}, data[name][idx], patch, { id: id });
          write(data);
          return data[name][idx];
        }
        return null;
      },
      remove: function (id) {
        var data = read();
        data[name] = data[name].filter(function (x) { return x.id !== id; });
        write(data);
      }
    };
  }

  global.DB = {
    uid: uid,
    clientes: collection('clientes'),
    catalogo: collection('catalogo'),
    orcamentos: collection('orcamentos'),
    resetDemo: function () { write(JSON.parse(JSON.stringify(SEED))); },
    exportJSON: function () { return JSON.stringify(read(), null, 2); }
  };
})(window);
