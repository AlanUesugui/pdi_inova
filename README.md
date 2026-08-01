# Inova Skill - HR Platform 🚀

> Uma plataforma corporativa premium de RH voltada para o monitoramento de Indicadores de Desempenho, Gestão de PDIs (Planos de Desenvolvimento Individual) e Análise de Competências assistida por Inteligência Artificial.

Este repositório contém a arquitetura integrada completa da aplicação **Inova Skill**, desenvolvida para o Grupo Jacto, trazendo um design de alta fidelidade inspirado no Stitch com gráficos dinâmicos de radar, waves de engajamento, grades de colaboradores dinâmicas e uma landing page com efeito de partículas de neurônios interativo e responsivo.

---

## 🎨 Destaques Visuais & Experiência do Usuário (UX)

*   **Página de Login com Fundo Neural**: O painel esquerdo apresenta um canvas interativo com efeito de partículas em formato de neurônios e disparos de sinapses em tons violetas (`#5B2F8C`). Os nós da rede neural são atraídos organicamente pelo movimento do cursor do usuário.
*   **Sidebar Light-Themed**: Menu lateral limpo e minimalista em tom cinza claro com destaques de cápsulas ativas em violeta suave, proporcionando navegação intuitiva.
*   **Painel Geral de Indicadores**: 
    *   **Insights por IA**: Card integrado com efeito de digitação simulada gerando diagnósticos comportamentais em tempo real.
    *   **Matriz de Competências (Radar)**: Gráfico de radar vetorial (SVG puro) de alta performance exibindo a média das competências do time em relação à meta baseline da empresa.
    *   **Curva de Engajamento**: Gráfico linear vetorial demonstrando métricas de eNPS (78), satisfação e retenção ativa.
    *   **Performance Individual**: Tabela interativa alimentada por banco de dados SQLite interno apresentando status e percentuais de progresso de cada colaborador.
*   **Gestão de PDIs Card Grid**: Tela de time redesenhada em formato de cartões interativos de alta fidelidade. Permite ações corporativas como **Dar Feedback** (com drawer de relatórios) e **Validar Marco** (com notificações instantâneas).

---

## 🛠️ Stack Tecnológica

### Frontend (`/client`)
*   **React** (Vite + TypeScript)
*   **Tailwind CSS** (para estilizações e classes utilitárias)
*   **Framer Motion** (para transições suaves e micro-animações premium)
*   **Lucide React** (para o conjunto de ícones modernos e responsivos)
*   **Axios** (para comunicação de rede e requisições HTTP)

### Backend (`/server`)
*   **Node.js + Express** (para APIs REST rápidas e eficientes)
*   **PostgreSQL (Supabase)** (banco de dados relacional na nuvem para persistência estável)
*   **TypeScript** (para segurança estática de tipos no backend)

---

## ⚙️ Configuração e Inicialização Local

Siga os passos abaixo para configurar o repositório em sua máquina:

### 1. Configuração do Banco de Dados (Supabase)
1. Crie uma conta gratuita no [Supabase](https://supabase.com/).
2. Crie um novo projeto.
3. Vá em **Project Settings** > **Database** e copie a **Connection String** (URI de conexão direta do PostgreSQL, exemplo: `postgresql://postgres:senha@db.supabase.co:5432/postgres`).

### 2. Configuração das Variáveis de Ambiente (.env)

Crie os arquivos `.env` nos respectivos diretórios:

#### Backend (`/server/.env`)
```env
DATABASE_URL=sua_connection_string_do_supabase_aqui
PORT=3001
OPENAI_API_KEY=sua_chave_openai_aqui (opcional, para insights automáticos)
```

#### Frontend (`/client/.env`)
```env
VITE_API_URL=http://localhost:3001
```

### 3. Instalação das Dependências

Instale as dependências a partir da raiz do projeto:
```bash
# Na pasta raiz
npm install
npm run install:all
```

### 4. Inicializando o Banco de Dados (Seeding)

Compile o backend e execute o script de migração e seeding para popular o banco no Supabase com os dados reais e mocks dos CSVs:
```bash
cd server
npm run build
npm run db:init
```

### 5. Executando em Ambiente de Desenvolvimento

Para rodar o projeto inteiro simultaneamente (Servidor na porta `3001` e Frontend na porta `5173`):
```bash
# No diretório raiz do projeto
npm run dev
```

Acesse o navegador em [http://localhost:5173](http://localhost:5173).

---

## 🚀 Hospedagem e Deploy (Render + Supabase)

### 1. Deploy do Backend no Render (Web Service)
1. Conecte seu repositório GitHub ao Render.
2. Crie um novo **Web Service**.
3. Configure os seguintes campos:
   * **Root Directory**: `server`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
4. Em **Environment Variables**, adicione:
   * `DATABASE_URL`: *A String de Conexão do Supabase*
   * `OPENAI_API_KEY`: *Sua chave OpenAI (opcional)*
5. Conclua a criação do Web Service e aguarde a inicialização. Copie a URL gerada (ex: `https://pdi-inova-backend.onrender.com`).

*(Opcional)*: Para inicializar o banco diretamente em produção na primeira execução, você pode rodar o comando `npm run db:init` no painel de controle (Shell) do Render ou provisoriamente ajustar o **Start Command** para `npm run db:init && npm run start`.

### 2. Deploy do Frontend no Render (Static Site)
1. Crie um novo **Static Site** no Render.
2. Conecte ao mesmo repositório GitHub.
3. Configure os campos:
   * **Root Directory**: `client`
   * **Build Command**: `npm install && npm run build`
   * **Publish Directory**: `dist`
4. Em **Environment Variables**, adicione:
   * `VITE_API_URL`: *A URL gerada pelo Web Service do Backend* (ex: `https://pdi-inova-backend.onrender.com`)
5. Clique em implantar.

---

## 🔒 Credenciais de Acesso (Teste)

A plataforma inicializa os logins dos gestores no banco. Utilize as credenciais abaixo para testar:

*   **E-mail**: `bruno@pdi.com`
*   **Senha**: `123456`

---

## 📁 Estrutura de Pastas Principal

```text
├── client/                     # Código fonte do frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # Componentes React (Sidebar, Login, TeamManagement)
│   │   ├── utils/
│   │   │   └── api.ts          # Cliente Axios centralizado para consumo da API
│   │   ├── App.tsx             # Componente de controle principal (Painel Geral)
│   │   ├── index.css           # Estilizações globais e variáveis de marca
│   │   └── main.tsx
│   └── package.json
│
├── server/                     # Código fonte do backend (Express + PostgreSQL Wrapper)
│   ├── src/
│   │   ├── server.ts           # Inicialização do express e rotas da API
│   │   ├── db.ts               # Wrapper de banco e esquemas do Postgres
│   │   └── initDb.ts           # Script de migração e seeding de dados (CSV -> Postgres)
│   ├── data/                   # Arquivos fonte CSV para seed do banco
│   └── package.json
│
└── README.md                   # Documentação global do projeto
```

Desenvolvido com carinho para otimização de carreiras e desenvolvimento contínuo de equipes! 🌟
