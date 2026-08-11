import React, { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle } from 'lucide-react';

export interface InfoDisclaimerProps {
  title: string;
  contextDescription: string;
  calculationMethod?: string;
  details?: Array<{ label: string; value: string }>;
  iconType?: 'info' | 'help';
  size?: 'sm' | 'md' | 'lg';
  position?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const InfoDisclaimer: React.FC<InfoDisclaimerProps> = ({
  title,
  contextDescription,
  calculationMethod,
  details,
  iconType = 'info',
  size = 'sm',
  position = 'auto',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [computedPosition, setComputedPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  const togglePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    if (position !== 'auto') {
      setComputedPosition(position);
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Smart auto-positioning based on screen edges
    if (rect.bottom + 220 > viewportHeight) {
      setComputedPosition('top');
    } else if (rect.right + 300 > viewportWidth) {
      setComputedPosition('left');
    } else {
      setComputedPosition('bottom');
    }
  }, [isOpen, position]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const IconComponent = iconType === 'help' ? HelpCircle : Info;
  const iconSizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  const positionClasses = {
    top: 'bottom-full mb-2 right-0 origin-bottom-right',
    bottom: 'top-full mt-2 right-0 origin-top-right',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2 origin-right',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2 origin-left'
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        onClick={togglePopover}
        type="button"
        aria-label={`Informações sobre ${title}`}
        aria-expanded={isOpen}
        className="p-1 rounded-full text-gray-400 hover:text-[#1E4382] hover:bg-blue-50/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1E4382]/20"
      >
        <IconComponent className={`${iconSizeClass} transition-colors duration-200`} />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          className={`absolute z-50 w-72 md:w-80 bg-white rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-gray-100 text-left animate-in fade-in zoom-in-95 duration-200 ${positionClasses[computedPosition]}`}
        >
          {/* Header Title */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
            <h4 className="text-xs font-black text-gray-900 tracking-tight uppercase">
              {title}
            </h4>
            <span className="text-[9px] font-bold text-[#1E4382] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Disclaimer
            </span>
          </div>

          {/* Context Description */}
          <p className="text-xs text-gray-600 font-medium leading-relaxed mb-3">
            {contextDescription}
          </p>

          {/* Calculation Method Box */}
          {calculationMethod && (
            <div className="bg-gray-50/90 rounded-xl p-2.5 border border-gray-100 mb-2.5 space-y-1">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
                📐 Regra de Cálculo / Fórmula:
              </span>
              <p className="text-[11px] font-semibold text-gray-800 leading-snug font-mono bg-white/80 p-1.5 rounded-lg border border-gray-200/60">
                {calculationMethod}
              </p>
            </div>
          )}

          {/* Key / Legend details if provided */}
          {details && details.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-gray-50">
              {details.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] font-semibold">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-gray-900 font-extrabold bg-gray-100 px-1.5 py-0.5 rounded">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InfoDisclaimer;
