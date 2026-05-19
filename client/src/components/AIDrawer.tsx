import React from 'react';
import { X, Sparkles, Send, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIDrawer: React.FC<AIDrawerProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-[60]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-[400px] bg-white shadow-2xl z-[70] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-navy-900 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-lg">PDI Assistant</h2>
                  <p className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">Análise de Contexto de Time</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
                <p className="text-primary-800 text-sm leading-relaxed">
                  <span className="font-black block mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary-600" />
                    Contexto Carregado!
                  </span>
                  Identifiquei 3 colaboradores com reviews pendentes nesta semana. Analisei os gaps de competência de cada um para otimizar suas conversas.
                </p>
              </div>

              {/* Suggestions */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Tópicos Sugeridos</h3>
                
                {[
                  { name: 'Sarah Chen', topic: 'Mitigação de risco técnico e estratégia de escala.' },
                  { name: 'Marcus Reed', topic: 'Transição para arquitetura e liderança de equipe.' },
                  { name: 'Thomas Klein', topic: 'Consolidação de processos e KPI de eficiência.' }
                ].map((s, i) => (
                  <div key={i} className="p-4 border border-gray-100 rounded-xl hover:border-primary-200 transition-colors cursor-pointer group">
                    <p className="text-xs font-black text-primary-600 mb-1">{s.name}</p>
                    <p className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">{s.topic}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Perguntar ao assistente..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIDrawer;
