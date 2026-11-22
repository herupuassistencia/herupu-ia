import { useEffect, useState } from "react";
import { MapPin, Users, Clock, ShieldCheck, Download, RefreshCw } from "lucide-react";
import api from "../services/api";

const data = (d) => (d ? new Date(d).toLocaleDateString("pt-BR") : "");
const TIPOS = {
  exclusao: "Excluir conta",
  acesso: "Cópia dos dados",
  correcao: "Corrigir dados",
  revogar_consentimento: "Parar avisos",
};

export default function Lancamento() {
  const [d, setD] = useState(null);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("");

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setErro("");
    try {
      const r = await api.get("/admin/lancamento");
      setD(r.data);
    } catch (e) {
      setErro(e.response?.data?.erro || e.message);
    }
  }

  async function concluir(id) {
    if (!confirm("Marcar este pedido como atendido?")) return;
    await api.post(`/admin/lancamento/lgpd/${id}/concluir`);
    carregar();
  }

  function csv(nome, linhas) {
    if (!linhas?.length) return;
    const cab = Object.keys(linhas[0]);
    const txt = [cab, ...linhas.map((l) => cab.map((k) => `"${String(l[k] ?? "").replace(/"/g, '""')}"`))].map((r) => r.join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + txt], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `herupu-${nome}.csv`; a.click();
  }

  if (erro) return <div className="text-red-300 p-6">Não foi possível carregar o painel: {erro}</div>;
  if (!d) return <div className="text-gray-400 p-6">Carregando…</div>;

  const t = d.totais || {};
  const cidades = (d.por_cidade || []).filter((c) =>
    !filtro || `${c.cidade} ${c.estado} ${c.areas || ""}`.toLowerCase().includes(filtro.toLowerCase())
  );
  const maxCat = Math.max(1, ...(d.por_categoria || []).map((c) => c.tecnicos));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">LANÇAMENTO NACIONAL</h1>
          <p className="text-gray-400 mt-1">Onde já há técnicos, onde há clientes esperando e de onde vêm os cadastros</p>
        </div>
        <button onClick={carregar} className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 rounded-2xl px-4 py-2 text-xs font-bold tracking-widest flex items-center gap-2">
          <RefreshCw size={14} /> ATUALIZAR
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={<Users size={18} />} label="TÉCNICOS" valor={t.tecnicos} />
        <Kpi icon={<Users size={18} />} label="ONLINE AGORA" valor={t.tecnicos_online} />
        <Kpi icon={<Users size={18} />} label="NOVOS (7 DIAS)" valor={t.tecnicos_7d} />
        <Kpi icon={<Users size={18} />} label="CLIENTES" valor={t.clientes} />
        <Kpi icon={<Clock size={18} />} label="NA LISTA DE ESPERA" valor={t.em_espera} destaque={t.em_espera > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Painel titulo="Técnicos por área" acao={() => csv("tecnicos-por-area", d.por_categoria)}>
          {(d.por_categoria || []).map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-1.5">
              <div className="w-48 text-sm text-gray-200 truncate">{c.nome}</div>
              <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${c.tecnicos ? "bg-emerald-400" : "bg-red-400/60"}`} style={{ width: `${c.tecnicos ? Math.max(4, (c.tecnicos / maxCat) * 100) : 4}%` }} />
              </div>
              <div className={`w-10 text-right text-sm font-bold ${c.tecnicos ? "text-emerald-300" : "text-red-300"}`}>{c.tecnicos}</div>
            </div>
          ))}
          <p className="text-xs text-gray-500 mt-2">Áreas em vermelho ainda não têm técnico: priorize a divulgação delas.</p>
        </Painel>

        <Painel titulo="Clientes esperando técnico" acao={() => csv("lista-de-espera", d.lista_espera)}>
          {!d.lista_espera?.length && <p className="text-sm text-gray-400">Ninguém na lista de espera.</p>}
          <Tabela
            cab={["Cidade", "Área", "Pedidos", "Desde"]}
            linhas={(d.lista_espera || []).map((l) => [`${l.cidade}${l.estado ? `/${l.estado}` : ""}`, l.categoria, l.pedidos, data(l.desde)])}
          />
          <p className="text-xs text-gray-500 mt-2">Estas são as cidades e áreas onde vale anunciar para técnicos agora. Quem está na lista é avisado sozinho quando chega um técnico a até {d.raio_km} km.</p>
        </Painel>
      </div>

      <Painel titulo="Técnicos por cidade" acao={() => csv("tecnicos-por-cidade", d.por_cidade)}>
        <div className="flex flex-wrap gap-2 mb-3">
          {(d.por_estado || []).map((e) => (
            <button key={e.estado} onClick={() => setFiltro(filtro === e.estado ? "" : e.estado)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border ${filtro === e.estado ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200" : "border-white/10 text-gray-300"}`}>
              {e.estado} · {e.tecnicos}
            </button>
          ))}
        </div>
        <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar cidade, estado ou área"
          className="w-full md:w-80 mb-3 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
        <Tabela
          cab={["Cidade", "Técnicos", "Áreas atendidas"]}
          linhas={cidades.map((c) => [`${c.cidade}${c.estado ? `/${c.estado}` : ""}`, c.tecnicos, c.areas || "—"])}
        />
        <p className="text-xs text-gray-500 mt-2">Anuncie para clientes só nas cidades que já têm técnicos nas áreas certas.</p>
      </Painel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Painel titulo="De onde vieram os cadastros (30 dias)" acao={() => csv("origem-cadastros", d.origem)}>
          {!d.origem?.length && <p className="text-sm text-gray-400">Sem dados ainda. Use links com ?utm_source=… nas divulgações.</p>}
          <Tabela cab={["App", "Origem", "Campanha", "Cadastros"]} linhas={(d.origem || []).map((o) => [o.app, o.origem, o.campanha || "—", o.cadastros])} />
        </Painel>

        <Painel titulo={<span className="flex items-center gap-2"><ShieldCheck size={16} /> Pedidos LGPD em aberto</span>}>
          {!d.lgpd_pendentes?.length && <p className="text-sm text-gray-400">Nenhum pedido em aberto.</p>}
          {(d.lgpd_pendentes || []).map((p) => {
            const dias = Math.floor((Date.now() - new Date(p.criado_em)) / 86400000);
            return (
              <div key={p.id} className="flex items-start justify-between gap-3 py-2 border-b border-white/5">
                <div className="text-sm">
                  <div className="text-white font-bold">#{p.id} · {TIPOS[p.tipo] || p.tipo}</div>
                  <div className="text-gray-400">{p.nome} · {p.email}</div>
                  {p.detalhe && <div className="text-gray-300 mt-1">“{p.detalhe}”</div>}
                  <div className={`text-xs mt-1 ${dias >= 10 ? "text-red-300" : "text-gray-500"}`}>Aberto há {dias} dia(s) · prazo de 15 dias</div>
                </div>
                <button onClick={() => concluir(p.id)} className="shrink-0 text-xs font-bold border border-emerald-400/40 text-emerald-300 rounded-xl px-3 py-1.5">ATENDIDO</button>
              </div>
            );
          })}
          <p className="text-xs text-gray-500 mt-2">Versão dos termos em vigor: {d.versao_termos}</p>
        </Painel>
      </div>
    </div>
  );
}

