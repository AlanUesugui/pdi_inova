export interface TeamMember {
  id: string;
  name: string;
  role: string;
  level: string;
  pdiGoal: string;
  pdiProgress: number;
  lastUpdate: Date;
  seniority: 'Junior' | 'Pleno' | 'Senior' | 'Lead' | 'Executive';
  retentionRisk: 'Low' | 'Medium' | 'High';
  avatar: string;
  skills: string[];
}

export const mockTeam: TeamMember[] = [
  {
    id: '1',
    name: 'Jane Doe',
    role: 'Principal Product Designer',
    level: 'L7 EXECUTIVE',
    pdiGoal: 'Liderança de Excelência',
    pdiProgress: 82,
    lastUpdate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    seniority: 'Executive',
    retentionRisk: 'Low',
    avatar: 'https://i.pravatar.cc/150?u=jane',
    skills: ['Design Thinking', 'Estratégia de Produto', 'Liderança']
  },
  {
    id: '2',
    name: 'Marcus Reed',
    role: 'Senior Engineering Lead',
    level: 'L6 SENIOR',
    pdiGoal: 'Arquitetura de Sistemas',
    pdiProgress: 45,
    lastUpdate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    seniority: 'Lead',
    retentionRisk: 'Medium',
    avatar: 'https://i.pravatar.cc/150?u=marcus',
    skills: ['AWS', 'Node.js', 'Arquitetura de Microserviços']
  },
  {
    id: '3',
    name: 'Sarah Chen',
    role: 'Full Stack Architect',
    level: 'L5 STAFF',
    pdiGoal: 'Estratégia de Escala',
    pdiProgress: 12,
    lastUpdate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago (RISK)
    seniority: 'Senior',
    retentionRisk: 'High',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    skills: ['React', 'TypeScript', 'GraphQL']
  },
  {
    id: '4',
    name: 'Thomas Klein',
    role: 'Operations Manager',
    level: 'L6 MANAGER',
    pdiGoal: 'Otimização de Processos',
    pdiProgress: 95,
    lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    seniority: 'Lead',
    retentionRisk: 'Low',
    avatar: 'https://i.pravatar.cc/150?u=thomas',
    skills: ['Gestão de Projetos', 'Lean Manufacturing', 'Agile']
  },
  {
    id: '5',
    name: 'Lila Amin',
    role: 'Marketing Strategist',
    level: 'L4 MID-LEVEL',
    pdiGoal: 'Performance de Conteúdo',
    pdiProgress: 68,
    lastUpdate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    seniority: 'Pleno',
    retentionRisk: 'Low',
    avatar: 'https://i.pravatar.cc/150?u=lila',
    skills: ['SEO', 'Marketing de Conteúdo', 'Análise de Dados']
  }
];

export function calculateAIHealth(member: TeamMember): 'Healthy' | 'Attention' | 'Risk' {
  const daysSinceUpdate = Math.floor((Date.now() - member.lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (member.pdiProgress < 20 && daysSinceUpdate > 30) {
    return 'Risk';
  }
  if (member.pdiProgress < 50 || daysSinceUpdate > 14) {
    return 'Attention';
  }
  return 'Healthy';
}
