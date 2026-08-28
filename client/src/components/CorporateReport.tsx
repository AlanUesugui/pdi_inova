import React from 'react';

interface CorporateReportProps {
  user: any;
  stats: any;
  insight: string;
  radarAverages: number[];
}

const CorporateReport: React.FC<CorporateReportProps> = ({ user, stats, insight, radarAverages }) => {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const categories = ["Liderança", "Tech", "Soft Skills", "Agile", "Negócio"];

  return (
    <div className="hidden print:block bg-white w-full max-w-[210mm] min-h-[297mm] mx-auto p-12 text-gray-900 font-sans">
      {/* Header Corporativo */}
      <div className="border-b-4 border-[#1E4382] pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#1E4382] uppercase tracking-tight">Relatório Executivo</h1>
          <h2 className="text-lg font-bold text-gray-500 mt-1">Performance e Plano de Desenvolvimento (PDI)</h2>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-800">Gerado por: {user?.name || 'Gestor'}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">{currentDate}</p>
          <div className="mt-4 text-[#1E4382] font-black text-xl tracking-widest">ISA PLATFORM</div>
        </div>
      </div>

      {/* Resumo Executivo (IA) */}
      <div className="mb-10">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-2">Diagnóstico Executivo (IA)</h3>
        <div className="bg-gray-50 border-l-4 border-[#1E4382] p-5 rounded-r-lg">
          <p className="text-sm font-medium text-gray-700 leading-relaxed">
            {insight || "Nenhum insight gerado para este ciclo."}
          </p>
        </div>
      </div>

      {/* Indicadores Globais */}
      <div className="mb-10">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">Indicadores Globais da Equipe</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-gray-200 p-4 rounded-xl text-center bg-gray-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Membros Ativos</p>
            <p className="text-2xl font-black text-[#1E4382] mt-2">{stats.activeMembersCount}</p>
          </div>
          <div className="border border-gray-200 p-4 rounded-xl text-center bg-gray-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">eNPS</p>
            <p className="text-2xl font-black text-[#1E4382] mt-2">{stats.eNPS}</p>
          </div>
          <div className="border border-gray-200 p-4 rounded-xl text-center bg-gray-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Taxa de Retenção</p>
            <p className="text-2xl font-black text-[#1E4382] mt-2">{stats.retentionRate}%</p>
          </div>
          <div className="border border-gray-200 p-4 rounded-xl text-center bg-gray-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mood Avg</p>
            <p className="text-2xl font-black text-[#1E4382] mt-2">{stats.moodAvg}/5</p>
          </div>
        </div>
      </div>

      {/* Matriz de Competências */}
      <div className="mb-10">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">Matriz de Competências (Média vs Target)</h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase font-black text-gray-500">
              <tr>
                <th className="px-6 py-3 border-b border-gray-200">Competência</th>
                <th className="px-6 py-3 border-b border-gray-200 text-center">Nível Média do Time</th>
                <th className="px-6 py-3 border-b border-gray-200 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => {
                const val = (radarAverages[idx] * 100).toFixed(1);
                const isWarning = radarAverages[idx] < 0.7;
                return (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4 font-bold text-gray-800">{cat}</td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">{val}%</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${isWarning ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isWarning ? 'Atenção' : 'Adequado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engajamento em Ações de Desenvolvimento */}
      <div className="mb-10">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">Eficácia em Ações de Desenvolvimento</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-sm font-bold text-gray-600">Workshops Técnicos</span>
            <span className="text-sm font-black text-[#1E4382]">{stats.workshopsRate}%</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-sm font-bold text-gray-600">Programas de Mentoria</span>
            <span className="text-sm font-black text-[#1E4382]">{stats.mentoringRate}%</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-sm font-bold text-gray-600">Cursos Externos</span>
            <span className="text-sm font-black text-[#1E4382]">{stats.coursesRate}%</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-sm font-bold text-gray-600">Certificações</span>
            <span className="text-sm font-black text-[#1E4382]">{stats.certsRate}%</span>
          </div>
        </div>
      </div>

      {/* Footer corporativo */}
      <div className="mt-16 pt-6 border-t-2 border-gray-200 text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Documento Interno Confidencial • ISA Platform © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default CorporateReport;
