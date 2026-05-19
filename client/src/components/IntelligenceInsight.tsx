import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntelligenceInsightProps {
  text: string;
  prediction?: string;
  isLoading?: boolean;
}

const IntelligenceInsight: React.FC<IntelligenceInsightProps> = ({ text, prediction, isLoading }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (isLoading) {
      setDisplayedText('');
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text, isLoading]);

  return (
    <div className="ai-card flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Trajetória de Crescimento</p>
          <h2 className="text-xl font-black flex items-center gap-2">
            Insight de Inteligência
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          </h2>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-primary-500 blur-lg opacity-20 animate-pulse"></div>
          <TrendingUp className="w-8 h-8 text-primary-400 relative z-10" />
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-white/10 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse"></div>
            </motion.div>
          ) : (
            <motion.p 
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-300 leading-relaxed font-medium text-sm"
            >
              {displayedText}
              <span className="inline-block w-2 h-4 bg-primary-500 ml-1 animate-pulse"></span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 space-y-4">
        {prediction && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-bold">Crescimento Previsto</span>
            <span className="text-emerald-400 font-black">{prediction}</span>
          </div>
        )}
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '85%' }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="bg-gradient-to-r from-primary-600 to-primary-400 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          />
        </div>
        
        <button className="w-full bg-white text-navy-900 font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 text-xs">
          Ver Modelo de Previsão
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default IntelligenceInsight;
