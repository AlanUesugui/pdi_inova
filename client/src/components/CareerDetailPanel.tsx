import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, GraduationCap, Briefcase, BookOpen,
  MapPin, Globe, CheckCircle2, AlertTriangle, Zap,
  TrendingUp, Calendar, Award, ArrowRight, CircleDot
} from 'lucide-react';
import {
  type CareerMember,
  parseProntidao,
  parseShortLabel,
  computeHiddenTalent,
} from './CareerMap';

// ─── Utilities ────────────────────────────────────────────────────────────────

const getRatingStyle = (val: string) => {
  if (val === 'Ótimo') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (val === 'Bom') return 'bg-blue-100 text-blue-700 border-blue-100';
  if (val === 'Ruim') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (val === 'Sim') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (val === 'Não') return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-gray-100 text-gray-500 border-gray-200';
};

const buildTimeline = (m: CareerMember) => {
  const items: Array<{
    type: string; year: string; title: string; subtitle: string;
    icon: string; badge?: string | null; rating?: string;
  }> = [];

  const admissionYear = m.data_admissao ? new Date(m.data_admissao).getFullYear() : null;
  const expStart = admissionYear && m.anos_experiencia ? admissionYear - m.anos_experiencia : null;

  if (m.curso_formacao) {
    items.push({
      type: 'education',
      year: expStart ? `~${expStart}` : 'Anterior',
      title: m.curso_formacao,
      subtitle: [m.nivel_escolaridade, m.instituicao].filter(Boolean).join(' · '),
      icon: 'graduation',
    });
  }

  if (m.data_admissao) {
    const d = new Date(m.data_admissao);
    items.push({
      type: 'admission',
      year: d.getFullYear().toString(),
      title: `Entrada como ${m.cargo}`,
      subtitle: `${m.departamento} · ${d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      icon: 'briefcase',
    });
  }

  const sorted = [...m.treinamentos].sort(
    (a, b) => new Date(a.data || '2020-01-01').getTime() - new Date(b.data || '2020-01-01').getTime()
  );
  for (const t of sorted) {
    const d = t.data ? new Date(t.data) : null;
    items.push({
      type: 'training',
      year: d ? d.getFullYear().toString() : '',
      title: t.nome,
      subtitle: [
        d ? d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '',
        t.carga_horaria || '',
        t.provedor || '',
      ].filter(Boolean).join(' · '),
      icon: 'book',
      badge: t.eficacia === 'Sim' ? 'Eficaz' : null,
      rating: t.conhecimento,
    });
  }

  items.push({
    type: 'today',
    year: new Date().getFullYear().toString(),
    title: 'Posição atual',
    subtitle: m.cargo,
    icon: 'today',
  });

  return items;
};

// ─── Competency comparison ─────────────────────────────────────────────────────

const buildCompetencyMap = (m: CareerMember) => {
  const required = m.competencias_exigidas;
  const declared = [
    m.competencia_tecnica_1, m.competencia_tecnica_2, m.competencia_tecnica_3,
    m.competencia_comportamental, m.competencia_comportamental_2,
  ].filter(Boolean) as string[];

  const rows: Array<{ name: string; tipo: string; nivel: string; status: 'match' | 'gap' | 'extra' }> = [];

  // Required comps — check if declared
  for (const req of required) {
    const has = declared.some(d =>
      d.toLowerCase().includes(req.competencia.toLowerCase()) ||
      req.competencia.toLowerCase().includes(d.toLowerCase())
    );
    rows.push({ name: req.competencia, tipo: req.tipo, nivel: req.nivel, status: has ? 'match' : 'gap' });
  }

  // Extra declared comps not in required
  for (const d of declared) {
    const isRequired = required.some(req =>
      req.competencia.toLowerCase().includes(d.toLowerCase()) ||
      d.toLowerCase().includes(req.competencia.toLowerCase())
    );
    if (!isRequired) {
      rows.push({ name: d, tipo: 'Declarada', nivel: '—', status: 'extra' });
    }
  }

  return rows;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skel: React.FC<{ w?: string; h?: string }> = ({ w = 'w-full', h = 'h-3' }) => (
  <div className={`${w} ${h} bg-gray-200 rounded-full animate-pulse`} />
);

const LoadingSkeleton: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex-1 overflow-y-auto p-8 space-y-8">
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-bold text-purple-500 animate-pulse">Carregando perfil de {name}...</span>
    </div>
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <Skel w="w-1/3" h="h-2.5" />
        <Skel />
        <Skel w="w-4/5" />
        <Skel w="w-3/5" />
      </div>
    ))}
  </div>
);

// ─── Panel ─────────────────────────────────────────────────────────────────────

const CareerDetailPanel: React.FC<{ member: CareerMember | null; onClose: () => void }> = ({ member, onClose }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!member) { setReady(false); return; }
    setReady(false);
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, [member?.id]);

  if (!member) return null;

  const prontidao = parseProntidao(member.nivel_prontidao);
  const talent = computeHiddenTalent(member);
  const timeline = buildTimeline(member);
  const compMap = buildCompetencyMap(member);
  const initials = member.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const matchCount = compMap.filter(r => r.status === 'match').length;
  const gapCount = compMap.filter(r => r.status === 'gap').length;
  const extraCount = compMap.filter(r => r.status === 'extra').length;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">

        {/* ── Dark Header ────────────────────────────────────────────────── */}
        <div className="shrink-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 px-8 pt-7 pb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

          {/* Top bar */}
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Perfil de Carreira</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Collaborator info */}
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/20 bg-primary-700 flex items-center justify-center shrink-0">
              <img
                src={member.avatar}
                alt={member.nome}
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-white font-black text-sm">${initials}</span>`;
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-white leading-tight">{member.nome}</h2>
              <p className="text-gray-400 text-sm mt-0.5">{member.cargo}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[10px] font-black bg-white/10 text-gray-300 px-2.5 py-1 rounded-full border border-white/10">
                  {member.departamento}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${prontidao.bg} ${prontidao.border} ${prontidao.text}`}>
                  {prontidao.label}
                </span>
                {talent.hasTalent && (
                  <span className="flex items-center gap-1 text-[10px] font-black bg-amber-400/20 border border-amber-400/30 text-amber-300 px-2.5 py-1 rounded-full">
                    <Zap className="w-2.5 h-2.5 fill-amber-400" />
                    Talento Oculto
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Experiência</p>
              <p className="text-lg font-black text-white">{member.anos_experiencia}<span className="text-xs text-gray-400 ml-1">anos</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Treinamentos</p>
              <p className="text-lg font-black text-white">{member.treinamentos.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Potencial</p>
              <p className={`text-lg font-black ${
                member.potencial_crescimento === 'Alto' ? 'text-emerald-400' :
                member.potencial_crescimento === 'Baixo' ? 'text-rose-400' : 'text-amber-400'
              }`}>{member.potencial_crescimento || '—'}</p>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-600 relative z-10">Gerado em {today} · PDI Hub Career Intelligence</p>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        {!ready ? (
          <LoadingSkeleton name={member.nome.split(' ')[0]} />
        ) : (
          <div className="flex-1 overflow-y-auto bg-gray-50/50">

            {/* ── 1. Linha do Tempo ─────────────────────────────── */}
            <section className="p-8 pb-0">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Linha do Tempo de Carreira</h3>
              </div>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[18px] top-2 bottom-0 w-px bg-gray-200" />

                <div className="space-y-0">
                  {timeline.map((item, i) => (
                    <div key={i} className="flex gap-4 pb-6 relative">
                      {/* Node */}
                      <div className={`shrink-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center z-10 ${
                        item.type === 'today' ? 'bg-primary-600 border-primary-600' :
                        item.type === 'education' ? 'bg-purple-50 border-purple-200' :
                        item.type === 'admission' ? 'bg-emerald-50 border-emerald-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        {item.type === 'graduation' || item.type === 'education' ? <GraduationCap className="w-4 h-4 text-purple-500" /> :
                         item.type === 'admission' ? <Briefcase className="w-4 h-4 text-emerald-500" /> :
                         item.type === 'today' ? <CircleDot className="w-4 h-4 text-white" /> :
                         <BookOpen className="w-4 h-4 text-blue-500" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1.5 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm font-bold leading-snug truncate ${item.type === 'today' ? 'text-primary-600' : 'text-gray-800'}`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{item.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className="text-[9px] font-black bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                            {item.rating && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${getRatingStyle(item.rating)}`}>
                                {item.rating}
                              </span>
                            )}
                            {item.year && (
                              <span className="text-[10px] font-black text-gray-300">{item.year}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 2. Mapa de Competências ───────────────────────── */}
            <section className="px-8 py-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Mapa de Competências</h3>
              </div>
              {/* Summary chips */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[9px] font-black bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full">
                  {matchCount} compatíveis
                </span>
                <span className="text-[9px] font-black bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-full">
                  {gapCount} lacuna{gapCount !== 1 ? 's' : ''}
                </span>
                <span className="text-[9px] font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
                  {extraCount} adiciona{extraCount !== 1 ? 'is' : 'l'}
                </span>
              </div>

              {compMap.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-xs font-medium">
                  Nenhuma competência mapeada para este cargo.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                  <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50/70">
                    <span className="col-span-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Competência</span>
                    <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipo</span>
                    <span className="col-span-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Nível Exigido</span>
                    <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Status</span>
                  </div>
                  {compMap.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-gray-50/50 transition-colors">
                      <span className="col-span-5 text-xs font-bold text-gray-800 truncate pr-2">{row.name}</span>
                      <span className="col-span-2 text-[10px] text-gray-400">{row.tipo}</span>
                      <span className="col-span-3 text-[10px] text-gray-500">{row.nivel}</span>
                      <div className="col-span-2 flex justify-end">
                        {row.status === 'match' && (
                          <span className="flex items-center gap-1 text-[9px] font-black bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Possui
                          </span>
                        )}
                        {row.status === 'gap' && (
                          <span className="flex items-center gap-1 text-[9px] font-black bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Lacuna
                          </span>
                        )}
                        {row.status === 'extra' && (
                          <span className="flex items-center gap-1 text-[9px] font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-full">
                            <ArrowRight className="w-2.5 h-2.5" />
                            Extra
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── 3. Histórico de Treinamentos ─────────────────── */}
            <section className="px-8 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Histórico de Treinamentos</h3>
              </div>

              {member.treinamentos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-xs font-medium">
                  Nenhum treinamento registrado no PDI.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                  <div className="grid grid-cols-12 px-5 py-2.5 bg-gray-50/70">
                    <span className="col-span-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Treinamento</span>
                    <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Conhec.</span>
                    <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Aplicação</span>
                    <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Desempenho</span>
                    <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Eficácia</span>
                  </div>
                  {member.treinamentos.map((t, i) => (
                    <div key={i} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-gray-50/50 transition-colors">
                      <div className="col-span-4 pr-2">
                        <p className="text-xs font-bold text-gray-800 leading-tight truncate">{t.nome}</p>
                        {t.data && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(t.data).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      {[t.conhecimento, t.aplicacao, t.desempenho].map((val, j) => (
                        <span key={j} className="col-span-2">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${getRatingStyle(val)}`}>{val || '—'}</span>
                        </span>
                      ))}
                      <div className="col-span-2 flex justify-end">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${getRatingStyle(t.eficacia)}`}>{t.eficacia || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── 4. Idioma / Certificações ─────────────────────── */}
            {(member.idioma || member.certificacoes) && (
              <section className="px-8 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Idiomas & Certificações</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {member.idioma && (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl shadow-sm">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      {member.idioma}{member.nivel_idioma ? ` · ${member.nivel_idioma}` : ''}
                    </span>
                  )}
                  {member.certificacoes && (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl shadow-sm">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      {member.certificacoes}
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* ── 5. Avaliação do Gestor ────────────────────────── */}
            {(member.fit_cultural || member.mapa_sucessao || member.risco_perda) && (
              <section className="px-8 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Avaliação Estratégica do Gestor</h3>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {[
                    { label: 'Fit Cultural', value: parseShortLabel(member.fit_cultural) },
                    { label: 'Mapa de Sucessão', value: parseShortLabel(member.mapa_sucessao) },
                    { label: 'Risco de Perda', value: parseShortLabel(member.risco_perda) },
                    { label: 'Impacto de Saída', value: parseShortLabel(member.impacto_saida) },
                  ].filter(r => r.value && r.value !== '—').map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs font-bold text-gray-500">{row.label}</span>
                      <span className="text-xs font-bold text-gray-800 text-right max-w-[60%] truncate">{row.value}</span>
                    </div>
                  ))}
                  {member.comentarios_gestor && (
                    <div className="px-5 py-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Comentário do Gestor</p>
                      <p className="text-xs text-gray-600 leading-relaxed italic">"{member.comentarios_gestor}"</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── 6. Talento Oculto ─────────────────────────────── */}
            <section className="px-8 pb-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Análise de Talento Oculto · IA</h3>
              </div>

              {talent.hasTalent ? (
                <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/5 blur-3xl rounded-full pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <div className="w-7 h-7 bg-amber-400/20 border border-amber-400/30 rounded-xl flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </div>
                    <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Potencial Não Explorado Identificado</span>
                  </div>

                  {/* Suggestion text */}
                  <p className="text-sm text-gray-200 leading-relaxed mb-5 relative z-10">
                    {talent.suggestion}
                  </p>

                  {/* Potential areas */}
                  <div className="flex flex-wrap gap-2 mb-5 relative z-10">
                    {talent.potentialAreas.map((area, i) => (
                      <span key={i} className="text-[10px] font-black bg-purple-500/20 border border-purple-400/30 text-purple-300 px-2.5 py-1 rounded-full">
                        {area}
                      </span>
                    ))}
                  </div>

                  {/* Evidence list */}
                  <div className="border-t border-white/10 pt-4 relative z-10">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Evidências que embasaram esta análise</p>
                    <div className="space-y-2.5">
                      {talent.signals.map((sig, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-purple-300 mb-0.5">{sig.tipo}</p>
                            <p className="text-xs text-gray-400 leading-relaxed">{sig.descricao}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <p className="mt-4 text-[9px] text-gray-600 italic relative z-10">
                    Esta é uma hipótese sugerida pela IA com base nos dados disponíveis. Recomendamos explorar em uma conversa de desenvolvimento, não como direcionamento definitivo.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">Sinais insuficientes para sugestão de talento oculto no momento.</p>
                  <p className="text-xs text-gray-300 mt-1">Mais dados de treinamentos e avaliações ajudam a IA a identificar potenciais.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
};

export default CareerDetailPanel;
