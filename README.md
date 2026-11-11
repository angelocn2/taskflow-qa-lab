# TaskFlow Enterprise — Gestão de Projetos, Tarefas e Operações

O **TaskFlow Enterprise** é uma plataforma web B2B para gerenciamento de portfólio de projetos, acompanhamento de sprints em quadros Kanban, governança de SLAs e análise executiva de produtividade.

---

## 1. Tecnologias Utilizadas

- **Angular 22** (Standalone Components, Signals/RxJS, Router, Reactive Forms)
- **TypeScript 6**
- **Angular CDK** (`@angular/cdk/drag-drop` para movimentação no Kanban)
- **SCSS** (Design System proprietário inspirado em ferramentas SaaS modernas)
- **RxJS** (`BehaviorSubject` e fluxos reativos de estado)
- **LocalStorage** (Persistência de sessão e dados operacionais no navegador)

---

## 2. Pré-requisitos

Certifique-se de possuir instalado em seu ambiente:

- **Node.js** `v20+` ou `v24+`
- **npm** `v10+`

---

## 3. Instalação e Execução Local

1. **Instale as dependências do projeto:**

   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento:**

   ```bash
   npm start
   ```
   *(ou `ng serve`)*

3. **Acesse a aplicação no navegador:**

   Abra `http://localhost:4200/`

4. **Build de produção (opcional):**

   ```bash
   npm run build
   ```

---

## 4. Credenciais de Acesso (Ambiente de Homologação)

A aplicação já conta com dados iniciais carregados automaticamente no primeiro acesso (projetos, tarefas, histórico de comentários, notificações e usuários).

Utilize qualquer um dos perfis abaixo na tela de login (ou clique nos atalhos rápidos disponíveis na própria interface de autenticação):

| Perfil | Nome | E-mail | Senha | Cargo / Departamento |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | Mariana Costa | `admin@taskflow.io` | `Admin@123` | Head of Product Operations |
| **Gerente** | Rafael Mendes | `gerente@taskflow.io` | `Gerente@123` | Engineering Manager |
| **Colaborador** | Lucas Ferreira | `colaborador@taskflow.io` | `Colab@123` | Senior Fullstack Engineer |

> **Dica:** Caso deseje retornar os dados do sistema ao estado original de fábrica a qualquer momento, utilize o botão **"Restaurar Base"** localizado na barra superior da aplicação.

---

## 5. Módulos Disponíveis

- **Autenticação (`/login`):** Login com sessão persistente, seleção rápida de perfis de homologação e fluxo de recuperação de senha.
- **Dashboard (`/dashboard`):** Indicadores executivos (KPIs), distribuição percentual por status, resumo por prioridade, tarefas em atraso e feed de atividades recentes.
- **Projetos (`/projects`):** Gestão completa do portfólio de projetos, visualização detalhada de escopo e tarefas vinculadas, criação, edição e exclusão.
- **Tarefas (`/tasks`):** Backlog completo com filtros combinados (busca textual, status, prioridade, responsável, projeto e período de entrega), cadastro, edição, exclusão e gaveta lateral de detalhes com histórico de comentários.
- **Quadro Kanban (`/kanban`):** Quadro ágil interativo com 4 colunas (*A fazer*, *Em andamento*, *Em revisão* e *Concluído*) com suporte a arrastar e soltar (*drag and drop*) e filtros por projeto/responsável.
- **Relatórios (`/reports`):** Painel analítico com métricas por período, tarefas por status, tabela de produtividade por responsável, projetos em andamento, tarefas atrasadas e exportação CSV.
- **Notificações (`/notifications`):** Central de alertas categorizada por novas tarefas, mudanças de status, alertas de prazo e conclusões.
- **Usuários & Acessos (`/users`):** Administração de membros da equipe, cargos, departamentos, perfis de permissão e ativação/desativação de contas.
