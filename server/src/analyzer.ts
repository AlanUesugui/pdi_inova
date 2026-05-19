import * as fs from 'fs';
import * as csv from 'csv-parse/sync';
import * as path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

interface Competencia {
  id: string;
  id_cargo: string;
  cargo: string;
  competencia: string;
  tipo: string;
  nivel_necessario: string;
}

interface PDIResponse {
  id_colaborador: string;
  treinamento_nome: string;
  q1_conhecimento: string;
  q2_aplicacao: string;
  q3_desempenho: string;
  q4_eficacia: string;
}

interface AvaliacaoGestor {
  id_colaborador: string;
  comentarios_soft_skills: string;
  avaliacao_pessoal_texto: string;
  data: string;
}

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  gestor_id: string;
}

export const analyzeCollaborator = async (collaboratorId: string) => {
  const rootDir = path.join(__dirname, '../../');
  
  // Lê os arquivos CSV
  const parseCSV = (filename: string): any[] => {
    const filePath = path.join(rootDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    return csv.parse(content, { columns: true, skip_empty_lines: true });
  };

  const colaboradores = parseCSV('colaboradores.csv') as Colaborador[];
  const competencias = parseCSV('competencias_por_cargo.csv') as Competencia[];
  const pdiRespostas = parseCSV('pdi_respostas.csv') as PDIResponse[];
  const avaliacoes = parseCSV('avaliacoes_gestor.csv') as AvaliacaoGestor[];

  const colaborador = colaboradores.find(c => String(c.id) === String(collaboratorId));
  if (!colaborador) {
    throw new Error('Colaborador não encontrado');
  }

  if (!colaborador.gestor_id || colaborador.cargo.toLowerCase().includes('gestor')) {
    throw new Error('A análise deve ser feita apenas para colaboradores, não gestores.');
  }

  // Filtra dados relacionados
  const competenciasCargo = competencias.filter(c => c.cargo.toLowerCase() === colaborador.cargo.toLowerCase());
  const treinamentos = pdiRespostas.filter(p => String(p.id_colaborador) === String(collaboratorId));
  const feedbacks = avaliacoes.filter(a => String(a.id_colaborador) === String(collaboratorId));

  const prompt = `Você é um especialista em Recursos Humanos responsável por cruzar as competências exigidas pelo cargo com o perfil atual de um colaborador. Analise se ele atende aos requisitos do cargo atual.

**Colaborador:**
- Nome: ${colaborador.nome}
- Cargo: ${colaborador.cargo}
- Departamento: ${colaborador.departamento}

**Competências Exigidas para o Cargo:**
${competenciasCargo.map(c => `- ${c.competencia} (Tipo: ${c.tipo}, Nível Necessário: ${c.nivel_necessario})`).join('\n')}

**Treinamentos Realizados (PDI):**
${treinamentos.map(t => `- Nome: ${t.treinamento_nome} | Conhecimento: ${t.q1_conhecimento} | Aplicação: ${t.q2_aplicacao} | Desempenho: ${t.q3_desempenho} | Eficácia (Sim/Não): ${t.q4_eficacia}`).join('\n') || "Nenhum treinamento realizado."}

**Avaliação do Gestor e Comentários:**
${feedbacks.map(f => `- Data: ${f.data} | Soft Skills: ${f.comentarios_soft_skills} | Avaliação Texto: ${f.avaliacao_pessoal_texto}`).join('\n') || "Nenhuma avaliação encontrada."}

**Regras da Análise:**
1. Cruzar as competências exigidas com os treinamentos, respostas de avaliação e avaliação do gestor.
2. Considerar que no PDI: Ótimo = impacto alto, Bom = impacto médio, Ruim = impacto negativo. Eficácia "Sim" = reforço positivo, "Não" = alerta de baixa efetividade.
3. A avaliação do gestor serve como evidência qualitativa.
4. Gere um score de "score_meta_requisitos_cargo" em valor numérico inteiro de 0 a 100, baseado nesta aderência.
5. Classificação final baseada no score:
   - 85 a 100: Alta aderência ao cargo
   - 70 a 84: Boa aderência ao cargo
   - 50 a 69: Aderência parcial
   - Abaixo de 50: Baixa aderência ao cargo

Você deve responder APENAS E ESTRITAMENTE num formato JSON válido que siga a seguinte estrutura, sem nenhum texto adicional fora do JSON:
{
  "nome": "${colaborador.nome}",
  "cargo": "${colaborador.cargo}",
  "departamento": "${colaborador.departamento}",
  "competencias_exigidas": ["array de strings das competencias formatadas de forma legível (ex: Nome da Competencia (Tipo - Nivel))"],
  "treinamentos_relacionados": ["array de strings apenas com os nomes dos treinamentos"],
  "pontos_fortes": ["array de strings detalhando os pontos fortes detectados na analise"],
  "pontos_de_atencao": ["array de strings detalhando os gaps/pontos de atencao"],
  "evidencias": ["array de strings com as frases de evidencia capturadas da avaliacao do gestor"],
  "score": <numero inteiro de 0 a 100>,
  "classificacao_final": "String da classificacao correspondente",
  "recomendacoes": ["array de strings de recomendacoes acionaveis de RH baseadas no perfil e analise"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const aiResult = response.choices[0]?.message?.content;
    if (!aiResult) {
      throw new Error("Resposta da IA vazia.");
    }
    
    return JSON.parse(aiResult);
  } catch (error) {
    console.error("Erro na análise da IA OpenAI:", error);
    throw new Error("Falha ao gerar o relatório via IA da OpenAI.");
  }
};
