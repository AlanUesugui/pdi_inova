import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TeamManagement from './components/TeamManagement';
import Login from './components/Login';
import { Search, Bell, Settings, Upload, Download, Sparkles, Star, ChevronRight } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';

// --- Pure CSS/SVG Radar Chart (Skill Matrix) ---
const RadarChart: React.FC = () => {
  const cx = 150;
  const cy = 120;
  const r = 70;
  
  const angles = [-90, -18, 54, 126, 198];
  
  const getPoint = (angle: number, pct: number) => {
    const rad = (angle * Math.PI) / 180;
    const dist = r * pct;
    return {
      x: cx + dist * Math.cos(rad),
      y: cy + dist * Math.sin(rad)
    };
  };

  const levels = [0.25, 0.5, 0.75, 1.0];
  const levelPentagons = levels.map(level => {
    return angles.map(a => {
      const p = getPoint(a, level);
      return `${p.x},${p.y}`;
    }).join(' ');
  });

  // Mapped time metrics (e.g., Liderança: 82%, Tech: 91%, Soft Skills: 76%, Agile: 84%, Negócio: 68%)
  const timePoints = angles.map((a, i) => {
    const pcts = [0.82, 0.91, 0.76, 0.84, 0.68];
    const p = getPoint(a, pcts[i]!);
    return `${p.x},${p.y}`;
  }).join(' ');

  // Target metrics (Liderança: 70%, Tech: 75%, Soft Skills: 80%, Agile: 75%, Negócio: 70%)
  const targetPoints = angles.map((a, i) => {
    const pcts = [0.70, 0.75, 0.80, 0.75, 0.70];
    const p = getPoint(a, pcts[i]!);
    return `${p.x},${p.y}`;
  }).join(' ');

  const labelPositions: { x: number; y: number; name: string; anchor: "start" | "middle" | "end" }[] = [
    { x: cx, y: cy - r - 15, name: 'Liderança', anchor: 'middle' },
    { x: cx + r + 15, y: cy - 5, name: 'Tech', anchor: 'start' },
    { x: cx + r - 10, y: cy + r + 15, name: 'Soft Skills', anchor: 'start' },
    { x: cx - r + 10, y: cy + r + 15, name: 'Agile', anchor: 'end' },
    { x: cx - r - 15, y: cy - 5, name: 'Negócio', anchor: 'end' }
  ];

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <svg width="300" height="230" className="overflow-visible">
        {/* Grid backgrounds */}
        {levelPentagons.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="1.5"
            strokeDasharray={idx === 3 ? "0" : "3 3"}
          />
        ))}
        {/* Axis lines */}
        {angles.map((a, idx) => {
          const p = getPoint(a, 1.0);
          return (
            <line
              key={idx}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}
        {/* Target Profile */}
        <polygon
          points={targetPoints}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        {/* Time Actual Profile */}
        <polygon
          points={timePoints}
          fill="rgba(91, 47, 140, 0.12)"
          stroke="#5B2F8C"
          strokeWidth="2.5"
        />
        {/* Vertices indicator dots */}
        {angles.map((a, i) => {
          const pcts = [0.82, 0.91, 0.76, 0.84, 0.68];
          const p = getPoint(a, pcts[i]!);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#5B2F8C"
              stroke="#FFF"
              strokeWidth="2"
              className="shadow-sm"
            />
          );
        })}
        {/* Axes Labels */}
        {labelPositions.map((lbl, idx) => (
          <text
            key={idx}
            x={lbl.x}
            y={lbl.y}
            textAnchor={lbl.anchor}
            className="text-[9px] font-black text-gray-400 uppercase tracking-widest fill-current"
          >
            {lbl.name}
          </text>
        ))}
      </svg>
      {/* Chart Legend */}
      <div className="flex gap-6 mt-4 text-xs font-bold text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1.5 bg-primary-600 rounded-full inline-block"></span>
          <span className="text-gray-700">Média do Time</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 border-t border-dashed border-gray-400 inline-block"></span>
          <span className="text-gray-400">Target da Área</span>
        </div>
      </div>
    </div>
  );
};