function Kpi({ icon, label, valor, destaque }) {
  return (
    <div className={`rounded-2xl border p-4 bg-black/70 backdrop-blur-sm ${destaque ? "border-yellow-400/40" : "border-emerald-500/15"}`}>
      <div className="flex items-center gap-2 text-gray-400 text-[11px] font-bold tracking-widest">{icon}{label}</div>
      <div className={`text-3xl font-black mt-1 ${destaque ? "text-yellow-300" : "text-white"}`}>{valor ?? 0}</div>
    </div>
  );
}

function Painel({ titulo, acao, children }) {
  return (
    <div className="rounded-2xl border border-emerald-500/15 bg-black/70 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold flex items-center gap-2"><MapPin size={16} className="text-emerald-400" />{titulo}</h2>
        {acao && <button onClick={acao} className="text-xs text-cyan-300 flex items-center gap-1"><Download size={13} /> CSV</button>}
      </div>
      {children}
    </div>
  );
}

function Tabela({ cab, linhas }) {
  if (!linhas.length) return null;
  return (
    <div className="overflow-x-auto max-h-96">
      <table className="w-full text-sm">
        <thead>
          <tr>{cab.map((c) => <th key={c} className="text-left text-[11px] tracking-widest text-gray-500 font-bold py-1.5 pr-3">{c.toUpperCase()}</th>)}</tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-t border-white/5">
              {l.map((v, j) => <td key={j} className="py-1.5 pr-3 text-gray-200">{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
