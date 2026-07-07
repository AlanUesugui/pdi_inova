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
*   **SQLite** (banco de dados local rápido para persistência de colaboradores e PDIs)
*   **TypeScript** (para segurança estática de tipos no backend)

---

## ⚙️ Configuração e Inicialização Local

Siga os passos abaixo para configurar o repositório em sua máquina:

### 1. Pré-requisitos
*   [Node.js](https://nodejs.org/) (versão LTS recomendada)
*   [NPM](https://www.npmjs.com/) ou Yarn

### 2. Instalação das Dependências

Instale as dependências tanto para o servidor quanto para o cliente a partir do diretório raiz:

```bash
# Instala as dependências do servidor
cd server
npm install

# Instala as dependências do frontend (cliente)
cd ../client
npm install
```

### 3. Executando em Ambiente de Desenvolvimento

Para rodar o projeto inteiro simultaneamente (Servidor na porta `3001` e Frontend na porta `5173`):

1.  **Inicie o Servidor Backend**:
    ```bash
    cd server
    npm run dev
    ```

2.  **Inicie o Cliente Frontend**:
    ```bash
    cd client
    npm run dev
    ```

Acesse o navegador em [http://localhost:5173](http://localhost:5173).

### 4. Compilação para Produção (Build)

Para testar a compilação final e verificar se todos os tipos TypeScript estão estritamente corretos:

```bash
# Compilar cliente
cd client
npm run build
```

---

## 🔒 Credenciais de Acesso (Teste)

A plataforma carrega automaticamente os gestores e seus respectivos colaboradores a partir do banco SQLite pré-configurado. Para testar o login de gestor, utilize as credenciais abaixo:

*   **E-mail**: `bruno@pdi.com`
*   **Senha**: `123456`

---

## 📁 Estrutura de Pastas Principal

```text
├── client/                     # Código fonte do frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # Componentes React (Sidebar, Login, TeamManagement)
│   │   ├── App.tsx             # Componente de controle principal (Painel Geral)
│   │   ├── index.css           # Estilizações globais e variáveis de marca
│   │   └── main.tsx
│   └── package.json
│
├── server/                     # Código fonte do backend (Express + SQLite)
│   ├── src/
│   │   ├── server.ts           # Inicialização do express e rotas da API
│   │   └── db.ts               # Integração e mapeamento do banco SQLite
│   ├── data/                   # Arquivos fonte CSV para seed do banco
│   └── package.json
│
└── README.md                   # Documentação global do projeto
```

Desenvolvido com carinho para otimização de carreiras e desenvolvimento contínuo de equipes! 🌟
