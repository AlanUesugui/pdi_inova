import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, X, Compass, MousePointerClick } from 'lucide-react';

export interface TourStep {
  id: string;
  targetId?: string;
  title: string;
  description: string;
  requiresClick?: boolean;
  targetView?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const TOUR_STEPS: TourStep[] = [
  // ── WELCOME ─────────────────────────────────────────────────────────────
  {
    id: 'step-welcome',
    title: 'Bem-vindo à Plataforma ISA!',
    description: 'Vamos fazer um tour detalhado para você entender o que cada card faz em todas as áreas da aplicação.',
    placement: 'center'
  },

  // ── PAGE 1: INÍCIO (DASHBOARD) ──────────────────────────────────────────
  {
    id: 'step-sidebar-inicio',
    targetId: 'tour-sidebar-inicio',
    title: 'Navegação: Início',
    description: 'Clique na aba Início para ver o dashboard analítico geral.',
    requiresClick: true,
    targetView: 'dashboard',
    placement: 'right'
  },
  {
    id: 'step-card-ai-insight',
    targetId: 'tour-card-ai-insight',
    title: 'Card: Insight da IA',
    description: 'Este card consolida os dados de PDI de toda a equipe e gera uma leitura executiva automatizada com recomendações práticas para a sua gestão.',
    requiresClick: false,
    targetView: 'dashboard',
    placement: 'right'
  },
  {
    id: 'step-card-skill-matrix',
    targetId: 'tour-card-skill-matrix',
    title: 'Card: Skill Matrix (Radar Chart)',
    description: 'Compara a média de proficiência real do seu time em 5 eixos (Liderança, Tech, Soft Skills, Agile, Negócio) contra a meta oficial da área.',
    requiresClick: false,
    targetView: 'dashboard',
    placement: 'bottom'
  },
  {
    id: 'step-card-team-stats',
    targetId: 'tour-card-team-stats',
    title: 'Card: Indicadores Globais de Capacitação',
    description: 'Exibe a contagem de liderados ativos e o nível de engajamento em workshops, mentorias, cursos externos e certificações.',
    requiresClick: false,
    targetView: 'dashboard',
    placement: 'right'
  },
  {
    id: 'step-card-ai-health',
    targetId: 'tour-card-ai-health',
    title: 'Card: Saúde do Time (AI Health)',
    description: 'Distribui os liderados nas faixas No Caminho (Healthy), Atenção (Attention) e Abaixo do Esperado (Risk) baseado na frequência de atualização dos PDIs.',
    requiresClick: false,
    targetView: 'dashboard',
    placement: 'top'
  },

  // ── PAGE 2: PDI ─────────────────────────────────────────────────────────
  {
    id: 'step-sidebar-pdi',
    targetId: 'tour-sidebar-pdi',
    title: 'Navegação: PDI',
    description: 'Clique na aba PDI para acessar a gestão do Plano de Desenvolvimento Individual.',
    requiresClick: true,
    targetView: 'team',
    placement: 'right'
  },
  {
    id: 'step-pdi-top-cards',
    targetId: 'tour-pdi-top-cards',
    title: 'Cards: Indicadores de Status da Equipe',
    description: 'Resumo executivo do total de liderados, total com avaliação concluída, PDIs em andamento e casos que exigem atenção imediata.',
    requiresClick: false,
    targetView: 'team',
    placement: 'bottom'
  },
  {
    id: 'step-pdi-macro-intelligence',
    targetId: 'tour-pdi-macro-intelligence',
    title: 'Card: Inteligência Executiva de PDI',
    description: 'Mapeia os maiores desvios de competências do time (gaps prioritários) e exibe a distribuição percentual das ações cadastradas.',
    requiresClick: false,
    targetView: 'team',
    placement: 'bottom'
  },
  {
    id: 'step-pdi-chart',
    targetId: 'tour-pdi-alignment-chart',
    title: 'Card: Alinhamento da Equipe ao Perfil/Cargo',
    description: 'Gráfico em anel dividindo a equipe em Mais Alinhados (>75%), Em Desenvolvimento (50-74%) e Menos Alinhados (<50%). Clique nos segmentos para filtrar o organograma.',
    requiresClick: false,
    targetView: 'team',
    placement: 'bottom'
  },

  // ── PAGE 3: CARREIRA ───────────────────────────────────────────────────
  {
    id: 'step-sidebar-career',
    targetId: 'tour-sidebar-career',
    title: 'Navegação: Carreira',
    description: 'Clique na aba Carreira para explorar o mapa de talentos e sucessão.',
    requiresClick: true,
    targetView: 'career',
    placement: 'right'
  },
  {
    id: 'step-career-distribution-card',
    targetId: 'tour-career-distribution-card',
    title: 'Card: Distribuição de Talentos e Carreira',
    description: 'Mapeia a matriz de maturidade do time: Sucessores Formais, Talentos Reconhecidos, Potencial de Desenvolvimento, Talentos Não Mapeados e Casos de Alto Risco de Saída.',
    requiresClick: false,
    targetView: 'career',
    placement: 'bottom'
  },

  // ── PAGE 4: FEEDBACK E 1:1 ─────────────────────────────────────────────
  {
    id: 'step-sidebar-feedback',
    targetId: 'tour-sidebar-feedback',
    title: 'Navegação: Feedback e 1:1',
    description: 'Clique na aba Feedback e 1:1 para gerenciar reuniões e feedbacks.',
    requiresClick: true,
    targetView: 'feedback',
    placement: 'right'
  },
  {
    id: 'step-feedback-donut-card',
    targetId: 'tour-feedback-donut-card',
    title: 'Card: Acompanhamento de 1:1 por Progresso',
    description: 'Gráfico e pílulas para filtrar a equipe por faixa de progresso de PDI e agendar encontros periódicos ou registrar feedbacks direcionados.',
    requiresClick: false,
    targetView: 'feedback',
    placement: 'bottom'
  },

  // ── EXPORTATION ────────────────────────────────────────────────────────
  {
    id: 'step-sidebar-report',
    targetId: 'tour-sidebar-report-btn',
    title: 'Ação: Exportação de Relatórios',
    description: 'Exporte relatórios consolidados em PDF com todos os dados gerenciais da sua equipe por este botão.',
    requiresClick: false,
    placement: 'right'
  }
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onComplete,
  currentView,
  onViewChange
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Reset step index whenever tour opens/re-opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Recalculate spotlight rectangle
  const updateTargetRect = () => {
    if (!currentStep || !currentStep.targetId) {
      setTargetRect(null);
      return;
    }
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Switch view if required by step
    if (currentStep?.targetView && currentView !== currentStep.targetView) {
      onViewChange(currentStep.targetView);
    }

    const timer = setTimeout(() => {
      updateTargetRect();
    }, 150);

    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [currentStepIndex, isOpen, currentView]);

  // Handle mandatory element click interaction
  useEffect(() => {
    if (!isOpen || !currentStep?.requiresClick || !currentStep?.targetId) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const targetEl = document.getElementById(currentStep.targetId!);
      if (targetEl && (targetEl.contains(e.target as Node) || e.target === targetEl)) {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          handleFinish();
        }
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [currentStepIndex, isOpen, currentStep]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setCurrentStepIndex(0);
    onComplete();
    onClose();
  };

  if (!isOpen || !currentStep) return null;

  const isModalCenter = currentStep.placement === 'center' || !currentStep.targetId || !targetRect;

  // Calculate tooltip placement offsets
  const getTooltipStyle = (): React.CSSProperties => {
    if (isModalCenter || !targetRect) return {};

    const padding = 16;
    let top = 0;
    let left = 0;

    switch (currentStep.placement) {
      case 'right':
        left = targetRect.right + padding;
        top = Math.max(16, targetRect.top + targetRect.height / 2 - 100);
        break;
      case 'left':
        left = targetRect.left - 380 - padding;
        top = Math.max(16, targetRect.top + targetRect.height / 2 - 100);
        break;
      case 'bottom':
        left = Math.max(16, Math.min(window.innerWidth - 400, targetRect.left + targetRect.width / 2 - 190));
        top = targetRect.bottom + padding;
        break;
      case 'top':
        left = Math.max(16, Math.min(window.innerWidth - 400, targetRect.left + targetRect.width / 2 - 190));
        top = targetRect.top - 200 - padding;
        break;
      default:
        left = targetRect.right + padding;
        top = targetRect.top;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: '380px',
      zIndex: 99999
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] overflow-hidden pointer-events-none">
        {/* Dark Overlay Mask */}
        {isModalCenter ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto"
          />
        ) : (
          targetRect && (
            <div className="fixed inset-0 z-[9991] pointer-events-none">
              {/* Top Backdrop */}
              <div
                className="absolute bg-slate-950/75 transition-all duration-300 pointer-events-auto"
                style={{ top: 0, left: 0, right: 0, height: `${Math.max(0, targetRect.top - 8)}px` }}
              />
              {/* Bottom Backdrop */}
              <div
                className="absolute bg-slate-950/75 transition-all duration-300 pointer-events-auto"
                style={{ top: `${targetRect.bottom + 8}px`, left: 0, right: 0, bottom: 0 }}
              />
              {/* Left Backdrop */}
              <div
                className="absolute bg-slate-950/75 transition-all duration-300 pointer-events-auto"
                style={{
                  top: `${Math.max(0, targetRect.top - 8)}px`,
                  left: 0,
                  width: `${Math.max(0, targetRect.left - 8)}px`,
                  height: `${targetRect.height + 16}px`
                }}
              />
              {/* Right Backdrop */}
              <div
                className="absolute bg-slate-950/75 transition-all duration-300 pointer-events-auto"
                style={{
                  top: `${Math.max(0, targetRect.top - 8)}px`,
                  left: `${targetRect.right + 8}px`,
                  right: 0,
                  height: `${targetRect.height + 16}px`
                }}
              />
            </div>
          )
        )}

        {/* Pulsing Highlight Box around target element */}
        {!isModalCenter && targetRect && (
          <div
            className="fixed pointer-events-none rounded-2xl border-2 border-[#1E4382] animate-tour-glow transition-all duration-300 z-[9992]"
            style={{
              top: `${targetRect.top - 8}px`,
              left: `${targetRect.left - 8}px`,
              width: `${targetRect.width + 16}px`,
              height: `${targetRect.height + 16}px`
            }}
          />
        )}

        {/* Floating Tooltip or Centered Welcome Modal */}
        {isModalCenter ? (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] pointer-events-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl border border-gray-100 relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#1E4382]/10 border border-[#1E4382]/20 flex items-center justify-center text-[#1E4382] mb-6">
                <Compass className="w-7 h-7" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-[#1E4382] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  Passo {currentStepIndex + 1} de {TOUR_STEPS.length}
                </span>
              </div>

              <h2 className="text-2xl font-black text-[#1E4382] tracking-tight mb-3">
                {currentStep.title}
              </h2>

              <p className="text-gray-600 text-sm font-medium leading-relaxed mb-8">
                {currentStep.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors px-2 py-1"
                >
                  Pular Tour
                </button>

                <button
                  onClick={handleNext}
                  className="bg-[#1E4382] hover:bg-[#153263] text-white font-bold py-3 px-6 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-[#1E4382]/20 active:scale-95 transition-all"
                >
                  <span>Iniciar Tour</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={getTooltipStyle()}
            className="bg-white rounded-[20px] p-6 shadow-2xl border border-gray-100 relative overflow-hidden pointer-events-auto"
          >
            {/* Header / Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black tracking-widest uppercase text-[#1E4382] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                Passo {currentStepIndex + 1} de {TOUR_STEPS.length}
              </span>
              <button
                onClick={onClose}
                className="text-gray-300 hover:text-gray-500 p-1 rounded-full transition-colors"
                title="Fechar Tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title */}
            <h3 className="text-lg font-black text-[#1E4382] tracking-tight mb-2">
              {currentStep.title}
            </h3>

            {/* Content */}
            <p className="text-gray-600 text-xs font-medium leading-relaxed mb-6">
              {currentStep.description}
            </p>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                onClick={onClose}
                className="text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Pular
              </button>

              {currentStep.requiresClick ? (
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200/60 animate-pulse">
                  <MousePointerClick className="w-4 h-4 text-amber-600" />
                  <span>Clique no elemento para avançar</span>
                </div>
              ) : (
                <button
                  onClick={handleNext}
                  className="bg-[#1E4382] hover:bg-[#153263] text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-[#1E4382]/20 active:scale-95 transition-all"
                >
                  <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Concluir Tour' : 'Avançar'}</span>
                  {currentStepIndex === TOUR_STEPS.length - 1 ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
