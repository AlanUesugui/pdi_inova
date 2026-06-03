import React from 'react';
import { X, BookOpen, Target, Activity, Award } from 'lucide-react';
import { getDynamicProgressColor } from '../utils/colors';

export interface PDITraining {
  treinamento_nome: string;
  conhecimento: string;
  aplicacao: string;
  desempenho: string;
  eficacia: string;
  score: number;
}

interface TrainingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaboratorName: string;
  collaboratorAvatar: string;
  pdiHistory: PDITraining[];
  pdiAverage: number;
}

const TrainingHistoryModal: React.FC<TrainingHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  collaboratorName, 
  collaboratorAvatar, 
  pdiHistory, 
  pdiAverage 
}) => {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-primary-600 bg-primary-50 border-primary-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
              <img src={collaboratorAvatar} alt={collaboratorName} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">Histórico de PDI</h2>
              <p className="text-sm font-medium text-gray-500">{collaboratorName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Global Average Hero */}
        <div className="p-8 bg-gradient-to-b from-gray-50/50 to-white border-b border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-10 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-10 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
          
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 relative z-10">Média Global de Desempenho</p>
          <div className="flex items-end gap-2 relative z-10">
            <span className="text-6xl font-black text-gray-900 tracking-tighter">{pdiAverage}</span>
            <span className="text-2xl font-bold text-gray-400 mb-2">%</span>
          </div>
          
          <div className="w-full max-w-md mt-6 bg-gray-100 h-2.5 rounded-full overflow-hidden relative z-10">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pdiAverage}%`, backgroundColor: getDynamicProgressColor(pdiAverage) }}
            ></div>
          </div>
        </div>

        {/* List of Trainings */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          <div className="space-y-4">
            {pdiHistory.length > 0 ? pdiHistory.map((treinamento, index) => (
              <div key={index} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm">{treinamento.treinamento_nome}</h4>
                      <p className="text-xs font-medium text-gray-400 mt-0.5">Treinamento Concluído</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 ${getScoreColor(treinamento.score)}`}>
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-black">{treinamento.score}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Conhecimento</p>
                    <p className="text-xs font-bold text-gray-900">{treinamento.conhecimento}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Aplicação</p>
                    <p className="text-xs font-bold text-gray-900">{treinamento.aplicacao}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Desempenho</p>
                    <p className="text-xs font-bold text-gray-900">{treinamento.desempenho}</p>
                  </div>
                  <div className={`rounded-xl p-3 border ${treinamento.eficacia === 'Sim' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${treinamento.eficacia === 'Sim' ? 'text-emerald-600' : 'text-rose-600'}`}>Eficácia</p>
                    <div className="flex items-center gap-1">
                      <Target className={`w-3.5 h-3.5 ${treinamento.eficacia === 'Sim' ? 'text-emerald-500' : 'text-rose-500'}`} />
                      <p className={`text-xs font-bold ${treinamento.eficacia === 'Sim' ? 'text-emerald-900' : 'text-rose-900'}`}>
                        {treinamento.eficacia === 'Sim' ? 'Positiva' : 'Negativa'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm">Nenhum treinamento PDI registrado.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrainingHistoryModal;
