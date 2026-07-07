import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TeamManagement from './components/TeamManagement';
import RolesManagement from './components/RolesManagement';
import CareerMap from './components/CareerMap';
import FeedbackManagement from './components/FeedbackManagement';
import Login from './components/Login';
import { getDynamicProgressColor } from './utils/colors';
import { Search, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface RadarChartProps {
  averages: number[];
}

const RadarChart: React.FC<RadarChartProps> = ({ averages }) => {
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

  // Mapped time metrics dynamically from averages
  const timePoints = angles.map((a, i) => {
    const val = averages[i] !== undefined ? averages[i] : 0.7;
    const p = getPoint(a, val);
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
          const val = averages[i] !== undefined ? averages[i] : 0.7;
          const p = getPoint(a, val);
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
  const [insight, setInsight] = useState("Carregando diagnóstico do time...");
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fullTeam, setFullTeam] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    activeMembersCount: 24,
    mappedSkillsCount: 148,
    eNPS: 78,
    moodAvg: "4.2",
    retentionRate: 96,
    workshopsRate: 88,
    mentoringRate: 64,
    coursesRate: 42,
    certsRate: 91
  });

  // Fetch dashboard stats dynamically
  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:3001/api/dashboard-stats?managerId=${user.id}`)
        .then(res => {
          setStats(res.data);
        })
        .catch(err => {
          console.warn("Failed to load dashboard stats", err);
        });
    }
  }, [user]);

  // Fetch dashboard collaborators dynamically
  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:3001/api/team?managerId=${user.id}`)
        .then(res => {
          // Take active collaborators (filter out gestor)
          const filtered = res.data.filter((m: any) => !m.role.toLowerCase().includes('gestor'));
          setFullTeam(filtered);
        })
        .catch(err => {
          console.warn("Failed to load team data, using fallback", err);
          // Fallback static mock
          const mockData = [
            { id: "1", name: "Ricardo Borges", role: "DevOps Engineer", pdiAverage: 92, avatar: "https://i.pravatar.cc/150?u=ricardo", aiHealth: "Healthy" },
            { id: "2", name: "Mariana Lima", role: "UX Designer", pdiAverage: 85, avatar: "https://i.pravatar.cc/150?u=mariana", aiHealth: "Healthy" },
            { id: "3", name: "Fabio Souza", role: "Project Manager", pdiAverage: 58, avatar: "https://i.pravatar.cc/150?u=fabio", aiHealth: "Attention" }
          ];
          setFullTeam(mockData);
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
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/analyze', {
        managerId: user.id
      });
      setInsight(response.data.insight);
    } catch (error) {
      console.warn("Backend analyze failed, using simulation", error);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setInsight("Seu time apresenta bom engajamento geral no desenvolvimento dos Planos de Desenvolvimento Individual (PDI).");
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically load team PDI insight when user logs in
  useEffect(() => {
    if (user) {
      handleGenerateReport();
    }
  }, [user]);



  // Calculate team distribution stats
  const totalCollabs = fullTeam.length || 1;
  const healthyCount = fullTeam.filter(m => m.aiHealth === 'Healthy').length;
  const attentionCount = fullTeam.filter(m => m.aiHealth === 'Attention').length;
  const riskCount = fullTeam.filter(m => m.aiHealth === 'Risk').length;

  const lowPdiCount = fullTeam.filter(m => m.pdiAverage < 60).length;
  const midPdiCount = fullTeam.filter(m => m.pdiAverage >= 60 && m.pdiAverage < 85).length;
  const highPdiCount = fullTeam.filter(m => m.pdiAverage >= 85).length;

  // Compute Role Levels
  const roleDistribution: { [key: string]: number } = {};
  fullTeam.forEach(m => {
    let roleGroup = "Outros";
    const r = m.role.toLowerCase();
    if (r.includes("analista")) {
      roleGroup = "Analistas";
    } else if (r.includes("coordenador") || r.includes("gestor")) {
      roleGroup = "Liderança";
    } else if (r.includes("assistente") || r.includes("técnico") || r.includes("auxiliar") || r.includes("assist.")) {
      roleGroup = "Técnicos/Assist.";
    } else if (r.includes("especialista") || r.includes("consultor") || r.includes("partner") || r.includes("bp")) {
      roleGroup = "Espec./Consultores";
    } else if (r.includes("desenvolvedor") || r.includes("engineer") || r.includes("designer") || r.includes("dev")) {
      roleGroup = "Devs/Designers";
    }
    roleDistribution[roleGroup] = (roleDistribution[roleGroup] || 0) + 1;
  });

  // Calculate average scores for radar chart categories
  const categories = ["Liderança", "Tech", "Soft Skills", "Agile", "Negócio"];
  const categoryScores = [0, 0, 0, 0, 0];
  const categoryCounts = [0, 0, 0, 0, 0];
  const defaultAverages = [0.82, 0.91, 0.76, 0.84, 0.68];

  fullTeam.forEach(member => {
    if (member.pdiHistory && member.pdiHistory.length > 0) {
      member.pdiHistory.forEach((h: any) => {
        const name = (h.treinamento_nome || "").toLowerCase();
        let catIndex = 1; // Default to Tech
        
        if (name.includes("liderança") || name.includes("feedback") || name.includes("gestão situacional")) {
          catIndex = 0; // Liderança
        } else if (name.includes("comunicação") || name.includes("assertiva") || name.includes("empatia")) {
          catIndex = 2; // Soft Skills
        } else if (name.includes("ágeis") || name.includes("projetos") || name.includes("tempo") || name.includes("organização")) {
          catIndex = 3; // Agile
        } else if (name.includes("negócio") || name.includes("financeiro") || name.includes("vendas") || name.includes("cliente")) {
          catIndex = 4; // Negócio
        }
        
        categoryScores[catIndex] += h.score / 100;
        categoryCounts[catIndex] += 1;
      });
    }
  });

  const radarAverages = categories.map((_, i) => {
    if (categoryCounts[i]! > 0) {
      return categoryScores[i]! / categoryCounts[i]!;
    }
    return defaultAverages[i]!;
  });

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
          

        </header>

        {currentView === 'dashboard' ? (
          <>
            {/* Title Block */}
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Indicadores e Evolução do Time</h1>
                <p className="text-gray-500 mt-2 text-sm font-medium">Visão analítica de performance, engajamento e desenvolvimento contínuo.</p>
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
                
                <RadarChart averages={radarAverages} />
              </div>
            </div>

            {/* Second Row: KPI Cards + Sentiment + Course Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Stats column */}
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Membros Ativos</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{stats.activeMembersCount}</p>
                    <p className="text-emerald-500 text-xs font-bold mt-1">↑ +2 este mês</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-50 border border-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-black">
                    N2
                  </div>
                </div>

                <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                  <div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Skills Mapeados</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{stats.mappedSkillsCount}</p>
                    <p className="text-gray-400 text-xs font-medium mt-1">Validação ativa baseada em cargos</p>
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
                    <p className="text-lg font-black text-gray-900 mt-0.5">{stats.eNPS}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mood Avg</p>
                    <p className="text-lg font-black text-gray-900 mt-0.5">{stats.moodAvg}/5</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Retenção</p>
                    <p className="text-lg font-black text-gray-900 mt-0.5">{stats.retentionRate}%</p>
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
                      <span>{stats.workshopsRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${stats.workshopsRate}%`, backgroundColor: getDynamicProgressColor(stats.workshopsRate) }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span>Programas de Mentoria</span>
                      <span>{stats.mentoringRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${stats.mentoringRate}%`, backgroundColor: getDynamicProgressColor(stats.mentoringRate) }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span>Cursos Externos</span>
                      <span>{stats.coursesRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${stats.coursesRate}%`, backgroundColor: getDynamicProgressColor(stats.coursesRate) }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span>Certificações</span>
                      <span>{stats.certsRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${stats.certsRate}%`, backgroundColor: getDynamicProgressColor(stats.certsRate) }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Dashboard de Dados Gerais dos Colaboradores */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              
              {/* Card 1: Distribuição de Saúde / Risco (AI Health) */}
              <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-black text-gray-900">Saúde do Time (AI Health)</h3>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Indicador de engajamento e risco de desvio no PDI</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center py-6 relative">
                    <svg className="w-36 h-36 transform -rotate-90">
                      {/* Base Track */}
                      <circle cx="72" cy="72" r="54" fill="transparent" stroke="#F3F4F6" strokeWidth="12" />
                      
                      {/* Arc 1: Healthy */}
                      <circle 
                        cx="72" 
                        cy="72" 
                        r="54" 
                        fill="transparent" 
                        stroke="#10B981" 
                        strokeWidth="12" 
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - (healthyCount / totalCollabs))}`}
                        className="transition-all duration-1000 ease-out"
                      />
                      
                      {/* Arc 2: Attention */}
                      {attentionCount > 0 && (
                        <circle 
                          cx="72" 
                          cy="72" 
                          r="54" 
                          fill="transparent" 
                          stroke="#F59E0B" 
                          strokeWidth="12" 
                          strokeDasharray={`${2 * Math.PI * 54}`}
                          strokeDashoffset={`${2 * Math.PI * 54 * (1 - (attentionCount / totalCollabs))}`}
                          style={{ transform: `rotate(${(healthyCount / totalCollabs) * 360}deg)`, transformOrigin: '72px 72px' }}
                          className="transition-all duration-1000 ease-out"
                        />
                      )}
                      
                      {/* Arc 3: Risk */}
                      {riskCount > 0 && (
                        <circle 
                          cx="72" 
                          cy="72" 
                          r="54" 
                          fill="transparent" 
                          stroke="#EF4444" 
                          strokeWidth="12" 
                          strokeDasharray={`${2 * Math.PI * 54}`}
                          strokeDashoffset={`${2 * Math.PI * 54 * (1 - (riskCount / totalCollabs))}`}
                          style={{ transform: `rotate(${((healthyCount + attentionCount) / totalCollabs) * 360}deg)`, transformOrigin: '72px 72px' }}
                          className="transition-all duration-1000 ease-out"
                        />
                      )}
                    </svg>
                    
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-gray-900">{fullTeam.length}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Membros</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-50">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>No Caminho (Healthy)</span>
                    </div>
                    <span className="text-gray-500">{healthyCount} ({Math.round((healthyCount / totalCollabs) * 100)}%)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-2 text-amber-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                      <span>Atenção (Attention)</span>
                    </div>
                    <span className="text-gray-500">{attentionCount} ({Math.round((attentionCount / totalCollabs) * 100)}%)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-2 text-rose-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                      <span>Abaixo do Esperado (Risk)</span>
                    </div>
                    <span className="text-gray-500">{riskCount} ({Math.round((riskCount / totalCollabs) * 100)}%)</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Progresso dos PDIs */}
              <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-black text-gray-900">Progresso dos PDIs</h3>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Evolução do time por faixas de conclusão</p>
                    </div>
                  </div>

                  <div className="space-y-5 py-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                          <span>Destaques / Avançado (≥ 85%)</span>
                        </div>
                        <span>{highPdiCount} membros</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(highPdiCount / totalCollabs) * 100}%`, backgroundColor: getDynamicProgressColor((highPdiCount / totalCollabs) * 100) }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <span>No Ritmo Correto (60% - 84%)</span>
                        </div>
                        <span>{midPdiCount} membros</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(midPdiCount / totalCollabs) * 100}%`, backgroundColor: getDynamicProgressColor((midPdiCount / totalCollabs) * 100) }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Necessita Acompanhamento (&lt; 60%)</span>
                        </div>
                        <span>{lowPdiCount} membros</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(lowPdiCount / totalCollabs) * 100}%`, backgroundColor: getDynamicProgressColor((lowPdiCount / totalCollabs) * 100) }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 text-center">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Média Conclusão do Time: <span className="text-primary-600 font-black text-xs">
                      {fullTeam.length > 0 ? Math.round(fullTeam.reduce((acc, curr) => acc + curr.pdiAverage, 0) / fullTeam.length) : 0}%
                    </span>
                  </p>
                </div>
              </div>

              {/* Card 3: Distribuição de Cargos */}
              <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-black text-gray-900">Distribuição por Funções</h3>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Composição estrutural de cargos</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 py-2">
                    {Object.entries(roleDistribution).map(([roleGroup, count]) => (
                      <div key={roleGroup} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-700">{roleGroup}</span>
                          <span className="text-gray-500">{count} ({Math.round((count / totalCollabs) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${(count / totalCollabs) * 100}%`, backgroundColor: getDynamicProgressColor((count / totalCollabs) * 100) }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 mt-4">
                  <button 
                    onClick={() => setCurrentView('team')}
                    className="w-full flex items-center justify-between text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50/50 hover:bg-primary-50 border border-primary-100/50 px-4 py-3 rounded-xl transition-all"
                  >
                    <span>Ver lista completa de colaboradores</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </>
        ) : currentView === 'roles' ? (
          <RolesManagement />
        ) : currentView === 'career' ? (
          <CareerMap managerId={user.id} />
        ) : currentView === 'feedback' ? (
          <FeedbackManagement managerId={user.id} />
        ) : (
          <TeamManagement search={searchTerm} managerId={user.id} />
        )}
      </main>
    </div>
  );
};

export default App;
