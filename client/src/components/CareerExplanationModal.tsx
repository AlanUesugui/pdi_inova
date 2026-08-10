import React from 'react';
import { X, CheckCircle2, AlertTriangle, HelpCircle, Database, FileText, ShieldCheck, Target } from 'lucide-react';

export interface EvidenceTableRow {
  factor: string;
  dataFound: string;
  impact: string;
}

export interface SourceUsedRow {
  source: string;
  used: boolean;
}

export type ConfidenceLabel = 'Alta confiança' | 'Confiança moderada' | 'Confiança limitada' | 'Sem evidência suficiente';

export interface CareerExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  resultText: string;
  resultBadgeClass?: string;
  evidences: string[];
  interpretation: string;
  managementMeaning?: string;
  whyItMatters?: string;
  limitations?: string[];
  confidence: { label: ConfidenceLabel; class: string };
  evidenceTable?: EvidenceTableRow[];
  sourcesUsed?: SourceUsedRow[];
  disclaimer?: string;
}

const CareerExplanationModal: React.FC<CareerExplanationModalProps> = ({
  isOpen,
  onClose,
  title,
  resultText,
  resultBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200',
  evidences,
  interpretation,
  managementMeaning = 'Esta leitura orienta conversas de desenvolvimento e alinhamento de expectativas entre gestor e liderado.',
  whyItMatters = 'Permite identificar direcionamentos de carreira com suporte em fatos organizacionais.',
  limitations = [],
  confidence,
  evidenceTable = [],
  sourcesUsed = [],
  disclaimer = 'A análise funciona como apoio técnico à decisão do gestor e do RH. Nenhuma promoção ou movimentação é automatizada.'
}) => {
  const [showDataDetails, setShowDataDetails] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/65 backdrop-blur-sm animate-in fade-in duration-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-700">Rastreabilidade & Explicabilidade</span>
              <h3 className="text-base font-extrabold text-gray-900 leading-snug">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* Result & Confidence Banner */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">1. O que identificamos (Conclusão)</span>
              <span className={`inline-block text-xs font-black px-3 py-1 mt-1 rounded-full border ${resultBadgeClass}`}>
                {resultText}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Nível de Confiança</span>
              <span className={`inline-block text-xs font-extrabold px-3 py-1 mt-1 rounded-full border ${confidence.class}`}>
                {confidence.label}
              </span>
            </div>
          </div>

          {/* 2. Por que identificamos isso (Evidências) */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Por que identificamos isso (Evidências encontradas)
            </h4>
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/80 space-y-2">
              {evidences.map((ev, idx) => (
                <div key={idx} className="flex items-start gap-2 text-gray-700 font-medium">
                  <span className="text-emerald-600 font-black shrink-0">✓</span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Como as evidências sustentam essa conclusão */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              3. Raciocínio & Sustentação dos Dados
            </h4>
            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-purple-950 font-medium leading-relaxed">
              {interpretation}
            </div>
          </div>

          {/* 4. O que isso significa para a gestão */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              4. O que isso significa para a gestão?
            </h4>
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-blue-950 font-medium leading-relaxed">
              {managementMeaning}
            </div>
          </div>

          {/* Por que isso importa para a carreira */}
          {whyItMatters && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-100 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">💡 Por que isso importa para a carreira?</span>
              <p className="text-purple-950 font-medium leading-normal text-[11px]">{whyItMatters}</p>
            </div>
          )}

          {/* Matriz Estruturada de Impacto */}
          {evidenceTable.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-700" />
                Fatores e Impacto na Análise
              </h4>
              <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-gray-50 text-gray-400 font-extrabold uppercase border-b border-gray-100">
                    <tr>
                      <th className="p-3">Fator Analisado</th>
                      <th className="p-3">Dado Encontrado</th>
                      <th className="p-3">Impacto na Análise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                    {evidenceTable.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 font-bold text-gray-900">{row.factor}</td>
                        <td className="p-3 text-gray-600">{row.dataFound}</td>
                        <td className="p-3 text-purple-700 font-bold">{row.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. O que ainda precisa ser observado (Limitações) */}
          {limitations.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                5. O que ainda precisa ser observado (Limitações / Oportunidade de precisão)
              </h4>
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-1.5 text-amber-900 font-medium">
                {limitations.map((lim, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px]">
                    <span className="text-amber-600 font-bold shrink-0">•</span>
                    <span>{lim}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dados Utilizados (Área Expansível) */}
          {sourcesUsed.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowDataDetails(!showDataDetails)}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5"
              >
                <span>{showDataDetails ? '▲ Ocultar fontes de dados' : '▼ Ver dados e fontes utilizados nesta análise'}</span>
              </button>

              {showDataDetails && (
                <div className="mt-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-2 text-[11px]">
                  <div className="grid grid-cols-2 gap-2 font-bold text-gray-400 border-b border-gray-100 pb-1.5 uppercase text-[9px]">
                    <span>Fonte de Dados</span>
                    <span className="text-right">Utilizado?</span>
                  </div>
                  {sourcesUsed.map((src, idx) => (
                    <div key={idx} className="flex justify-between items-center text-gray-700">
                      <span className="font-medium">{src.source}</span>
                      <span className={`font-black ${src.used ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {src.used ? '✓ Utilizado' : '— Não informado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer Footer */}
          <div className="bg-gray-100/70 p-3.5 rounded-2xl border border-gray-200 text-[10px] text-gray-500 font-medium leading-normal flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span>{disclaimer}</span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all shadow-sm active:scale-95"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};

export default CareerExplanationModal;