// --- Pure CSS/SVG Engagement Wave ---
const EngagementWave: React.FC = () => {
  return (
    <svg width="100%" height="70" viewBox="0 0 350 70" preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="eng-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B2F8C" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#5B2F8C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,50 C40,55 80,35 120,38 C160,42 200,15 240,20 C280,25 310,8 350,12 L350,70 L0,70 Z"
        fill="url(#eng-grad)"
      />
      <path
        d="M0,50 C40,55 80,35 120,38 C160,42 200,15 240,20 C280,25 310,8 350,12"
        fill="none"
        stroke="#5B2F8C"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="350" cy="12" r="5" fill="#5B2F8C" stroke="#FFF" strokeWidth="2" className="shadow-md" />
    </svg>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [insight, setInsight] = useState("Sua área está 15% acima da média da empresa em competências de Liderança. O investimento em mentorias no último trimestre impulsionou a evolução técnica do time de Engenharia.");
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardTeam, setDashboardTeam] = useState<any[]>([]);

  // Fetch dashboard collaborators dynamically
  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:3001/api/team?managerId=${user.id}`)
        .then(res => {
          // Take active collaborators (filter out gestor)
          const filtered = res.data.filter((m: any) => !m.role.toLowerCase().includes('gestor'));
          // Take top 3 for the dashboard individual performance summary
          setDashboardTeam(filtered.slice(0, 3));
        })
        .catch(err => {
          console.warn("Failed to load team data, using fallback", err);
          // Fallback static mock
          setDashboardTeam([
            { id: "1", name: "Ricardo Borges", role: "DevOps Engineer", pdiAverage: 92, avatar: "https://i.pravatar.cc/150?u=ricardo", aiHealth: "Healthy" },
            { id: "2", name: "Mariana Lima", role: "UX Designer", pdiAverage: 85, avatar: "https://i.pravatar.cc/150?u=mariana", aiHealth: "Healthy" },
            { id: "3", name: "Fabio Souza", role: "Project Manager", pdiAverage: 58, avatar: "https://i.pravatar.cc/150?u=fabio", aiHealth: "Attention" }
          ]);
        });
    }
  }, [user]);

  // AI Typewriter effect for Insight
  useEffect(() => {
    if (isLoading) {
      setDisplayedText('');
      return;
    }
    let index = 0;
    const interval = setInterval(() => {
      if (index < insight.length) {
        setDisplayedText(insight.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [insight, isLoading]);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/analyze', {
        profileData: {
          pastExperiences: ["Senior Dev at TechCorp", "Lead at Innovate"],
          currentSkills: ["React", "Node", "System Design"],
          trainingHistory: ["Leadership 101", "Advanced Architecture"]
        }
      });
      setInsight(response.data.insight);
    } catch (error) {
      console.warn("Backend analyze failed, using simulation", error);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setInsight("Sua área está 22% acima da meta em competências de Agile e Gestão Técnica. Recomenda-se focar na validação de marcos de Arquitetura de Nuvem para os próximos 15 dias.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('report', file);

    try {
      const response = await axios.post('http://localhost:3001/api/upload', formData);
      alert(response.data.message);
      setInsight(`Relatório importado com sucesso. Novas competências extraídas: ${response.data.extractedSkills.join(', ')}. PDIs recomendados atualizados.`);
    } catch (error) {
      console.warn("Upload failed, using simulation", error);
      await new Promise(resolve => setTimeout(resolve, 1200));
      setInsight("Simulação: Relatório técnico processado. Foram atualizadas competências para Liderança de Equipe e Engenharia DevOps.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(91, 47, 140); // Brand Violet Color
    doc.text("Inova Skill - Indicadores do Time", 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Grupo Jacto - Relatorio Corporativo de Desempenho e PDI", 20, 32);
    doc.line(20, 36, 190, 36);
    
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text("Insight de IA do Periodo:", 20, 48);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const splitText = doc.splitTextToSize(insight, 170);
    doc.text(splitText, 20, 56);

    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text("Mapeamento e Metricas de Competencia:", 20, 95);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("- Membros Ativos do Time: 24 colaboradores", 25, 105);
    doc.text("- Skills Mapeados no Ciclo: 148 skills (82% de validacao)", 25, 112);
    doc.text("- Conclusao de Workshops Tecnicos: 88%", 25, 119);
    doc.text("- Conclusao de Programas de Mentoria: 64%", 25, 126);

    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text("Resumo de Performance Individual (Destaques):", 20, 145);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    dashboardTeam.forEach((member, i) => {
      doc.text(`${i + 1}. ${member.name} (${member.role}) - PDI: ${member.pdiAverage}% - Status: ${member.pdiAverage >= 85 ? 'Promovido' : member.pdiAverage >= 60 ? 'No Caminho' : 'Precisa de Foco'}`, 25, 155 + (i * 7));
    });

    doc.save("indicadores-time-inova.pdf");
  };

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar 
        onGenerateReport={handleGenerateReport} 
        currentView={currentView}
        onViewChange={setCurrentView}
        userName={user.name}
      />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-600 transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar colaboradores, competências ou trilhas..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 transition-all shadow-sm font-medium text-sm"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-primary-100/70 transition-all border border-primary-100">
              <Upload className="w-4 h-4" />
              Upload de Relatório
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.xlsx,.xls" />
            </label>
            <button className="relative p-2.5 text-gray-400 hover:text-primary-600 bg-white border border-gray-100 rounded-xl shadow-sm transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>
            <button className="p-2.5 text-gray-400 hover:text-primary-600 bg-white border border-gray-100 rounded-xl shadow-sm transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 leading-none">{user.name}</p>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Gestor de Inovação</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-black text-sm shadow-sm">
              {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
            </div>
          </div>
        </header>

        {currentView === 'dashboard' ? (
          <>
            {/* Title Block */}
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Indicadores e Evolução do Time</h1>
                <p className="text-gray-500 mt-2 text-sm font-medium">Visão analítica de performance, engajamento e desenvolvimento contínuo.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Exportar PDF
                </button>
                <button className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-600/10 active:scale-95">
                  <Sparkles className="w-4 h-4" />
                  Configurar Alertas
                </button>
              </div>
            </div>

            {/* Top Row: AI Insight + Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Insight da IA */}
              <div className="ai-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black tracking-widest uppercase text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded">Operações</span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900 mb-3">Insight da IA</h2>
                  <div className="min-h-[120px] flex items-start">
                    {isLoading ? (
                      <div className="space-y-3 w-full animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm leading-relaxed font-medium">
                        {displayedText}
                        <span className="inline-block w-1.5 h-3.5 bg-primary-600 ml-1 animate-pulse"></span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100/50 mt-4">
                  <button 
                    onClick={handleGenerateReport}
                    className="w-full flex items-center justify-between text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50/50 hover:bg-primary-50 border border-primary-100/50 px-4 py-3 rounded-xl transition-all"
                  >
                    <span>Recalcular Diagnóstico IA</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Skill Matrix */}
              <div className="lg:col-span-2 bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Skill Matrix</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-0.5">Média do Time vs. Target da Área</p>
                  </div>
                  <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded border border-primary-100 uppercase tracking-widest">
                    Mapeamento Ativo
                  </span>
                </div>
                
                <RadarChart />
              </div>
            </div>

            {/* Second Row: KPI Cards + Sentiment + Course Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Stats column */}
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Membros Ativos</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">24</p>
                    <p className="text-emerald-500 text-xs font-bold mt-1">↑ +2 este mês</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-50 border border-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-black">
                    N2
                  </div>
                </div>

                <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Skills Mapeados</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">148</p>
                    <p className="text-gray-400 text-xs font-medium mt-1">82% de validação ativa</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-black">
                    ✓
                  </div>
                </div>
              </div>

              {/* Engajamento e Sentimento */}
              <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-gray-900">Engajamento e Sentimento</h3>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Últimos 6 meses</span>
                  </div>
                  <EngagementWave />
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-4 text-center">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">eNPS</p>
                    <p className="text-lg font-black text-gray-900 mt-0.5">78</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mood Avg</p>
                    <p className="text-lg font-black text-gray-900 mt-0.5">4.2/5</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Retenção</p>
                    <p className="text-lg font-black text-gray-900 mt-0.5">96%</p>
                  </div>
                </div>
              </div>

              {/* Conclusão de Experiências */}
              <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="text-sm font-black text-gray-900 mb-1">Conclusão de Experiências</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Taxa de engajamento em trilhas recomendadas</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span>Workshops Técnicos</span>
                      <span>88%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary-600 h-full rounded-full" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span>Programas de Mentoria</span>
                      <span>64%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary-600 h-full rounded-full" style={{ width: '64%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span>Cursos Externos</span>
                      <span>42%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary-600 h-full rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span>Certificações</span>
                      <span>91%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary-600 h-full rounded-full" style={{ width: '91%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Performance Individual */}
            <div className="bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/20">
                <div>
                  <h3 className="text-base font-black text-gray-900">Performance Individual</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-0.5">Destaques e evolução de PDIs do ciclo atual</p>
                </div>
                <button 
                  onClick={() => setCurrentView('team')}
                  className="text-primary-600 text-xs font-black hover:underline uppercase tracking-widest flex items-center gap-1"
                >
                  Ver todos os 24 membros do time
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4">Colaborador</th>
                      <th className="px-6 py-4">Maturidade Skill</th>
                      <th className="px-6 py-4">Conclusão PDI</th>
                      <th className="px-6 py-4">Último Feedback</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboardTeam.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-50 border border-primary-100 overflow-hidden flex items-center justify-center font-bold text-primary-600 text-xs">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                member.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{member.name}</p>
                              <p className="text-gray-400 text-xs mt-0.5">{member.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-3.5 h-3.5 ${star <= (member.pdiAverage >= 85 ? 5 : member.pdiAverage >= 70 ? 4 : 3) ? 'fill-current' : 'text-gray-200'}`} 
                              />
                            ))}
                            <span className="text-xs font-bold text-gray-500 ml-1.5">
                              {(member.pdiAverage / 20).toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 max-w-[150px]">
                            <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-primary-600 h-full rounded-full" style={{ width: `${member.pdiAverage}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-gray-700">{member.pdiAverage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                          {member.pdiAverage >= 85 ? '12 Jan, 2026' : member.pdiAverage >= 60 ? '05 Fev, 2026' : '28 Jan, 2026'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                            member.pdiAverage >= 85 
                              ? 'bg-purple-50 text-purple-600 border-purple-100' 
                              : member.pdiAverage >= 60 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {member.pdiAverage >= 85 ? 'Promoted' : member.pdiAverage >= 60 ? 'On Track' : 'Needs Focus'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <TeamManagement search={searchTerm} managerId={user.id} />
        )}
      </main>
    </div>
  );
};

export default App;
