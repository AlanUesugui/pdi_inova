import React from 'react';
import { X, Calendar, Database, FileText, Sparkles, BookOpen } from 'lucide-react';

export interface ExplainabilityData {
  title: string;
  indicatorName: string;
  formulaDescription: string;
  breakdownItems: string[];
  period: string;
  rules: string[];
  lastUpdate: string;
  dataSource: string;
  aiDetails?: {
    prompt?: string;
    dataUsed?: string[];
    limitations?: string;
    confidence?: string;
    insufficientData?: string;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: ExplainabilityData | null;
}

const ExplainabilityModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] transition-transform transform duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide">{data.title}</h2>
              <p className="text-white/75 text-[10px] uppercase tracking-wider font-bold mt-0.5">{data.indicatorName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Calculation Block */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-primary-600" />
              Como este resultado foi calculado?
            </h3>
            
            {/* Formula / Desc */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-600 leading-relaxed font-medium">
              {data.formulaDescription}
            </div>

            {/* Breakdown Checklist */}
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Itens Considerados no Cálculo</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.breakdownItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-emerald-50/50 border border-emerald-100/50 p-2.5 rounded-xl text-xs font-bold text-emerald-800 leading-normal">
                    <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Business Rules & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 shadow-sm">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                Regras de Negócio Aplicadas
              </p>
              <ul className="space-y-1.5 text-xs font-bold text-gray-600">
                {data.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Database className="w-3.5 h-3.5 text-gray-400" />
                  Origem dos Dados
                </p>
                <p className="text-xs font-black text-gray-700">{data.dataSource}</p>
              </div>
              <div className="border-t border-gray-50 pt-2 flex justify-between text-[10px] text-gray-400 font-bold">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Período: {data.period}
                </span>
                <span>Atualizado: {data.lastUpdate}</span>
              </div>
            </div>
          </div>

          {/* AI Explainability (if applicable) */}
          {data.aiDetails && (
            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-black text-purple-900 flex items-center gap-2 border-b border-purple-100 pb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Como a IA chegou nesta conclusão?
              </h3>
              
              {data.aiDetails.prompt && (
                <div className="space-y-1">
                  <p className="text-[10px] text-purple-400 font-black uppercase tracking-wider">Prompt de Instrução</p>
                  <p className="text-xs font-medium text-purple-800 bg-purple-50 border border-purple-100/50 rounded-xl p-3 leading-relaxed italic max-h-24 overflow-y-auto">
                    "{data.aiDetails.prompt}"
                  </p>
                </div>
              )}

              {data.aiDetails.dataUsed && (
                <div className="space-y-1">
                  <p className="text-[10px] text-purple-400 font-black uppercase tracking-wider">Variáveis Consideradas pela IA</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.aiDetails.dataUsed.map((variable, idx) => (
                      <span key={idx} className="text-[10px] font-black bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-purple-900 border-t border-purple-100/50 pt-3">
                {data.aiDetails.limitations && (
                  <div>
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-wider mb-0.5">Limitações do Modelo</p>
                    <p className="text-xs font-medium text-purple-800 leading-normal">{data.aiDetails.limitations}</p>
                  </div>
                )}
                <div className="flex flex-col justify-between items-end text-right">
                  <div>
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-wider mb-0.5">Confiança da Análise</p>
                    <span className="text-base font-black text-purple-700">{data.aiDetails.confidence || '92%'}</span>
                  </div>
                  {data.aiDetails.insufficientData && (
                    <p className="text-[9px] text-rose-500 font-bold mt-1">Dados Ausentes: {data.aiDetails.insufficientData}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end">
          <button 
            onClick={onClose} 
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-black text-xs px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityModal;
