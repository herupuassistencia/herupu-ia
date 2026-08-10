/* app.js — app mobile-first de orçamentos para vidraçaria + esquadrias. */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var nav = document.getElementById('nav');

  /* ---------- utilitários ---------- */
  function brl(v) { return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isNaN(n) ? 0 : n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function fmtDate(iso) { if (!iso) return '-'; return new Date(iso).toLocaleDateString('pt-BR'); }
  function statusLabel(s) { return { rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado', recusado: 'Recusado' }[s] || s; }
  function toast(msg) {
    var t = document.getElementById('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- marca (cor/logo do cartão de visita) ---------- */
  function applyBranding() {
    var emp = DB.empresa.get();
    document.documentElement.style.setProperty('--brand', emp.cor || '#0ea5e9');
    var meta = document.getElementById('theme-color-meta'); if (meta) meta.content = emp.cor || '#0ea5e9';
    document.getElementById('appbar-nome').textContent = emp.nome || 'Sua Vidraçaria';
    document.getElementById('appbar-slogan').textContent = emp.slogan || '';
    var logo = document.getElementById('appbar-logo');
    if (emp.logo && emp.logo.indexOf('data:') === 0) logo.innerHTML = '<img alt="logo" src="' + emp.logo + '">';
    else logo.textContent = emp.logo || '🪟';
  }

  /* ---------- modal ---------- */
  var modal = document.getElementById('modal'), modalTitle = document.getElementById('modal-title'), modalBody = document.getElementById('modal-body');
  document.getElementById('modal-close').onclick = closeModal;
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  function openModal(title, node) { modalTitle.textContent = title; modalBody.innerHTML = ''; modalBody.appendChild(node); modal.hidden = false; }
  function closeModal() { modal.hidden = true; modalBody.innerHTML = ''; }

  /* ---------- roteamento ---------- */
  var views = { inicio: renderInicio, orcar: function () { formOrcamento(); }, clientes: renderClientes, config: renderConfig };
  nav.addEventListener('click', function (e) { var b = e.target.closest('button[data-view]'); if (b) go(b.dataset.view); });
  function go(view) {
    Array.prototype.forEach.call(nav.children, function (b) { b.classList.toggle('active', b.dataset.view === view); });
    window.scrollTo(0, 0);
    (views[view] || renderInicio)();
  }

  /* ================= CÁLCULO ================= */
  // Item do orçamento:
  //  esquadria: { tipo:'esquadria', refId, nome, precoM2, cobrarPor, folgaL, folgaA, larg, alt, qtd, componentes:[{nome,preco,qtd}] }
  //  avulso:    { tipo:'avulso', refId, nome, modo:'m2'|'un', preco, larg, alt, qtd }
  function areaVao(it) { return (num(it.larg) / 100) * (num(it.alt) / 100); }           // m² do vão
  function medidaVidro(it) {                                                            // corte do vidro (com folga)
    return { l: Math.max(0, num(it.larg) - num(it.folgaL || 0)), a: Math.max(0, num(it.alt) - num(it.folgaA || 0)) };
  }
  function areaVidro(it) { var m = medidaVidro(it); return (m.l / 100) * (m.a / 100); }
  function subtotalItem(it) {
    var q = num(it.qtd || 1);
    if (it.tipo === 'avulso') return (it.modo === 'm2' ? areaVao(it) : 1) * num(it.preco) * q;
    // esquadria
    var base = (it.cobrarPor === 'vidro' ? areaVidro(it) : areaVao(it)) * num(it.precoM2);
    var comp = (it.componentes || []).reduce(function (s, c) { return s + num(c.preco) * num(c.qtd || 1); }, 0);
    return (base + comp) * q;
  }
  function totais(orc) {
    var bruto = (orc.itens || []).reduce(function (s, it) { return s + subtotalItem(it); }, 0);
    var d = num(orc.desconto);
    var descV = orc.descontoTipo === '%' ? bruto * d / 100 : d;
    return { bruto: bruto, desc: descV, total: Math.max(0, bruto - descV) };
  }

  /* ================= INÍCIO ================= */
  function renderInicio() {
    var orcs = DB.orcamentos.all(), clientes = DB.clientes.all();
    var aprov = orcs.filter(function (o) { return o.status === 'aprovado'; }).reduce(function (s, o) { return s + totais(o).total; }, 0);
    var aberto = orcs.filter(function (o) { return o.status === 'rascunho' || o.status === 'enviado'; }).reduce(function (s, o) { return s + totais(o).total; }, 0);

    app.innerHTML = '';
    app.appendChild(el('<h1 class="view-title">Início</h1>'));

    var stats = el('<div class="stats"></div>');
    stats.appendChild(stat('Orçamentos', orcs.length));
    stats.appendChild(stat('Clientes', clientes.length));
    stats.appendChild(stat('Aprovado', brl(aprov), 'money'));
    stats.appendChild(stat('Em aberto', brl(aberto), 'money'));
    app.appendChild(stats);

    var cta = el('<button class="btn mt">➕ Novo orçamento</button>');
    cta.onclick = function () { formOrcamento(); };
    app.appendChild(cta);

    app.appendChild(el('<div class="section-label">Orçamentos recentes</div>'));
    var recent = orcs.slice().sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); }).slice(0, 12);
    if (!recent.length) {
      app.appendChild(el('<div class="empty"><span class="big">🧾</span>Nenhum orçamento ainda.<br>Toque em <b>Orçar</b> para começar.</div>'));
    } else {
      var list = el('<div class="list"></div>');
      recent.forEach(function (o) { list.appendChild(orcCard(o)); });
      app.appendChild(list);
    }
  }
  function stat(label, value, cls) {
    return el('<div class="stat ' + (cls || '') + '"><div class="label">' + esc(label) + '</div><div class="value">' + esc(value) + '</div></div>');
  }
  function orcCard(o) {
    var cli = DB.clientes.get(o.clienteId), t = totais(o);
    var c = el('<div class="card row-item">' +
      '<div class="grow"><strong class="truncate">#' + esc(o.numero) + ' · ' + esc(cli ? cli.nome : 'Sem cliente') + '</strong>' +
      '<small>' + fmtDate(o.data) + ' · <span class="badge ' + o.status + '">' + statusLabel(o.status) + '</span></small></div>' +
      '<div class="amount">' + brl(t.total) + '</div></div>');
    c.onclick = function () { verOrcamento(o.id); };
    return c;
  }

  /* ================= ORÇAMENTO (star) ================= */
  function proximoNumero() {
    var max = DB.orcamentos.all().reduce(function (m, o) { return Math.max(m, parseInt(o.numero, 10) || 0); }, 0);
    return String(max + 1).padStart(4, '0');
  }

  function formOrcamento(orc) {
    var editing = !!orc;
    orc = orc ? JSON.parse(JSON.stringify(orc)) : {
      numero: proximoNumero(), data: new Date().toISOString(), clienteId: '',
      status: 'rascunho', desconto: 0, descontoTipo: 'R$', obs: '', itens: []
    };

    app.innerHTML = '';
    app.appendChild(el('<h1 class="view-title">' + (editing ? 'Editar orçamento' : 'Novo orçamento') + ' #' + esc(orc.numero) + '</h1>'));

    // Cliente
    var clientes = DB.clientes.all();
    var cliWrap = el('<div class="field"><label>Cliente</label></div>');
    var cliSel = el('<select><option value="">— selecione —</option>' +
      clientes.map(function (c) { return '<option value="' + c.id + '"' + (c.id === orc.clienteId ? ' selected' : '') + '>' + esc(c.nome) + '</option>'; }).join('') +
      '</select>');
    cliSel.onchange = function () { orc.clienteId = cliSel.value; };
    var cliAdd = el('<button class="btn ghost sm mt">＋ Novo cliente rápido</button>');
    cliAdd.onclick = function () {
      formCliente(null, function (novo) { orc.clienteId = novo.id; formRefreshCliente(cliSel, novo); });
    };
    cliWrap.appendChild(cliSel); cliWrap.appendChild(cliAdd);
    app.appendChild(cliWrap);

    // Itens
    app.appendChild(el('<div class="section-label">Itens do orçamento</div>'));
    var itensBox = el('<div class="list"></div>');
    app.appendChild(itensBox);
    var addBtn = el('<button class="btn ghost mt">＋ Adicionar item</button>');
    addBtn.onclick = function () { pickItem(orc, redraw); };
    app.appendChild(addBtn);

    // Extras (desconto / obs / status)
    var extra = el('<div class="mt"></div>');
    extra.innerHTML =
      '<div class="section-label">Ajustes</div>' +
      '<div class="grid-2">' +
        '<div class="field"><label>Desconto</label><input id="o-desc" inputmode="decimal" value="' + orc.desconto + '"></div>' +
        '<div class="field"><label>Tipo</label><select id="o-desctipo">' +
          '<option value="R$"' + (orc.descontoTipo === 'R$' ? ' selected' : '') + '>R$</option>' +
          '<option value="%"' + (orc.descontoTipo === '%' ? ' selected' : '') + '>%</option></select></div>' +
      '</div>' +
      '<div class="field"><label>Status</label><select id="o-status">' +
        ['rascunho', 'enviado', 'aprovado', 'recusado'].map(function (s) { return '<option value="' + s + '"' + (s === orc.status ? ' selected' : '') + '>' + statusLabel(s) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label>Observações</label><textarea id="o-obs" rows="2" placeholder="Prazo, forma de pagamento...">' + esc(orc.obs) + '</textarea></div>';
    app.appendChild(extra);

    // Total fixo + ações
    var totalBar = el('<div class="sticky-total"></div>');
    app.appendChild(totalBar);

    function pull() {
      orc.desconto = num(document.getElementById('o-desc').value);
      orc.descontoTipo = document.getElementById('o-desctipo').value;
      orc.status = document.getElementById('o-status').value;
      orc.obs = document.getElementById('o-obs').value;
    }
    function redraw() {
      itensBox.innerHTML = '';
      if (!orc.itens.length) itensBox.appendChild(el('<div class="muted" style="padding:6px">Nenhum item. Toque em “Adicionar item”.</div>'));
      orc.itens.forEach(function (it, idx) {
        var det = it.tipo === 'esquadria'
          ? (num(it.larg) + '×' + num(it.alt) + 'cm · vão ' + areaVao(it).toFixed(2) + 'm²' + (it.cobrarPor === 'vidro' ? ' · vidro ' + areaVidro(it).toFixed(2) + 'm²' : ''))
          : (it.modo === 'm2' ? (num(it.larg) + '×' + num(it.alt) + 'cm · ' + areaVao(it).toFixed(2) + 'm²') : 'unidade');
        var row = el('<div class="builder-item"><div class="grow"><strong class="truncate">' + esc(it.nome) + '</strong>' +
          '<small>' + det + ' · x' + num(it.qtd || 1) + '</small></div>' +
          '<div class="amount">' + brl(subtotalItem(it)) + '</div>' +
          '<button class="icon-btn" aria-label="Remover">🗑️</button></div>');
        row.querySelector('.grow').onclick = function () { pickItem(orc, redraw, idx); };
        row.querySelector('.icon-btn').onclick = function () { orc.itens.splice(idx, 1); redraw(); };
        itensBox.appendChild(row);
      });
      var t = totais(orc);
      totalBar.innerHTML = '<div class="tt"><span>Total' + (t.desc ? ' (–' + brl(t.desc) + ')' : '') + '</span><span class="v">' + brl(t.total) + '</span></div>';
      var actions = el('<div class="btn-row"></div>');
      var save = el('<button class="btn success">💾 Salvar</button>');
      save.onclick = function () {
        pull();
        if (!orc.clienteId) { toast('Selecione um cliente'); return; }
        if (!orc.itens.length) { toast('Adicione ao menos um item'); return; }
        if (editing) DB.orcamentos.update(orc.id, orc); else { DB.orcamentos.add(orc); editing = true; }
        toast('Orçamento salvo ✔'); verOrcamento(orc.id);
      };
      var cancel = el('<button class="btn subtle">Voltar</button>');
      cancel.onclick = function () { go('inicio'); };
      actions.appendChild(cancel); actions.appendChild(save);
      totalBar.appendChild(actions);
    }
    ['o-desc', 'o-desctipo'].forEach(function (id) {
      extra.querySelector('#' + id).addEventListener('input', function () { pull(); redraw(); });
    });
    redraw();
  }
  function formRefreshCliente(sel, cli) {
    sel.appendChild(el('<option value="' + cli.id + '">' + esc(cli.nome) + '</option>'));
    sel.value = cli.id;
  }

  /* ---------- seletor + editor de item ---------- */
  function pickItem(orc, redraw, editIdx) {
    var editing = editIdx != null;
    if (editing) { itemEditor(orc, redraw, orc.itens[editIdx], editIdx); return; }

    var esqs = DB.esquadrias.all(), prods = DB.produtos.all();
    var node = el('<div></div>');
    node.appendChild(el('<div class="section-label" style="margin-top:0">Esquadrias (medida do vão)</div>'));
    var l1 = el('<div class="list"></div>');
    esqs.forEach(function (e) {
      var c = el('<div class="card row-item"><div class="grow"><strong>' + esc(e.nome) + '</strong><small>' + esc(e.categoria) + ' · ' + brl(e.precoM2) + '/m² (' + (e.cobrarPor === 'vidro' ? 'vidro' : 'vão') + ')</small></div><span>›</span></div>');
      c.onclick = function () {
        closeModal();
        itemEditor(orc, redraw, {
          tipo: 'esquadria', refId: e.id, nome: e.nome, precoM2: e.precoM2, cobrarPor: e.cobrarPor,
          folgaL: e.folgaL, folgaA: e.folgaA, larg: '', alt: '', qtd: 1,
          componentes: JSON.parse(JSON.stringify(e.componentes || []))
        });
      };
      l1.appendChild(c);
    });
    node.appendChild(l1);

    node.appendChild(el('<div class="section-label">Produtos avulsos</div>'));
    var l2 = el('<div class="list"></div>');
    prods.forEach(function (p) {
      var c = el('<div class="card row-item"><div class="grow"><strong>' + esc(p.nome) + '</strong><small>' + esc(p.categoria) + ' · ' + brl(p.preco) + (p.modo === 'm2' ? '/m²' : '/un') + '</small></div><span>›</span></div>');
      c.onclick = function () {
        closeModal();
        itemEditor(orc, redraw, { tipo: 'avulso', refId: p.id, nome: p.nome, modo: p.modo, preco: p.preco, larg: '', alt: '', qtd: 1 });
      };
      l2.appendChild(c);
    });
    node.appendChild(l2);
    openModal('Adicionar item', node);
  }

  function itemEditor(orc, redraw, it, editIdx) {
    var node = el('<div></div>');
    var precoM2 = it.tipo === 'esquadria' ? it.precoM2 : it.preco;
    var isMedida = it.tipo === 'esquadria' || (it.tipo === 'avulso' && it.modo === 'm2');

    var html = '<div class="field"><strong>' + esc(it.nome) + '</strong>';
    if (it.tipo === 'esquadria') html += '<div class="hint">' + brl(it.precoM2) + '/m² pelo ' + (it.cobrarPor === 'vidro' ? 'vidro cortado' : 'vão') + (num(it.folgaL) || num(it.folgaA) ? ' · folga ' + num(it.folgaL) + '×' + num(it.folgaA) + 'cm' : '') + '</div>';
    html += '</div>';
    if (isMedida) {
      html += '<div class="grid-2">' +
        '<div class="field"><label>Largura (cm)</label><input id="it-l" inputmode="decimal" value="' + (it.larg || '') + '" placeholder="ex: 120"></div>' +
        '<div class="field"><label>Altura (cm)</label><input id="it-a" inputmode="decimal" value="' + (it.alt || '') + '" placeholder="ex: 90"></div>' +
        '</div>';
    }
    html += '<div class="field"><label>Quantidade</label><input id="it-q" inputmode="numeric" value="' + (it.qtd || 1) + '"></div>';
    if (it.tipo === 'esquadria') {
      html += '<div class="field"><label>Preço do m² (R$)</label><input id="it-p" inputmode="decimal" value="' + precoM2 + '"></div>';
    } else if (it.modo === 'm2') {
      html += '<div class="field"><label>Preço do m² (R$)</label><input id="it-p" inputmode="decimal" value="' + precoM2 + '"></div>';
    } else {
      html += '<div class="field"><label>Preço unitário (R$)</label><input id="it-p" inputmode="decimal" value="' + precoM2 + '"></div>';
    }
    html += '<div class="card mt" id="it-calc" style="background:var(--bg)"></div>';
    node.innerHTML = html;

    var calc = node.querySelector('#it-calc');
    function sync() {
      if (isMedida) { it.larg = num(node.querySelector('#it-l').value); it.alt = num(node.querySelector('#it-a').value); }
      it.qtd = num(node.querySelector('#it-q').value) || 1;
      var p = num(node.querySelector('#it-p').value);
      if (it.tipo === 'esquadria') it.precoM2 = p; else it.preco = p;
      var lines = '';
      if (it.tipo === 'esquadria') {
        var m = medidaVidro(it);
        lines += '<div class="totais"><div class="line"><span>Vão</span><span>' + areaVao(it).toFixed(2) + ' m²</span></div>';
        lines += '<div class="line"><span>Vidro (corte)</span><span>' + m.l.toFixed(1) + '×' + m.a.toFixed(1) + 'cm · ' + areaVidro(it).toFixed(2) + 'm²</span></div>';
        if ((it.componentes || []).length) lines += '<div class="line"><span>Componentes</span><span>' + brl((it.componentes).reduce(function (s, c) { return s + num(c.preco) * num(c.qtd || 1); }, 0)) + '</span></div>';
        lines += '<div class="line big"><span>Subtotal</span><span>' + brl(subtotalItem(it)) + '</span></div></div>';
      } else if (it.modo === 'm2') {
        lines = '<div class="totais"><div class="line"><span>Área</span><span>' + areaVao(it).toFixed(2) + ' m²</span></div><div class="line big"><span>Subtotal</span><span>' + brl(subtotalItem(it)) + '</span></div></div>';
      } else {
        lines = '<div class="totais"><div class="line big"><span>Subtotal</span><span>' + brl(subtotalItem(it)) + '</span></div></div>';
      }
      calc.innerHTML = lines;
    }
    Array.prototype.forEach.call(node.querySelectorAll('input'), function (i) { i.addEventListener('input', sync); });
    sync();

    var ok = el('<button class="btn success mt">' + (editIdx != null ? 'Salvar item' : 'Adicionar ao orçamento') + '</button>');
    ok.onclick = function () {
      if (isMedida && (!it.larg || !it.alt)) { toast('Informe largura e altura'); return; }
      if (editIdx != null) orc.itens[editIdx] = it; else orc.itens.push(it);
      closeModal(); redraw();
    };
    node.appendChild(ok);
    openModal(editIdx != null ? 'Editar item' : 'Medidas', node);
  }

  /* ---------- ver / compartilhar ---------- */
  function verOrcamento(id) {
    var orc = DB.orcamentos.get(id), emp = DB.empresa.get(), cli = DB.clientes.get(orc.clienteId) || {}, t = totais(orc);
    app.innerHTML = '';
    app.appendChild(el('<h1 class="view-title">Orçamento #' + esc(orc.numero) + '</h1>'));

    var doc = el('<div class="card doc" id="doc"></div>');
    var linhas = (orc.itens || []).map(function (it) {
      var det = it.tipo === 'esquadria'
        ? (num(it.larg) + '×' + num(it.alt) + 'cm') + (num(it.qtd) > 1 ? ' · x' + num(it.qtd) : '')
        : (it.modo === 'm2' ? (num(it.larg) + '×' + num(it.alt) + 'cm') : '') + (num(it.qtd) > 1 ? ' · x' + num(it.qtd) : '');
      return '<tr><td><b>' + esc(it.nome) + '</b>' + (det ? '<br><span class="muted">' + det + '</span>' : '') + '</td><td class="r">' + brl(subtotalItem(it)) + '</td></tr>';
    }).join('');
    var logoHtml = (emp.logo && emp.logo.indexOf('data:') === 0) ? '<img src="' + emp.logo + '" style="width:34px;height:34px;border-radius:8px;object-fit:cover;vertical-align:middle"> ' : (emp.logo || '🪟') + ' ';
    doc.innerHTML =
      '<div class="doc-head"><h4>' + logoHtml + esc(emp.nome) + '</h4>' +
        '<div class="muted">' + esc(emp.slogan || '') + (emp.telefone ? ' · ' + esc(emp.telefone) : '') + '</div>' +
        '<div class="muted">Orçamento nº ' + esc(orc.numero) + ' · ' + fmtDate(orc.data) + ' · <span class="badge ' + orc.status + '">' + statusLabel(orc.status) + '</span></div>' +
      '</div>' +
      '<div><b>Cliente:</b> ' + esc(cli.nome || '—') + (cli.telefone ? ' · ' + esc(cli.telefone) : '') + '</div>' +
      '<table>' + linhas + '</table>' +
      '<div class="totais">' +
        '<div class="line"><span>Subtotal</span><span>' + brl(t.bruto) + '</span></div>' +
        (t.desc ? '<div class="line"><span>Desconto</span><span>- ' + brl(t.desc) + '</span></div>' : '') +
        '<div class="line big"><span>Total</span><span>' + brl(t.total) + '</span></div>' +
      '</div>' +
      (orc.obs ? '<p class="muted mt"><b>Obs.:</b> ' + esc(orc.obs) + '</p>' : '') +
      (emp.validadeDias ? '<p class="muted">Validade: ' + emp.validadeDias + ' dias.</p>' : '') +
      (emp.condicoes ? '<p class="muted" style="font-size:12px">' + esc(emp.condicoes) + '</p>' : '');
    app.appendChild(doc);

    var wa = el('<button class="btn success mt">💬 Enviar no WhatsApp</button>');
    wa.onclick = function () { enviarWhats(orc, emp, cli, t); };
    app.appendChild(wa);
    var row = el('<div class="btn-row mt"></div>');
    var share = el('<button class="btn ghost">📤 Compartilhar</button>');
    share.onclick = function () { compartilhar(orc, emp, cli, t); };
    var pdf = el('<button class="btn ghost">🖨️ PDF</button>');
    pdf.onclick = function () { window.print(); };
    row.appendChild(share); row.appendChild(pdf); app.appendChild(row);

    var row2 = el('<div class="btn-row mt"></div>');
    var edit = el('<button class="btn subtle">✏️ Editar</button>');
    edit.onclick = function () { formOrcamento(orc); };
    var del = el('<button class="btn subtle">🗑️ Excluir</button>');
    del.onclick = function () { if (confirm('Excluir este orçamento?')) { DB.orcamentos.remove(id); toast('Excluído'); go('inicio'); } };
    row2.appendChild(edit); row2.appendChild(del); app.appendChild(row2);
  }

  function mensagem(orc, emp, cli, t) {
    var linhas = (orc.itens || []).map(function (it) {
      var med = (it.tipo === 'esquadria' || (it.tipo === 'avulso' && it.modo === 'm2')) ? ' (' + num(it.larg) + 'x' + num(it.alt) + 'cm)' : '';
      return '• ' + it.nome + med + (num(it.qtd) > 1 ? ' x' + num(it.qtd) : '') + ' — ' + brl(subtotalItem(it));
    }).join('\n');
    return '*' + (emp.nome || 'Vidraçaria') + '* — Orçamento nº ' + orc.numero + '\n' +
      (cli.nome ? 'Cliente: ' + cli.nome + '\n' : '') + 'Data: ' + fmtDate(orc.data) + '\n\n' +
      linhas + '\n\n' + 'Subtotal: ' + brl(t.bruto) + '\n' + (t.desc ? 'Desconto: -' + brl(t.desc) + '\n' : '') +
      '*Total: ' + brl(t.total) + '*' + (orc.obs ? '\n\nObs.: ' + orc.obs : '') +
      (emp.telefone ? '\n\n' + emp.nome + ' · ' + emp.telefone : '');
  }
  function enviarWhats(orc, emp, cli, t) {
    var fone = (cli.telefone || '').replace(/\D/g, '');
    var base = fone ? 'https://wa.me/55' + fone : 'https://wa.me/';
    window.open(base + '?text=' + encodeURIComponent(mensagem(orc, emp, cli, t)), '_blank');
    if (orc.status === 'rascunho') { DB.orcamentos.update(orc.id, { status: 'enviado' }); }
  }
  function compartilhar(orc, emp, cli, t) {
    var txt = mensagem(orc, emp, cli, t);
    if (navigator.share) { navigator.share({ title: 'Orçamento #' + orc.numero, text: txt }).catch(function () {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(function () { toast('Orçamento copiado ✔'); }); }
    else { toast('Use o botão WhatsApp ou PDF'); }
  }

  /* ================= CLIENTES ================= */
  function renderClientes() {
    app.innerHTML = '';
    app.appendChild(el('<h1 class="view-title">Clientes</h1>'));
    var search = el('<div class="field"><input id="busca" placeholder="🔎 Buscar cliente..."></div>');
    app.appendChild(search);
    var add = el('<button class="btn">＋ Novo cliente</button>');
    add.onclick = function () { formCliente(null, function () { draw(''); }); };
    app.appendChild(add);
    var box = el('<div class="list mt"></div>');
    app.appendChild(box);

    function draw(f) {
      var list = DB.clientes.all().filter(function (c) { return !f || (c.nome + (c.telefone || '')).toLowerCase().indexOf(f.toLowerCase()) > -1; });
      box.innerHTML = '';
      if (!list.length) { box.appendChild(el('<div class="empty"><span class="big">👥</span>Nenhum cliente.</div>')); return; }
      list.forEach(function (c) {
        var card = el('<div class="card row-item"><div class="grow"><strong>' + esc(c.nome) + '</strong><small>' + esc(c.telefone || '') + (c.endereco ? ' · ' + esc(c.endereco) : '') + '</small></div><button class="icon-btn">✏️</button></div>');
        card.querySelector('.icon-btn').onclick = function (e) { e.stopPropagation(); formCliente(c, function () { draw(document.getElementById('busca').value); }); };
        box.appendChild(card);
      });
    }
    draw('');
    document.getElementById('busca').addEventListener('input', function (e) { draw(e.target.value); });
  }
  function formCliente(cli, done) {
    var editing = !!cli; cli = cli || { nome: '', telefone: '', endereco: '' };
    var node = el('<div></div>');
    node.innerHTML =
      '<div class="field"><label>Nome *</label><input id="c-nome" value="' + esc(cli.nome) + '"></div>' +
      '<div class="field"><label>WhatsApp / Telefone</label><input id="c-fone" inputmode="tel" value="' + esc(cli.telefone) + '" placeholder="(11) 90000-0000"></div>' +
      '<div class="field"><label>Endereço</label><input id="c-end" value="' + esc(cli.endereco || '') + '"></div>';
    var save = el('<button class="btn success">Salvar</button>');
    save.onclick = function () {
      var obj = { nome: node.querySelector('#c-nome').value.trim(), telefone: node.querySelector('#c-fone').value.trim(), endereco: node.querySelector('#c-end').value.trim() };
      if (!obj.nome) { toast('Informe o nome'); return; }
      var saved = editing ? DB.clientes.update(cli.id, obj) : DB.clientes.add(obj);
      closeModal(); toast('Cliente salvo ✔'); if (done) done(saved);
    };
    if (editing) {
      var del = el('<button class="btn subtle mt">🗑️ Excluir cliente</button>');
      del.onclick = function () { if (confirm('Excluir cliente?')) { DB.clientes.remove(cli.id); closeModal(); toast('Excluído'); if (done) done(); } };
      node.appendChild(save); node.appendChild(del);
    } else node.appendChild(save);
    openModal(editing ? 'Editar cliente' : 'Novo cliente', node);
  }

  /* ================= AJUSTES ================= */
  function renderConfig() {
    app.innerHTML = '';
    app.appendChild(el('<h1 class="view-title">Ajustes</h1>'));
    app.appendChild(el('<div class="section-label" style="margin-top:0">Sua empresa (aparece no orçamento)</div>'));
    var emp = el('<button class="btn ghost">🏢 Dados da empresa</button>');
    emp.onclick = formEmpresa;
    app.appendChild(emp);

    app.appendChild(el('<div class="section-label">Preços</div>'));
    var esq = el('<button class="btn ghost">🪟 Esquadrias (tipologias)</button>');
    esq.onclick = renderEsquadrias;
    var prod = el('<button class="btn ghost mt">📦 Produtos avulsos</button>');
    prod.onclick = renderProdutos;
    app.appendChild(esq); app.appendChild(prod);

    app.appendChild(el('<div class="section-label">Dados</div>'));
    var exp = el('<button class="btn subtle">⬇️ Exportar backup (JSON)</button>');
    exp.onclick = function () {
      var blob = new Blob([DB.exportJSON()], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'backup-orcamentos.json'; a.click(); toast('Backup gerado');
    };
    app.appendChild(exp);
    app.appendChild(el('<p class="fab-note">Os dados ficam salvos neste aparelho. Faça backup de vez em quando.</p>'));
  }

  function formEmpresa() {
    var e = DB.empresa.get();
    var node = el('<div></div>');
    node.innerHTML =
      '<div class="field"><label>Nome da empresa</label><input id="e-nome" value="' + esc(e.nome) + '"></div>' +
      '<div class="field"><label>Slogan / ramo</label><input id="e-slogan" value="' + esc(e.slogan || '') + '" placeholder="Vidros e Esquadrias"></div>' +
      '<div class="grid-2"><div class="field"><label>Telefone</label><input id="e-tel" inputmode="tel" value="' + esc(e.telefone || '') + '"></div>' +
      '<div class="field"><label>CNPJ</label><input id="e-cnpj" value="' + esc(e.cnpj || '') + '"></div></div>' +
      '<div class="field"><label>Endereço</label><input id="e-end" value="' + esc(e.endereco || '') + '"></div>' +
      '<div class="grid-2"><div class="field"><label>Cor da marca</label><input id="e-cor" type="color" value="' + (e.cor || '#0ea5e9') + '"></div>' +
      '<div class="field"><label>Validade (dias)</label><input id="e-val" inputmode="numeric" value="' + (e.validadeDias || 7) + '"></div></div>' +
      '<div class="field"><label>Logo</label><div class="grid-2"><input id="e-logo" value="' + (e.logo && e.logo.indexOf('data:') === 0 ? '' : esc(e.logo || '🪟')) + '" placeholder="emoji ex: 🪟"><input id="e-logo-img" type="file" accept="image/*"></div><div class="hint">Use um emoji ou envie uma imagem do logo.</div></div>' +
      '<div class="field"><label>Condições (rodapé)</label><textarea id="e-cond" rows="2">' + esc(e.condicoes || '') + '</textarea></div>';
    var logoData = null;
    node.querySelector('#e-logo-img').addEventListener('change', function (ev) {
      var f = ev.target.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { logoData = r.result; toast('Logo carregado'); }; r.readAsDataURL(f);
    });
    var save = el('<button class="btn success">Salvar</button>');
    save.onclick = function () {
      DB.empresa.save({
        nome: node.querySelector('#e-nome').value.trim() || 'Sua Vidraçaria',
        slogan: node.querySelector('#e-slogan').value.trim(),
        telefone: node.querySelector('#e-tel').value.trim(),
        cnpj: node.querySelector('#e-cnpj').value.trim(),
        endereco: node.querySelector('#e-end').value.trim(),
        cor: node.querySelector('#e-cor').value,
        validadeDias: num(node.querySelector('#e-val').value) || 7,
        logo: logoData || node.querySelector('#e-logo').value.trim() || '🪟',
        condicoes: node.querySelector('#e-cond').value.trim()
      });
      applyBranding(); closeModal(); toast('Empresa salva ✔'); go('config');
    };
    node.appendChild(save);
    openModal('Dados da empresa', node);
  }

  function renderEsquadrias() {
    app.innerHTML = '';
    app.appendChild(el('<h1 class="view-title">Esquadrias</h1>'));
    var back = el('<button class="btn subtle sm">‹ Voltar aos ajustes</button>');
    back.onclick = renderConfig; app.appendChild(back);
    var add = el('<button class="btn mt">＋ Nova esquadria</button>');
    add.onclick = function () { formEsquadria(null); }; app.appendChild(add);
    var box = el('<div class="list mt"></div>'); app.appendChild(box);
    DB.esquadrias.all().forEach(function (e) {
      var c = el('<div class="card row-item"><div class="grow"><strong>' + esc(e.nome) + '</strong><small>' + esc(e.categoria) + ' · ' + brl(e.precoM2) + '/m² (' + (e.cobrarPor === 'vidro' ? 'vidro' : 'vão') + ') · folga ' + num(e.folgaL) + '×' + num(e.folgaA) + 'cm</small></div><button class="icon-btn">✏️</button></div>');
      c.querySelector('.icon-btn').onclick = function () { formEsquadria(e); };
      box.appendChild(c);
    });
  }
  function formEsquadria(e) {
    var editing = !!e; e = e || { nome: '', categoria: 'Janela', precoM2: 0, cobrarPor: 'vao', folgaL: 1, folgaA: 1, componentes: [] };
    var comps = JSON.parse(JSON.stringify(e.componentes || []));
    var node = el('<div></div>');
    function compHtml() {
      return comps.map(function (c, i) { return '<div class="builder-item"><div class="grow"><strong>' + esc(c.nome) + '</strong><small>' + brl(c.preco) + ' · x' + num(c.qtd || 1) + '</small></div><button class="icon-btn" data-rm="' + i + '">✕</button></div>'; }).join('') || '<div class="muted" style="padding:4px">Sem componentes.</div>';
    }
    node.innerHTML =
      '<div class="field"><label>Nome *</label><input id="s-nome" value="' + esc(e.nome) + '"></div>' +
      '<div class="grid-2"><div class="field"><label>Categoria</label><input id="s-cat" value="' + esc(e.categoria) + '"></div>' +
      '<div class="field"><label>Preço m² (R$)</label><input id="s-preco" inputmode="decimal" value="' + e.precoM2 + '"></div></div>' +
      '<div class="field"><label>Cobrar pela área do</label><select id="s-cobrar"><option value="vao"' + (e.cobrarPor === 'vao' ? ' selected' : '') + '>Vão (medida do buraco)</option><option value="vidro"' + (e.cobrarPor === 'vidro' ? ' selected' : '') + '>Vidro cortado (com folga)</option></select></div>' +
      '<div class="grid-2"><div class="field"><label>Folga largura (cm)</label><input id="s-fl" inputmode="decimal" value="' + num(e.folgaL) + '"></div>' +
      '<div class="field"><label>Folga altura (cm)</label><input id="s-fa" inputmode="decimal" value="' + num(e.folgaA) + '"></div></div>' +
      '<div class="section-label">Componentes fixos</div><div class="list" id="s-comps">' + compHtml() + '</div>' +
      '<button class="btn ghost sm mt" id="s-addcomp">＋ Componente</button>';
    node.querySelector('#s-comps').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-rm]'); if (b) { comps.splice(+b.dataset.rm, 1); node.querySelector('#s-comps').innerHTML = compHtml(); }
    });
    node.querySelector('#s-addcomp').onclick = function () {
      var nome = prompt('Nome do componente (ex: Kit box):'); if (!nome) return;
      var preco = num(prompt('Preço (R$):', '0'));
      comps.push({ nome: nome, preco: preco, qtd: 1 }); node.querySelector('#s-comps').innerHTML = compHtml();
    };
    var save = el('<button class="btn success mt">Salvar</button>');
    save.onclick = function () {
      var obj = {
        nome: node.querySelector('#s-nome').value.trim(), categoria: node.querySelector('#s-cat').value.trim() || 'Esquadria',
        precoM2: num(node.querySelector('#s-preco').value), cobrarPor: node.querySelector('#s-cobrar').value,
        folgaL: num(node.querySelector('#s-fl').value), folgaA: num(node.querySelector('#s-fa').value), componentes: comps
      };
      if (!obj.nome) { toast('Informe o nome'); return; }
      if (editing) DB.esquadrias.update(e.id, obj); else DB.esquadrias.add(obj);
      closeModal(); toast('Salvo ✔'); renderEsquadrias();
    };
    node.appendChild(save);
    if (editing) {
      var del = el('<button class="btn subtle mt">🗑️ Excluir</button>');
      del.onclick = function () { if (confirm('Excluir esquadria?')) { DB.esquadrias.remove(e.id); closeModal(); renderEsquadrias(); } };
      node.appendChild(del);
    }
    openModal(editing ? 'Editar esquadria' : 'Nova esquadria', node);
  }

  function renderProdutos() {
    app.innerHTML = '';
    app.appendChild(el('<h1 class="view-title">Produtos avulsos</h1>'));
    var back = el('<button class="btn subtle sm">‹ Voltar aos ajustes</button>');
    back.onclick = renderConfig; app.appendChild(back);
    var add = el('<button class="btn mt">＋ Novo produto</button>');
    add.onclick = function () { formProduto(null); }; app.appendChild(add);
    var box = el('<div class="list mt"></div>'); app.appendChild(box);
    DB.produtos.all().forEach(function (p) {
      var c = el('<div class="card row-item"><div class="grow"><strong>' + esc(p.nome) + '</strong><small>' + esc(p.categoria) + ' · ' + brl(p.preco) + (p.modo === 'm2' ? '/m²' : '/un') + '</small></div><button class="icon-btn">✏️</button></div>');
      c.querySelector('.icon-btn').onclick = function () { formProduto(p); };
      box.appendChild(c);
    });
  }
  function formProduto(p) {
    var editing = !!p; p = p || { nome: '', categoria: 'Vidro', modo: 'm2', preco: 0 };
    var node = el('<div></div>');
    node.innerHTML =
      '<div class="field"><label>Nome *</label><input id="p-nome" value="' + esc(p.nome) + '"></div>' +
      '<div class="grid-2"><div class="field"><label>Categoria</label><input id="p-cat" value="' + esc(p.categoria) + '"></div>' +
      '<div class="field"><label>Cobrança</label><select id="p-modo"><option value="m2"' + (p.modo === 'm2' ? ' selected' : '') + '>por m²</option><option value="un"' + (p.modo === 'un' ? ' selected' : '') + '>por unidade</option></select></div></div>' +
      '<div class="field"><label>Preço (R$)</label><input id="p-preco" inputmode="decimal" value="' + p.preco + '"></div>';
    var save = el('<button class="btn success">Salvar</button>');
    save.onclick = function () {
      var obj = { nome: node.querySelector('#p-nome').value.trim(), categoria: node.querySelector('#p-cat').value.trim() || 'Produto', modo: node.querySelector('#p-modo').value, preco: num(node.querySelector('#p-preco').value) };
      if (!obj.nome) { toast('Informe o nome'); return; }
      if (editing) DB.produtos.update(p.id, obj); else DB.produtos.add(obj);
      closeModal(); toast('Salvo ✔'); renderProdutos();
    };
    node.appendChild(save);
    if (editing) {
      var del = el('<button class="btn subtle mt">🗑️ Excluir</button>');
      del.onclick = function () { if (confirm('Excluir produto?')) { DB.produtos.remove(p.id); closeModal(); renderProdutos(); } };
      node.appendChild(del);
    }
    openModal(editing ? 'Editar produto' : 'Novo produto', node);
  }

  /* ---------- init ---------- */
  applyBranding();
  go('inicio');
})();
