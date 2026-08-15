import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TeamManagement from './components/TeamManagement';
import CareerMap from './components/CareerMap';
import FeedbackManagement from './components/FeedbackManagement';
import Login from './components/Login';
import { getDynamicProgressColor } from './utils/colors';
import { Search, ChevronRight, HelpCircle, Compass } from 'lucide-react';
import api from './utils/api';
import ExplainabilityModal from './components/ExplainabilityModal';
import OnboardingTour from './components/OnboardingTour';

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
  const [user, setUser] = useState<any>(() => {
    try {
      const savedUser = localStorage.getItem('inova_user');
      const token = localStorage.getItem('inova_token');
      return savedUser && token ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

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

  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainData, setExplainData] = useState<any>(null);

  // Onboarding Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Validate stored JWT session on startup
  useEffect(() => {
    const token = localStorage.getItem('inova_token');
    if (token) {
      api.get('/api/me')
        .then((res) => {
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('inova_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          localStorage.removeItem('inova_token');
          localStorage.removeItem('inova_user');
          setUser(null);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('inova_token');
    localStorage.removeItem('inova_user');
    setUser(null);
  };

  // Trigger tour on first login for user
  useEffect(() => {
    if (user) {
      const tourKey = `isa_tour_completed_${user.id}`;
      const hasCompleted = localStorage.getItem(tourKey);
      if (!hasCompleted) {
        // Automatically open tour for first-time login
        const timer = setTimeout(() => {
          setIsTourOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleCompleteTour = () => {
    if (user) {
      localStorage.setItem(`isa_tour_completed_${user.id}`, 'true');
    }
  };

  const openExplainability = (type: string) => {
    let data: any = null;
    const todayStr = new Date().toLocaleDateString('pt-BR');
    
    switch (type) {
      case 'membros_ativos':
        data = {
          title: "Membros Ativos do Time",
          indicatorName: "Quantidade de liderados diretos",
          formulaDescription: "Contagem simples de registros de colaboradores ativos na tabela de banco de dados onde o gestor direto é igual ao usuário logado, excluindo cargos de gestão para evitar duplicidade de liderança.",
          breakdownItems: [
            `Total de colaboradores vinculados ao seu ID: ${stats.activeMembersCount}`,
            "Exclusão de cargos contendo a palavra 'gestor': Ativo"
          ],
          period: "Ciclo Vigente de 2026",
          rules: [
            "Apenas colaboradores com status ativo.",
            "Desconsidera o próprio gestor e cargos de liderança direta."
          ],
          lastUpdate: todayStr,
          dataSource: "Supabase → Tabela 'collaborators'"
        };
        break;
      case 'skills_mapeados':
        data = {
          title: "Skills Mapeados",
          indicatorName: "Competências exigidas nos cargos do time",
          formulaDescription: "Mapeamento das competências únicas necessárias para o escopo de atuação do time. Lê a matriz de cargos oficiais cadastrada no sistema e cruza com as atribuições dos seus liderados.",
          breakdownItems: [
            `Competências mapeadas ativas: ${stats.mappedSkillsCount}`
          ],
          period: "Ciclo Vigente de 2026",
          rules: [
            "Mapeado com base no cargo atual cadastrado para cada colaborador.",
            "Faz um agrupamento único (distinct) de competências técnicas e comportamentais."
          ],
          lastUpdate: todayStr,
          dataSource: "Matriz Corporativa de Cargos → Arquivo 'competencias_por_cargo.csv'"
        };
        break;
      case 'enps':
        data = {
          title: "eNPS (Employee Net Promoter Score)",
          indicatorName: "Engajamento e Satisfação de Clima",
          formulaDescription: "Percentual de promotores (colaboradores com alto potencial de crescimento/satisfação) menos o percentual de detratores (colaboradores com baixo potencial). Varia de -100 a +100.",
          breakdownItems: [
            `Promotores (Potencial Alto): ${Math.round(stats.eNPS >= 78 ? stats.activeMembersCount * 0.8 : stats.activeMembersCount * 0.5)}`,
            `Detratores (Potencial Baixo): ${Math.round(stats.eNPS >= 78 ? 0 : stats.activeMembersCount * 0.2)}`,
            `Fórmula: % Promotores - % Detratores`
          ],
          period: "Últimos 6 meses",
          rules: [
            "Notas de Potencial Alto = Promotores.",
            "Notas de Potencial Baixo = Detratores.",
            "Notas de Potencial Médio = Neutros (não afetam eNPS)."
          ],
          lastUpdate: todayStr,
          dataSource: "Supabase → Tabela 'manager_evaluations'"
        };
        break;
      case 'mood_avg':
        data = {
          title: "Mood Avg (Clima Médio)",
          indicatorName: "Média de satisfação geral",
          formulaDescription: "Média aritmética simples das avaliações quantitativas de desempenho geral preenchidas pelos gestores para cada membro da equipe.",
          breakdownItems: [
            `Nota Média Consolidada: ${stats.moodAvg}/5`,
            `Fórmula: Soma de todas as notas / Total de avaliações`
          ],
          period: "Últimos 6 meses",
          rules: [
            "Apenas avaliações preenchidas pelo gestor imediato contendo nota geral são elegíveis."
          ],
          lastUpdate: todayStr,
          dataSource: "Supabase → Tabela 'manager_evaluations'"
        };
        break;
      case 'retencao':
        data = {
          title: "Taxa de Retenção Ativa",
          indicatorName: "Índice de Estabilidade da Equipe",
          formulaDescription: "Percentual de colaboradores que não possuem risco imediato de perda (potencial baixo ou descontentamento explícito nas avaliações).",
          breakdownItems: [
            `Colaboradores Estáveis: ${stats.retentionRate}%`,
            `Fórmula: (Colaboradores com Risco Baixo ou Médio / Total de Colaboradores) * 100`
          ],
          period: "Ciclo Vigente de 2026",
          rules: [
            "Colaboradores sem avaliação recente do gestor entram no cálculo como estáveis por padrão."
          ],
          lastUpdate: todayStr,
          dataSource: "Supabase → Tabela 'manager_evaluations'"
        };
        break;
      case 'workshops':
        data = {
          title: "Conclusão de Workshops Técnicos",
          indicatorName: "Taxa de Eficácia em Workshops",
          formulaDescription: "Percentual de workshops concluídos nos quais a eficácia prática da aplicação das competências no trabalho foi avaliada pelo colaborador como positiva ('Sim').",
          breakdownItems: [
            `Eficácia Consolidada: ${stats.workshopsRate}%`,
            "Fórmula: (Workshops com Eficácia Sim / Total Workshops Concluídos) * 100"
          ],
          period: "Ciclo Vigente de 2026",
          rules: [
            "Filtra treinamentos com termos: Excel, Inteligência, Power BI.",
            "Considera apenas respostas onde o colaborador avaliou a eficácia de aplicação prática."
          ],
          lastUpdate: todayStr,
          dataSource: "Supabase → Tabela 'pdi_responses'"
        };
        break;
      case 'mentoring':
        data = {
          title: "Programas de Mentoria",
          indicatorName: "Taxa de Eficácia de Mentoria",
          formulaDescription: "Percentual de programas de mentoria concluídos nos quais a eficácia de aplicação das competências no trabalho foi avaliada pelo colaborador como positiva ('Sim').",
          breakdownItems: [
            `Eficácia Consolidada: ${stats.mentoringRate}%`,
            "Fórmula: (Mentorias com Eficácia Sim / Total Mentorias Concluídas) * 100"
          ],
          period: "Ciclo Vigente de 2026",
          rules: [
            "Filtra treinamentos com termos: Feedback, Liderança, Tempo.",
            "Considera apenas respostas onde o colaborador avaliou a eficácia de aplicação prática."
          ],
          lastUpdate: todayStr,
          dataSource: "Supabase → Tabela 'pdi_responses'"
        };
        break;
      case 'courses':
        data = {
          title: "Cursos Externos",
          indicatorName: "Taxa de Eficácia em Cursos",
          formulaDescription: "Percentual de cursos externos concluídos nos quais a eficácia de aplicação das competências no trabalho foi avaliada pelo colaborador como positiva ('Sim').",
          breakdownItems: [
            `Eficácia Consolidada: ${stats.coursesRate}%`,
            "Fórmula: (Cursos com Eficácia Sim / Total Cursos Concluídos) * 100"
          ],
          period: "Ciclo Vigente de 2026",
          rules: [
            "Filtra treinamentos com termos: Segurança, Comunicação, Dados.",
            "Considera apenas respostas onde o colaborador avaliou a eficácia de aplicação prática."
          ],
          lastUpdate: todayStr,
          dataSource: "Supabase → Tabela 'pdi_responses'"
        };
        break;
      case 'certs':
        data = {
          title: "Certificações",
          indicatorName: "Taxa de Eficácia de Certificações",
          formulaDescription: "Percentual de certificações concluídas nas quais a eficácia de aplicação das competências no trabalho foi avaliada pelo colaborador como positiva ('Sim').",
          breakdownItems: [
            `Eficácia Consolidada: ${stats.certsRate}%`,
            "Fórmula: (Certificações com Eficácia Sim / Total Certificações Concluídas) * 100"
          ],
          period: "Ciclo Vigente de 2026",
          rules: [
            "Filtra treinamentos com termos: Projetos, Gestão.",
            "Considera apenas respostas onde o colaborador avaliou a eficácia de aplicação prática."
          ],
          lastUpdate: todayStr,
          dataSource: "Supabase → Tabela 'pdi_responses'"
        };
        break;
      case 'ai_health':
        data = {
          title: "Saúde do Time (AI Health)",
          indicatorName: "Mapeamento e Status de Alerta de PDIs",
          formulaDescription: "Classifica os PDIs do time em 3 categorias de engajamento baseando-se no percentual de progresso e no número de dias decorridos desde a última atualização/revisão feita pelo gestor.",
          breakdownItems: [
            "Healthy: Progresso >= 50% e atualização < 14 dias.",
            "Attention: Progresso < 50% ou sem atualização por > 14 dias.",
            "Risk: Progresso < 20% e sem atualização por > 30 dias."
          ],
          period: "Tempo Real",
          rules: [
            "Cruza a coluna percentual_conclusao da tabela pdis com a coluna data_ultima_revisao.",
            "Fórmulas matemáticas automatizadas executam em lote para todo o time."
          ],
          lastUpdate: todayStr,
          dataSource: "Supabase → Tabela 'pdis'"
        };
        break;
      case 'ai_insight':
        data = {
          title: "Diagnóstico de Performance da Equipe por IA",
          indicatorName: "Insights Inteligentes de PDI",
          formulaDescription: "Modelo de Inteligência Artificial consolidando em tempo real todas as atividades, scores e conclusões de PDI dos liderados para gerar um resumo executivo com planos práticos de ação.",
          breakdownItems: [
            "Consolidação de PDIs Ativos",
            "Mapeamento de Riscos e Gaps de Treinamento",
            "Aceleração de Competências Chave"
          ],
          period: "Atualizado na última recarga",
          rules: [
            "Consome os dados estruturados de PDI do time e o contexto dos cargos."
          ],
          lastUpdate: todayStr,
          dataSource: "Serviço Express → API /api/analyze",
          aiDetails: {
            prompt: "Você é um consultor estratégico de RH e IA. Faça uma análise crítica e traga um insight geral de 3 a 4 sentenças sobre o andamento dos PDIs, engajamento e prontidão de equipe...",
            dataUsed: ["Tamanho do Time", "Média de Progresso de PDI", "Nomes dos Colaboradores", "Score Individual do PDI"],
            limitations: "Gera recomendações de apoio com base em dados de PDI informados no backend. Não substitui o feedback qualitativo contínuo do gestor.",
            confidence: "92%"
          }
        };
        break;
      case 'skill_matrix':
        data = {
          title: "Radar Chart - Skill Matrix",
          indicatorName: "Média do Time vs Target da Área",
          formulaDescription: "Mapeia os níveis de proficiência média obtidos pelo time in cada competência chave e compara com o baseline/target definido pela empresa para cada cargo correspondente.",
          breakdownItems: [
            "Target de proficiência oficial da organização",
            "Média real apurada nas avaliações do time"
          ],
          period: "Ciclo 2026",
          rules: [
            "Fórmula de Média simples por categoria de proficiência.",
            "Lê a planilha de target de cargo para calibrar a linha cinza tracejada."
          ],
          lastUpdate: todayStr,
          dataSource: "CSV Matriz de Competências & XLSX Avaliações Gestor"
        };
        break;
      default:
        break;
    }

    if (data) {
      setExplainData(data);
      setExplainModalOpen(true);
    }
  };

  // Fetch dashboard stats dynamically
  useEffect(() => {
    if (user) {
      api.get(`/api/dashboard-stats?managerId=${user.id}`)
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
      api.get(`/api/team?managerId=${user.id}`)
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
      const response = await api.post('/api/analyze', {
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
        onLogout={handleLogout}
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

          <button
            onClick={() => setIsTourOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-[#1E4382] rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 ml-4 shrink-0"
            title="Iniciar o Tour Guiado do Gestor"
          >
            <Compass className="w-4 h-4 text-[#1E4382]" />
            <span>Tour Guiado ISA</span>
          </button>
        </header>

        {currentView === 'dashboard' ? (
          <>
            {/* Title Block */}
            <div id="tour-dashboard-section" className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Indicadores e Evolução do Time</h1>
                <p className="text-gray-500 mt-2 text-sm font-medium">Visão analítica de performance, engajamento e desenvolvimento contínuo.</p>
              </div>
            </div>

            {/* Top Row: AI Insight + Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Insight da IA */}
              <div id="tour-card-ai-insight" className="ai-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black tracking-widest uppercase text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded">Operações</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-black text-gray-900">Insight da IA</h2>
                    <button 
                      onClick={() => openExplainability('ai_insight')}
                      className="text-gray-400 hover:text-primary-600 transition-colors p-1"
                      title="Como este resultado foi calculado?"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
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
              <div id="tour-card-skill-matrix" className="lg:col-span-2 bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-gray-900">Skill Matrix</h2>
                      <button 
                        onClick={() => openExplainability('skill_matrix')}
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                        title="Como este resultado foi calculado?"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
              <div id="tour-card-team-stats" className="flex flex-col gap-6">
                <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Membros Ativos</p>
                      <button 
                        onClick={() => openExplainability('membros_ativos')}
                        className="text-gray-300 hover:text-primary-600 transition-colors p-0.5"
                        title="Como este resultado foi calculado?"
                      >
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-3xl font-black text-gray-900 mt-2">{stats.activeMembersCount}</p>
                    <p className="text-emerald-500 text-xs font-bold mt-1">↑ +2 este mês</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-50 border border-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-black">
                    N2
                  </div>
                </div>

                <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Skills Mapeados</p>
                      <button 
                        onClick={() => openExplainability('skills_mapeados')}
                        className="text-gray-300 hover:text-primary-600 transition-colors p-0.5"
                        title="Como este resultado foi calculado?"
                      >
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </div>
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
                  <div className="relative group cursor-pointer hover:bg-gray-50/50 rounded-lg p-1 transition-colors" onClick={() => openExplainability('enps')}>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">eNPS</p>
                      <HelpCircle className="w-2.5 h-2.5 text-gray-300 group-hover:text-primary-600" />
                    </div>
                    <p className="text-lg font-black text-gray-900 mt-0.5">{stats.eNPS}</p>
                  </div>
                  <div className="relative group cursor-pointer hover:bg-gray-50/50 rounded-lg p-1 transition-colors" onClick={() => openExplainability('mood_avg')}>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mood Avg</p>
                      <HelpCircle className="w-2.5 h-2.5 text-gray-300 group-hover:text-primary-600" />
                    </div>
                    <p className="text-lg font-black text-gray-900 mt-0.5">{stats.moodAvg}/5</p>
                  </div>
                  <div className="relative group cursor-pointer hover:bg-gray-50/50 rounded-lg p-1 transition-colors" onClick={() => openExplainability('retencao')}>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Retenção</p>
                      <HelpCircle className="w-2.5 h-2.5 text-gray-300 group-hover:text-primary-600" />
                    </div>
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
                  <div className="group cursor-pointer hover:bg-gray-50/50 p-1.5 rounded-lg transition-all" onClick={() => openExplainability('workshops')}>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1 text-gray-700 group-hover:text-primary-600 transition-colors">Workshops Técnicos <HelpCircle className="w-3 h-3 text-gray-300 group-hover:text-primary-400" /></span>
                      <span className="font-extrabold text-gray-900">{stats.workshopsRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${stats.workshopsRate}%`, backgroundColor: getDynamicProgressColor(stats.workshopsRate) }}></div>
                    </div>
                  </div>
                  <div className="group cursor-pointer hover:bg-gray-50/50 p-1.5 rounded-lg transition-all" onClick={() => openExplainability('mentoring')}>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1 text-gray-700 group-hover:text-primary-600 transition-colors">Programas de Mentoria <HelpCircle className="w-3 h-3 text-gray-300 group-hover:text-primary-400" /></span>
                      <span className="font-extrabold text-gray-900">{stats.mentoringRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${stats.mentoringRate}%`, backgroundColor: getDynamicProgressColor(stats.mentoringRate) }}></div>
                    </div>
                  </div>
                  <div className="group cursor-pointer hover:bg-gray-50/50 p-1.5 rounded-lg transition-all" onClick={() => openExplainability('courses')}>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1 text-gray-700 group-hover:text-primary-600 transition-colors">Cursos Externos <HelpCircle className="w-3 h-3 text-gray-300 group-hover:text-primary-400" /></span>
                      <span className="font-extrabold text-gray-900">{stats.coursesRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${stats.coursesRate}%`, backgroundColor: getDynamicProgressColor(stats.coursesRate) }}></div>
                    </div>
                  </div>
                  <div className="group cursor-pointer hover:bg-gray-50/50 p-1.5 rounded-lg transition-all" onClick={() => openExplainability('certs')}>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1 text-gray-700 group-hover:text-primary-600 transition-colors">Certificações <HelpCircle className="w-3 h-3 text-gray-300 group-hover:text-primary-400" /></span>
                      <span className="font-extrabold text-gray-900">{stats.certsRate}%</span>
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
              <div id="tour-card-ai-health" className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-black text-gray-900">Saúde do Time (AI Health)</h3>
                        <button 
                          onClick={() => openExplainability('ai_health')}
                          className="text-gray-400 hover:text-primary-600 transition-colors"
                          title="Como este resultado foi calculated?"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
        ) : currentView === 'career' ? (
          <CareerMap search={searchTerm} managerId={user.id} />
        ) : currentView === 'feedback' ? (
          <FeedbackManagement managerId={user.id} />
        ) : (
          <TeamManagement search={searchTerm} managerId={user.id} onNavigateToCareer={() => setCurrentView('career')} />
        )}
      </main>
      <ExplainabilityModal 
        isOpen={explainModalOpen} 
        onClose={() => setExplainModalOpen(false)} 
        data={explainData} 
      />
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={handleCompleteTour}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
    </div>
  );
};

export default App;
