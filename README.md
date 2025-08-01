# Chute Inicial - Sistema de Gestão para Escolinha de Futebol

## Visão Geral do Projeto
Este é um web app full-stack desenvolvido para automatizar a gestão de uma escolinha de futebol. O projeto resolve o problema de anotações manuais de frequência e gerenciamento de alunos, fornecendo uma interface prática para administradores e uma área dedicada para os responsáveis.

## Funcionalidades Principais
- **Gerenciamento de Alunos:** Operações completas de CRUD (Criação, Leitura, Edição e Exclusão) para alunos.
- **Autenticação e Roles:** Sistema de login com diferenciação de papéis para `administrador` e `responsável`.
- **Registro de Frequência:** Ferramenta para gerenciar e visualizar o histórico de presença dos alunos nas aulas.
- **Modelagem de Dados:** Estrutura de banco de dados no Firestore otimizada para relacionamentos (um responsável pode ter múltiplos alunos).
- **Responsividade:** Layout adaptável para dispositivos móveis e desktops.

## Tecnologias Utilizadas
- **Frontend:** React, JavaScript, HTML, CSS
- **Framework CSS:** Tailwind CSS
- **Backend:** Firebase (Authentication, Firestore, Cloud Functions)
- **Roteamento:** React Router DOM

## Acesso à Demonstração

Para explorar o painel administrativo e a área dos responsáveis, utilize as seguintes credenciais em https://chute-inicial-webapp.vercel.app/

**Credenciais de Administrador:**
- **E-mail:** `admin@teste.com`
- **Senha:** `chuteinicial123`

**Observação Importante sobre Segurança:**
Estes são dados de login de uma conta de demonstração em um ambiente não-produtivo, criados exclusivamente para avaliação do projeto. Em uma aplicação real, credenciais de acesso jamais seriam expostas publicamente.

## Como Executar o Projeto Localmente
1. Clone o repositório: `git clone https://github.com/Eduarddoribeiro/chute-inicial-webapp`
2. Instale as dependências: `npm install`
3. Crie um projeto Firebase e configure suas credenciais em um arquivo `.env.local`...
4. Faça o deploy das Cloud Functions...
5. Inicie o servidor de desenvolvimento: `npm run dev`

## Contato
- LinkedIn: https://www.linkedin.com/in/carloseduardoribeirodefraga/
