/* app.js — lógica da interface (roteamento, telas, orçamentos). */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var nav = document.getElementById('nav');

  /* ---------- utilitários ---------- */
  function brl(v) {
    return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function num(v) { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function fmtDate(iso) { if (!iso) return '-'; var d = new Date(iso); return d.toLocaleDateString('pt-BR'); }

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- modal ---------- */
  var modal = document.getElementById('modal');
  var modalTitle = document.getElementById('modal-title');
  var modalBody = document.getElementById('modal-body');
  document.getElementById('modal-close').onclick = closeModal;
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  function openModal(title, node) {
    modalTitle.textContent = title;
    modalBody.innerHTML = '';
    modalBody.appendChild(node);
    modal.hidden = false;
  }
  function closeModal() { modal.hidden = true; modalBody.innerHTML = ''; }

  /* ---------- roteamento ---------- */
  var views = {
    dashboard: renderDashboard,
    orcamentos: renderOrcamentos,
    clientes: renderClientes,
    catalogo: renderCatalogo
  };
  nav.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-view]');
    if (!b) return;
    go(b.dataset.view);
  });
  function go(view) {
    Array.prototype.forEach.call(nav.children, function (b) {
      b.classList.toggle('active', b.dataset.view === view);
    });
    (views[view] || renderDashboard)();
  }

  /* ---------- cálculo de orçamento ---------- */
  // item: { produtoId, descricao, unidade, preco, largura, altura, qtd }
  function areaItem(it) {
    if (it.unidade === 'm2') {
      // largura/altura em cm -> m². Mínimo de cobrança pode ser aplicado, aqui usamos real.
      return (num(it.largura) / 100) * (num(it.altura) / 100);
    }
    return 1;
  }
  function subtotalItem(it) {
    var base = it.unidade === 'm2' ? areaItem(it) : 1;
    return base * num(it.preco) * num(it.qtd || 1);
  }
  function totaisOrc(orc) {
    var itens = orc.itens || [];
    var bruto = itens.reduce(function (s, it) { return s + subtotalItem(it); }, 0);
    var desc = num(orc.desconto);
    var descValor = orc.descontoTipo === '%' ? bruto * desc / 100 : desc;
    var total = Math.max(0, bruto - descValor);
    return { bruto: bruto, descValor: descValor, total: total };
  }

  /* ================= DASHBOARD ================= */
  function renderDashboard() {
    var clientes = DB.clientes.all();
    var orcs = DB.orcamentos.all();
    var aprovados = orcs.filter(function (o) { return o.status === 'aprovado'; });
    var valorAprovado = aprovados.reduce(function (s, o) { return s + totaisOrc(o).total; }, 0);
    var valorAberto = orcs.filter(function (o) { return o.status === 'rascunho' || o.status === 'enviado'; })
      .reduce(function (s, o) { return s + totaisOrc(o).total; }, 0);

    app.innerHTML = '';
    app.appendChild(el(
      '<div class="view-head"><h1>Painel</h1>' +
      '<button class="btn" id="novo-orc">＋ Novo orçamento</button></div>'));

    var cards = el('<div class="cards"></div>');
    cards.appendChild(statCard('Clientes', clientes.length, 'accent'));
    cards.appendChild(statCard('Orçamentos', orcs.length, 'accent'));
    cards.appendChild(statCard('Aprovado (R$)', brl(valorAprovado), 'money'));
    cards.appendChild(statCard('Em aberto (R$)', brl(valorAberto), 'money'));
    app.appendChild(cards);

    var recentes = orcs.slice().sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); }).slice(0, 6);
    var panel = el('<div class="panel"><div class="panel-head">Orçamentos recentes</div></div>');
    if (!recentes.length) {
      panel.appendChild(el('<div class="empty">Nenhum orçamento ainda. Crie o primeiro! 🪟</div>'));
    } else {
      panel.appendChild(orcTable(recentes));
    }
    app.appendChild(panel);

    document.getElementById('novo-orc').onclick = function () { formOrcamento(); };
    bindOrcTable(panel);
  }

  function statCard(label, value, cls) {
    return el('<div class="stat ' + (cls || '') + '"><div class="label">' + esc(label) +
      '</div><div class="value">' + esc(value) + '</div></div>');
  }

  /* ================= ORÇAMENTOS ================= */
  function renderOrcamentos() {
    var orcs = DB.orcamentos.all().slice().sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); });
    app.innerHTML = '';
    app.appendChild(el(
      '<div class="view-head"><h1>Orçamentos</h1>' +
      '<button class="btn" id="novo-orc">＋ Novo orçamento</button></div>'));
    var panel = el('<div class="panel"></div>');
    if (!orcs.length) panel.appendChild(el('<div class="empty">Nenhum orçamento cadastrado.</div>'));
    else panel.appendChild(orcTable(orcs));
    app.appendChild(panel);
    document.getElementById('novo-orc').onclick = function () { formOrcamento(); };
    bindOrcTable(panel);
  }

  function orcTable(orcs) {
    var rows = orcs.map(function (o) {
      var cli = DB.clientes.get(o.clienteId);
      var t = totaisOrc(o);
      return '<tr data-id="' + o.id + '">' +
        '<td><strong>#' + esc(o.numero) + '</strong></td>' +
        '<td>' + esc(cli ? cli.nome : '—') + '</td>' +
        '<td>' + fmtDate(o.data) + '</td>' +
        '<td><span class="badge ' + o.status + '">' + statusLabel(o.status) + '</span></td>' +
        '<td class="num">' + brl(t.total) + '</td>' +
        '<td class="right no-print">' +
          '<button class="icon-btn" data-act="ver" title="Ver / imprimir">👁️</button>' +
          '<button class="icon-btn" data-act="edit" title="Editar">✏️</button>' +
          '<button class="icon-btn" data-act="del" title="Excluir">🗑️</button>' +
        '</td></tr>';
    }).join('');
    return el('<table><thead><tr><th>Nº</th><th>Cliente</th><th>Data</th><th>Status</th>' +
      '<th class="num">Total</th><th class="right no-print"></th></tr></thead><tbody>' + rows + '</tbody></table>');
  }
  function statusLabel(s) {
    return { rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado', recusado: 'Recusado' }[s] || s;
  }
  function bindOrcTable(container) {
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var id = btn.closest('tr').dataset.id;
      var act = btn.dataset.act;
      if (act === 'ver') verOrcamento(id);
      if (act === 'edit') formOrcamento(DB.orcamentos.get(id));
      if (act === 'del') {
        if (confirm('Excluir este orçamento?')) { DB.orcamentos.remove(id); go('orcamentos'); toast('Orçamento excluído'); }
      }
    });
  }

  /* ---------- formulário de orçamento ---------- */
  function proximoNumero() {
    var orcs = DB.orcamentos.all();
    var max = orcs.reduce(function (m, o) { return Math.max(m, parseInt(o.numero, 10) || 0); }, 0);
    return String(max + 1).padStart(4, '0');
  }

  function formOrcamento(orc) {
    var editing = !!orc;
    orc = orc ? JSON.parse(JSON.stringify(orc)) : {
      numero: proximoNumero(),
      data: new Date().toISOString(),
      clienteId: '',
      status: 'rascunho',
      desconto: 0,
      descontoTipo: 'R$',
      observacoes: '',
      itens: []
    };

    var clientes = DB.clientes.all();
    var catalogo = DB.catalogo.all();

    var clienteOpts = '<option value="">— selecione —</option>' + clientes.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === orc.clienteId ? ' selected' : '') + '>' + esc(c.nome) + '</option>';
    }).join('');
    var catOpts = catalogo.map(function (p) {
      return '<option value="' + p.id + '">' + esc(p.nome) + ' — ' + brl(p.preco) + '/' + p.unidade + '</option>';
    }).join('');

    var node = el('<div></div>');
    node.innerHTML =
      '<div class="grid-2">' +
        '<div class="field"><label>Cliente</label><select id="f-cliente">' + clienteOpts + '</select></div>' +
        '<div class="field"><label>Status</label><select id="f-status">' +
          ['rascunho', 'enviado', 'aprovado', 'recusado'].map(function (s) {
            return '<option value="' + s + '"' + (s === orc.status ? ' selected' : '') + '>' + statusLabel(s) + '</option>';
          }).join('') + '</select></div>' +
      '</div>' +
      '<div class="panel" style="margin:6px 0 16px"><div class="panel-head">Itens</div>' +
        '<div style="padding:14px">' +
          '<div class="item-row-add">' +
            '<div class="field" style="margin:0"><label>Produto / vidro</label><select id="i-prod">' + catOpts + '</select></div>' +
            '<div class="field" style="margin:0"><label>Larg. (cm)</label><input id="i-larg" type="number" min="0" step="1" placeholder="ex: 120"></div>' +
            '<div class="field" style="margin:0"><label>Alt. (cm)</label><input id="i-alt" type="number" min="0" step="1" placeholder="ex: 90"></div>' +
            '<div class="field" style="margin:0"><label>Qtd</label><input id="i-qtd" type="number" min="1" step="1" value="1"></div>' +
            '<button class="btn" id="i-add" type="button">Adicionar</button>' +
          '</div>' +
          '<table class="itens-table"><thead><tr><th>Descrição</th><th class="num">Med.</th>' +
            '<th class="num">Área/Un</th><th class="num">Qtd</th><th class="num">Preço</th>' +
            '<th class="num">Subtotal</th><th></th></tr></thead><tbody id="itens-body"></tbody></table>' +
        '</div>' +
      '</div>' +
      '<div class="grid-3">' +
        '<div class="field"><label>Desconto</label><input id="f-desc" type="number" min="0" step="0.01" value="' + orc.desconto + '"></div>' +
        '<div class="field"><label>Tipo</label><select id="f-desctipo">' +
          '<option value="R$"' + (orc.descontoTipo === 'R$' ? ' selected' : '') + '>R$</option>' +
          '<option value="%"' + (orc.descontoTipo === '%' ? ' selected' : '') + '>%</option></select></div>' +
        '<div class="field"><label>Data</label><input id="f-data" type="date" value="' + orc.data.slice(0, 10) + '"></div>' +
      '</div>' +
      '<div class="field"><label>Observações</label><textarea id="f-obs" rows="2" placeholder="Prazo de entrega, condições de pagamento...">' + esc(orc.observacoes) + '</textarea></div>' +
      '<div class="totais" id="tot"></div>' +
      '<div class="form-actions">' +
        '<button class="btn ghost" id="f-cancel" type="button">Cancelar</button>' +
        '<button class="btn success" id="f-save" type="button">' + (editing ? 'Salvar alterações' : 'Salvar orçamento') + '</button>' +
      '</div>';

    var itensBody = node.querySelector('#itens-body');
    var totBox = node.querySelector('#tot');

    function refresh() {
      itensBody.innerHTML = orc.itens.map(function (it, idx) {
        var med = it.unidade === 'm2' ? (num(it.largura) + '×' + num(it.altura) + 'cm') : '—';
        var au = it.unidade === 'm2' ? areaItem(it).toFixed(3) + ' m²' : '1 un';
        return '<tr><td>' + esc(it.descricao) + '</td><td class="num">' + med + '</td>' +
          '<td class="num">' + au + '</td><td class="num">' + num(it.qtd || 1) + '</td>' +
          '<td class="num">' + brl(it.preco) + '</td><td class="num">' + brl(subtotalItem(it)) + '</td>' +
          '<td class="num"><button class="icon-btn link-danger" data-rm="' + idx + '">✕</button></td></tr>';
      }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center;padding:16px">Nenhum item adicionado.</td></tr>';

      orc.desconto = num(node.querySelector('#f-desc').value);
      orc.descontoTipo = node.querySelector('#f-desctipo').value;
      var t = totaisOrc(orc);
      totBox.innerHTML =
        '<div class="row"><span>Subtotal</span><span>' + brl(t.bruto) + '</span></div>' +
        '<div class="row"><span>Desconto</span><span>- ' + brl(t.descValor) + '</span></div>' +
        '<div class="row grand"><span>Total</span><span>' + brl(t.total) + '</span></div>';
    }

    node.querySelector('#i-add').onclick = function () {
      var prod = DB.catalogo.get(node.querySelector('#i-prod').value);
      if (!prod) return;
      var it = {
        produtoId: prod.id, descricao: prod.nome, unidade: prod.unidade, preco: prod.preco,
        largura: num(node.querySelector('#i-larg').value),
        altura: num(node.querySelector('#i-alt').value),
        qtd: num(node.querySelector('#i-qtd').value) || 1
      };
      if (it.unidade === 'm2' && (!it.largura || !it.altura)) { toast('Informe largura e altura'); return; }
      orc.itens.push(it);
      node.querySelector('#i-larg').value = '';
      node.querySelector('#i-alt').value = '';
      node.querySelector('#i-qtd').value = '1';
      refresh();
    };
    itensBody.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]');
      if (!b) return;
      orc.itens.splice(parseInt(b.dataset.rm, 10), 1);
      refresh();
    });
    node.querySelector('#f-desc').addEventListener('input', refresh);
    node.querySelector('#f-desctipo').addEventListener('change', refresh);

    node.querySelector('#f-cancel').onclick = closeModal;
    node.querySelector('#f-save').onclick = function () {
      orc.clienteId = node.querySelector('#f-cliente').value;
      orc.status = node.querySelector('#f-status').value;
      orc.observacoes = node.querySelector('#f-obs').value;
      orc.desconto = num(node.querySelector('#f-desc').value);
      orc.descontoTipo = node.querySelector('#f-desctipo').value;
      var d = node.querySelector('#f-data').value;
      orc.data = d ? new Date(d + 'T12:00:00').toISOString() : orc.data;
      if (!orc.clienteId) { toast('Selecione um cliente'); return; }
      if (!orc.itens.length) { toast('Adicione ao menos um item'); return; }
      if (editing) DB.orcamentos.update(orc.id, orc);
      else DB.orcamentos.add(orc);
      closeModal();
      toast('Orçamento salvo ✔');
      go('orcamentos');
    };

    refresh();
    openModal(editing ? 'Editar orçamento #' + orc.numero : 'Novo orçamento #' + orc.numero, node);
  }

  /* ---------- visualização / impressão / WhatsApp ---------- */
  function verOrcamento(id) {
    var orc = DB.orcamentos.get(id);
    var cli = DB.clientes.get(orc.clienteId) || {};
    var t = totaisOrc(orc);

    var linhas = orc.itens.map(function (it) {
      var med = it.unidade === 'm2' ? (num(it.largura) + '×' + num(it.altura) + 'cm · ' + areaItem(it).toFixed(3) + 'm²') : '1 un';
      return '<tr><td>' + esc(it.descricao) + '</td><td>' + med + '</td>' +
        '<td class="num">' + num(it.qtd || 1) + '</td><td class="num">' + brl(it.preco) + '</td>' +
        '<td class="num">' + brl(subtotalItem(it)) + '</td></tr>';
    }).join('');

    var node = el('<div></div>');
    node.innerHTML =
      '<div style="border-bottom:2px solid var(--border);padding-bottom:12px;margin-bottom:14px">' +
        '<div style="display:flex;justify-content:space-between;flex-wrap:wrap">' +
          '<div><strong style="font-size:18px">Vidraçaria HERUPU</strong><br><span class="muted">Orçamento nº ' + esc(orc.numero) + '</span></div>' +
          '<div class="right"><span class="badge ' + orc.status + '">' + statusLabel(orc.status) + '</span><br>' +
            '<span class="muted">' + fmtDate(orc.data) + '</span></div>' +
        '</div></div>' +
      '<div class="mt"><strong>Cliente:</strong> ' + esc(cli.nome || '—') +
        (cli.telefone ? ' · ' + esc(cli.telefone) : '') +
        (cli.endereco ? '<br><span class="muted">' + esc(cli.endereco) + '</span>' : '') + '</div>' +
      '<table class="mt"><thead><tr><th>Item</th><th>Medida</th><th class="num">Qtd</th>' +
        '<th class="num">Unit.</th><th class="num">Subtotal</th></tr></thead><tbody>' + linhas + '</tbody></table>' +
      '<div class="totais">' +
        '<div class="row"><span>Subtotal</span><span>' + brl(t.bruto) + '</span></div>' +
        '<div class="row"><span>Desconto</span><span>- ' + brl(t.descValor) + '</span></div>' +
        '<div class="row grand"><span>Total</span><span>' + brl(t.total) + '</span></div>' +
      '</div>' +
      (orc.observacoes ? '<p class="muted mt"><strong>Obs.:</strong> ' + esc(orc.observacoes) + '</p>' : '') +
      '<div class="form-actions no-print">' +
        '<button class="btn ghost" id="v-print" type="button">🖨️ Imprimir / PDF</button>' +
        '<button class="btn success" id="v-wa" type="button">💬 Enviar no WhatsApp</button>' +
      '</div>';

    node.querySelector('#v-print').onclick = function () { window.print(); };
    node.querySelector('#v-wa').onclick = function () { enviarWhats(orc, cli, t); };
    openModal('Orçamento #' + orc.numero, node);
  }

  function enviarWhats(orc, cli, t) {
    var linhas = orc.itens.map(function (it) {
      var med = it.unidade === 'm2' ? ' (' + num(it.largura) + 'x' + num(it.altura) + 'cm)' : '';
      return '• ' + it.descricao + med + ' x' + num(it.qtd || 1) + ' = ' + brl(subtotalItem(it));
    }).join('\n');
    var msg =
      '*Vidraçaria HERUPU — Orçamento nº ' + orc.numero + '*\n' +
      'Cliente: ' + (cli.nome || '') + '\n' +
      'Data: ' + fmtDate(orc.data) + '\n\n' +
      linhas + '\n\n' +
      'Subtotal: ' + brl(t.bruto) + '\n' +
      (t.descValor ? 'Desconto: -' + brl(t.descValor) + '\n' : '') +
      '*Total: ' + brl(t.total) + '*' +
      (orc.observacoes ? '\n\nObs.: ' + orc.observacoes : '');
    var fone = (cli.telefone || '').replace(/\D/g, '');
    var base = fone ? 'https://wa.me/55' + fone : 'https://wa.me/';
    window.open(base + '?text=' + encodeURIComponent(msg), '_blank');
  }

  /* ================= CLIENTES ================= */
  function renderClientes() {
    app.innerHTML = '';
    app.appendChild(el(
      '<div class="view-head"><h1>Clientes</h1>' +
      '<div style="display:flex;gap:8px"><input class="search" id="busca" placeholder="Buscar cliente...">' +
      '<button class="btn" id="novo">＋ Novo cliente</button></div></div>'));
    var panel = el('<div class="panel"></div>');
    app.appendChild(panel);

    function draw(filter) {
      var list = DB.clientes.all().filter(function (c) {
        return !filter || (c.nome + c.telefone + c.email).toLowerCase().indexOf(filter.toLowerCase()) > -1;
      });
      if (!list.length) { panel.innerHTML = '<div class="empty">Nenhum cliente encontrado.</div>'; return; }
      var rows = list.map(function (c) {
        return '<tr data-id="' + c.id + '"><td><strong>' + esc(c.nome) + '</strong></td>' +
          '<td>' + esc(c.telefone || '-') + '</td><td>' + esc(c.email || '-') + '</td>' +
          '<td class="muted">' + esc(c.endereco || '-') + '</td>' +
          '<td class="right"><button class="icon-btn" data-act="edit">✏️</button>' +
          '<button class="icon-btn" data-act="del">🗑️</button></td></tr>';
      }).join('');
      panel.innerHTML = '<table><thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th>' +
        '<th>Endereço</th><th class="right"></th></tr></thead><tbody>' + rows + '</tbody></table>';
    }
    draw('');

    document.getElementById('busca').addEventListener('input', function (e) { draw(e.target.value); });
    document.getElementById('novo').onclick = function () { formCliente(null, draw); };
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]'); if (!b) return;
      var id = b.closest('tr').dataset.id;
      if (b.dataset.act === 'edit') formCliente(DB.clientes.get(id), draw);
      if (b.dataset.act === 'del') {
        if (confirm('Excluir este cliente?')) { DB.clientes.remove(id); draw(document.getElementById('busca').value); toast('Cliente excluído'); }
      }
    });
  }

  function formCliente(cli, redraw) {
    var editing = !!cli;
    cli = cli || { nome: '', telefone: '', email: '', endereco: '' };
    var node = el('<div></div>');
    node.innerHTML =
      '<div class="field"><label>Nome *</label><input id="c-nome" value="' + esc(cli.nome) + '"></div>' +
      '<div class="grid-2">' +
        '<div class="field"><label>Telefone</label><input id="c-fone" value="' + esc(cli.telefone) + '" placeholder="(11) 90000-0000"></div>' +
        '<div class="field"><label>E-mail</label><input id="c-email" type="email" value="' + esc(cli.email) + '"></div>' +
      '</div>' +
      '<div class="field"><label>Endereço</label><input id="c-end" value="' + esc(cli.endereco) + '"></div>' +
      '<div class="form-actions"><button class="btn ghost" id="c-cancel" type="button">Cancelar</button>' +
      '<button class="btn success" id="c-save" type="button">Salvar</button></div>';
    node.querySelector('#c-cancel').onclick = closeModal;
    node.querySelector('#c-save').onclick = function () {
      var obj = {
        nome: node.querySelector('#c-nome').value.trim(),
        telefone: node.querySelector('#c-fone').value.trim(),
        email: node.querySelector('#c-email').value.trim(),
        endereco: node.querySelector('#c-end').value.trim()
      };
      if (!obj.nome) { toast('Informe o nome'); return; }
      if (editing) DB.clientes.update(cli.id, obj); else DB.clientes.add(obj);
      closeModal(); toast('Cliente salvo ✔'); redraw('');
    };
    openModal(editing ? 'Editar cliente' : 'Novo cliente', node);
  }

  /* ================= CATÁLOGO ================= */
  function renderCatalogo() {
    app.innerHTML = '';
    app.appendChild(el(
      '<div class="view-head"><h1>Catálogo</h1>' +
      '<button class="btn" id="novo">＋ Novo produto</button></div>'));
    var panel = el('<div class="panel"></div>');
    app.appendChild(panel);

    function draw() {
      var list = DB.catalogo.all();
      var rows = list.map(function (p) {
        return '<tr data-id="' + p.id + '"><td><strong>' + esc(p.nome) + '</strong></td>' +
          '<td>' + esc(p.categoria || '-') + '</td>' +
          '<td>' + (p.unidade === 'm2' ? 'por m²' : 'por unidade') + '</td>' +
          '<td class="num">' + brl(p.preco) + '</td>' +
          '<td class="right"><button class="icon-btn" data-act="edit">✏️</button>' +
          '<button class="icon-btn" data-act="del">🗑️</button></td></tr>';
      }).join('');
      panel.innerHTML = '<table><thead><tr><th>Produto</th><th>Categoria</th><th>Cobrança</th>' +
        '<th class="num">Preço</th><th class="right"></th></tr></thead><tbody>' + rows + '</tbody></table>';
    }
    draw();

    document.getElementById('novo').onclick = function () { formProduto(null, draw); };
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]'); if (!b) return;
      var id = b.closest('tr').dataset.id;
      if (b.dataset.act === 'edit') formProduto(DB.catalogo.get(id), draw);
      if (b.dataset.act === 'del') {
        if (confirm('Excluir este produto?')) { DB.catalogo.remove(id); draw(); toast('Produto excluído'); }
      }
    });
  }

  function formProduto(p, redraw) {
    var editing = !!p;
    p = p || { nome: '', categoria: 'Vidro', unidade: 'm2', preco: 0 };
    var cats = ['Vidro', 'Espelho', 'Box', 'Acessório', 'Serviço'];
    var node = el('<div></div>');
    node.innerHTML =
      '<div class="field"><label>Nome *</label><input id="p-nome" value="' + esc(p.nome) + '"></div>' +
      '<div class="grid-3">' +
        '<div class="field"><label>Categoria</label><select id="p-cat">' +
          cats.map(function (c) { return '<option' + (c === p.categoria ? ' selected' : '') + '>' + c + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="field"><label>Cobrança</label><select id="p-un">' +
          '<option value="m2"' + (p.unidade === 'm2' ? ' selected' : '') + '>por m²</option>' +
          '<option value="un"' + (p.unidade === 'un' ? ' selected' : '') + '>por unidade</option></select></div>' +
        '<div class="field"><label>Preço (R$)</label><input id="p-preco" type="number" min="0" step="0.01" value="' + p.preco + '"></div>' +
      '</div>' +
      '<div class="form-actions"><button class="btn ghost" id="p-cancel" type="button">Cancelar</button>' +
      '<button class="btn success" id="p-save" type="button">Salvar</button></div>';
    node.querySelector('#p-cancel').onclick = closeModal;
    node.querySelector('#p-save').onclick = function () {
      var obj = {
        nome: node.querySelector('#p-nome').value.trim(),
        categoria: node.querySelector('#p-cat').value,
        unidade: node.querySelector('#p-un').value,
        preco: num(node.querySelector('#p-preco').value)
      };
      if (!obj.nome) { toast('Informe o nome'); return; }
      if (editing) DB.catalogo.update(p.id, obj); else DB.catalogo.add(obj);
      closeModal(); toast('Produto salvo ✔'); redraw();
    };
    openModal(editing ? 'Editar produto' : 'Novo produto', node);
  }

  /* ---------- inicialização ---------- */
  go('dashboard');
})();
