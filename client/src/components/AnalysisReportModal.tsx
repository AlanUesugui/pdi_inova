import React from 'react';
import { X, CheckCircle, Lightbulb, FileText, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface AnalysisReport {
  nome: string;
  cargo: string;
  departamento: string;
  competencias_exigidas: string[];
  treinamentos_relacionados: string[];
  pontos_fortes: string[];
  pontos_de_atencao: string[];
  evidencias: string[];
  score: number;
  classificacao_final: string;
  recomendacoes: string[];
}

interface AnalysisReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AnalysisReport | null;
  isLoading: boolean;
}

const AnalysisReportModal: React.FC<AnalysisReportModalProps> = ({ isOpen, onClose, report, isLoading }) => {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-primary-500 bg-primary-50 border-primary-200';
    if (score >= 50) return 'text-amber-500 bg-amber-50 border-amber-200';
    return 'text-rose-500 bg-rose-50 border-rose-200';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-primary-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Análise de Requisitos de Cargo</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Inteligência PDI Hub</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-primary-600 font-bold text-sm animate-pulse">Processando dados e gerando insights...</p>
            </div>
          ) : report ? (
            <>
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black text-gray-900">{report.nome}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">{report.cargo}</span>
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">{report.departamento}</span>
                  </div>
                </div>
                
                {/* Score Circular Indicator */}
                <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border ${getScoreColor(report.score)}`}>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Aderência ao Cargo</p>
                    <p className="text-3xl font-black">{report.score}%</p>
                  </div>
                  <div className="h-10 w-px bg-current opacity-20"></div>
                  <p className="font-bold text-sm max-w-[120px] leading-tight">{report.classificacao_final}</p>
                </div>
              </div>

              {/* Score Bar */}
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(report.score)}`} 
                  style={{ width: `${report.score}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Competencies */}
                  <div className="glass-card p-5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <h4 className="font-black text-gray-900 text-sm uppercase tracking-wider">Competências Exigidas</h4>
                    </div>
                    <ul className="space-y-2">
                      {report.competencias_exigidas.map((comp, i) => (
                        <li key={i} className="text-sm font-medium text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                          {comp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Related Trainings */}
                  <div className="glass-card p-5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-primary-500" />
                      <h4 className="font-black text-gray-900 text-sm uppercase tracking-wider">Treinamentos Realizados</h4>
                    </div>
                    {report.treinamentos_relacionados.length > 0 ? (
                      <ul className="space-y-2">
                        {report.treinamentos_relacionados.map((treinamento, i) => (
                          <li key={i} className="text-sm font-medium text-gray-600 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0"></span>
                            {treinamento}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Nenhum treinamento PDI registrado.</p>
                    )}
                  </div>
                  
                  {/* Evidences */}
                  <div className="glass-card p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Info className="w-5 h-5 text-indigo-500" />
                      <h4 className="font-black text-gray-900 text-sm uppercase tracking-wider">Evidências do Gestor</h4>
                    </div>
                    <ul className="space-y-3">
                      {report.evidencias.map((ev, i) => (
                        <li key={i} className="text-sm font-medium text-gray-600 italic border-l-2 border-indigo-200 pl-3">
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Strengths */}
                  <div className="glass-card p-5 rounded-xl border border-emerald-100 bg-emerald-50/30">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-black text-gray-900 text-sm uppercase tracking-wider">Pontos Fortes</h4>
                    </div>
                    <ul className="space-y-2">
                      {report.pontos_fortes.length > 0 ? report.pontos_fortes.map((ponto, i) => (
                        <li key={i} className="text-sm font-bold text-emerald-800 flex items-start gap-2">
                          <span className="text-emerald-500 font-bold mt-[-2px]">+</span>
                          {ponto}
                        </li>
                      )) : (
                        <li className="text-sm text-gray-500">Nenhum destaque mapeado no momento.</li>
                      )}
                    </ul>
                  </div>

                  {/* Attention Points */}
                  <div className="glass-card p-5 rounded-xl border border-rose-100 bg-rose-50/30">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-5 h-5 text-rose-600" />
                      <h4 className="font-black text-gray-900 text-sm uppercase tracking-wider">Pontos de Atenção</h4>
                    </div>
                    <ul className="space-y-2">
                      {report.pontos_de_atencao.length > 0 ? report.pontos_de_atencao.map((ponto, i) => (
                        <li key={i} className="text-sm font-bold text-rose-800 flex items-start gap-2">
                          <span className="text-rose-500 font-bold mt-[-2px]">-</span>
                          {ponto}
                        </li>
                      )) : (
                        <li className="text-sm text-gray-500">Nenhum ponto de atenção crítico detectado.</li>
                      )}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-navy-900 p-6 rounded-xl text-white relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 blur-3xl rounded-full"></div>
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      <h4 className="font-black text-sm uppercase tracking-wider">Recomendações da IA</h4>
                    </div>
                    <ul className="space-y-3 relative z-10">
                      {report.recomendacoes.map((rec, i) => (
                        <li key={i} className="text-sm font-medium text-gray-200 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-500">Nenhum relatório disponível.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisReportModal;
