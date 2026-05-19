import React from 'react';
import { Rocket, Clock, Users, Zap } from 'lucide-react';

interface MetricProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}

const Metric: React.FC<MetricProps> = ({ icon: Icon, label, value, subValue }) => (
  <div className="glass-card p-5 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-transform">
    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary-600" />
    </div>
    <div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-black text-gray-900">{value}</span>
        {subValue && <span className="text-emerald-500 text-xs font-bold">{subValue}</span>}
      </div>
    </div>
  </div>
);

const GoalVelocity: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Metric 
        icon={Rocket} 
        label="Avaliações Pendentes" 
        value="14" 
      />
      <Metric 
        icon={Clock} 
        label="Última Sincronização" 
        value="2h atrás" 
      />
      <Metric 
        icon={Users} 
        label="Total de Colaboradores" 
        value="158" 
      />
      <Metric 
        icon={Zap} 
        label="Velocidade de Metas Ativas" 
        value="Rápida" 
        subValue="+12%"
      />
    </div>
  );
};

export default GoalVelocity;
