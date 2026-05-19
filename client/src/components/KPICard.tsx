import React from 'react';
import { TrendingUp, AlertTriangle, Award } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  benchmark?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, trend, type, benchmark }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'danger': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'info': return <Award className="w-4 h-4 text-primary-500" />;
    }
  };

  const getBadgeClass = () => {
    switch (type) {
      case 'success': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'warning': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'danger': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'info': return 'bg-primary-50 text-primary-600 border-primary-100';
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col h-full group hover:translate-y-[-4px] transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${getBadgeClass()}`}>
            {getIcon()}
            {trend}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-gray-900">{value}</span>
        {subtitle && <span className="text-gray-400 text-sm font-medium">{subtitle}</span>}
      </div>

      <div className="mt-auto pt-6">
        {type === 'success' && (
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary-500 h-full rounded-full transition-all duration-1000" style={{ width: value }}></div>
          </div>
        )}
        {benchmark && (
          <div className="flex justify-between items-center text-xs mt-2">
            <span className="text-gray-500 font-medium">Média de Mercado: <span className="text-gray-900 font-bold">{benchmark}</span></span>
            <div className="w-24 bg-gray-100 h-1 rounded-full overflow-hidden">
              <div className="bg-primary-500 h-full rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        )}
        {type === 'danger' && (
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ring-2 ring-gray-50 bg-gray-200 overflow-hidden -ml-${i > 1 ? '2' : '0'}`}>
                <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-gray-50 bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 -ml-2">
              +12
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
