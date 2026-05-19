import React from 'react';
import { LayoutDashboard, User, Target, TrendingUp, Award, MessageSquare, BarChart2, Sparkles } from 'lucide-react';

interface SidebarProps {
  onGenerateReport: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
  userName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onGenerateReport, currentView, onViewChange, userName }) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-50">
      <div className="p-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-gray-900 font-extrabold text-base leading-none tracking-tight">Inova Skill</h1>
            <p className="text-primary-600 text-[10px] uppercase tracking-widest font-black mt-1">HR Platform</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="space-y-1">
          <button 
            onClick={() => onViewChange('dashboard')}
            className={currentView === 'dashboard' ? 'sidebar-link-active w-full text-left' : 'sidebar-link w-full text-left'}
          >
            <LayoutDashboard className="w-5 h-5 mr-3 shrink-0" />
            Início
          </button>
          
          <button className="sidebar-link w-full text-left opacity-60 cursor-not-allowed">
            <User className="w-5 h-5 mr-3 shrink-0" />
            Meu Perfil
          </button>

          <button 
            onClick={() => onViewChange('team')}
            className={currentView === 'team' ? 'sidebar-link-active w-full text-left' : 'sidebar-link w-full text-left'}
          >
            <Target className="w-5 h-5 mr-3 shrink-0" />
            PDI
          </button>

          <button className="sidebar-link w-full text-left opacity-60 cursor-not-allowed">
            <TrendingUp className="w-5 h-5 mr-3 shrink-0" />
            Carreira
          </button>

          <button className="sidebar-link w-full text-left opacity-60 cursor-not-allowed">
            <Award className="w-5 h-5 mr-3 shrink-0" />
            Experiências
          </button>

          <button className="sidebar-link w-full text-left opacity-60 cursor-not-allowed">
            <MessageSquare className="w-5 h-5 mr-3 shrink-0" />
            Feedback e 1:1
          </button>

          <button 
            onClick={() => onViewChange('dashboard')}
            className="sidebar-link w-full text-left opacity-60 cursor-not-allowed"
          >
            <BarChart2 className="w-5 h-5 mr-3 shrink-0" />
            Indicadores
          </button>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto p-6">
        <button 
          onClick={onGenerateReport}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 mb-6 shadow-md shadow-primary-600/10"
        >
          <Sparkles className="w-4 h-4" />
          Gerar Relatório
        </button>

        <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100 font-black text-primary-600 text-sm shadow-sm">
            {userName ? userName.split(' ').map(n => n[0]).join('').substring(0, 2) : 'CL'}
          </div>
          <div className="overflow-hidden">
            <p className="text-gray-900 font-bold text-sm truncate">{userName || 'Carlos Lima'}</p>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-black mt-0.5">Gestor de Inovação</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
