import React from 'react';
import { LayoutDashboard, Target, TrendingUp, MessageSquare, Sparkles, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  onGenerateReport: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
  userName?: string;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onGenerateReport, currentView, onViewChange, userName, onLogout }) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-50">
      <div className="p-6">
        {/* Sidebar Navigation */}
        <nav className="space-y-1 mt-6">
          <button
            id="tour-sidebar-inicio"
            onClick={() => onViewChange('dashboard')}
            className={currentView === 'dashboard' ? 'sidebar-link-active w-full text-left' : 'sidebar-link w-full text-left'}
          >
            <LayoutDashboard className="w-5 h-5 mr-3 shrink-0" />
            Início
          </button>

          <button
            id="tour-sidebar-pdi"
            onClick={() => onViewChange('team')}
            className={currentView === 'team' ? 'sidebar-link-active w-full text-left' : 'sidebar-link w-full text-left'}
          >
            <Target className="w-5 h-5 mr-3 shrink-0" />
            PDI
          </button>

          <button
            id="tour-sidebar-career"
            onClick={() => onViewChange('career')}
            className={currentView === 'career' ? 'sidebar-link-active w-full text-left' : 'sidebar-link w-full text-left'}
          >
            <TrendingUp className="w-5 h-5 mr-3 shrink-0" />
            Carreira
          </button>

          <button
            id="tour-sidebar-feedback"
            onClick={() => onViewChange('feedback')}
            className={currentView === 'feedback' ? 'sidebar-link-active w-full text-left' : 'sidebar-link w-full text-left'}
          >
            <MessageSquare className="w-5 h-5 mr-3 shrink-0" />
            Feedback e 1:1
          </button>

          <button className="sidebar-link w-full text-left opacity-60 cursor-not-allowed">
            <Settings className="w-5 h-5 mr-3 shrink-0" />
            Configurações
          </button>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto p-6">
        <button
          id="tour-sidebar-report-btn"
          onClick={onGenerateReport}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 mb-6 shadow-md shadow-primary-600/10"
        >
          <Sparkles className="w-4 h-4" />
          Gerar Relatório
        </button>

        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100 font-black text-primary-600 text-sm shadow-sm shrink-0">
              {userName ? userName.split(' ').map(n => n[0]).join('').substring(0, 2) : 'CL'}
            </div>
            <div className="overflow-hidden">
              <p className="text-gray-900 font-bold text-sm truncate">{userName || 'Gestor'}</p>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest font-black mt-0.5">Gestor de Inovação</p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Encerrar sessão"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
