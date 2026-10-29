# Gerenciador de Tarefas com IA

Aplicação full stack para gerenciar tarefas do dia a dia, com um botão que usa IA para sugerir prioridades e montar um plano para o dia com base nas tarefas pendentes.

![Tela principal do gerenciador de tarefas](imagens/print.png)

## Funcionalidades

- CRUD completo de tarefas (criar, listar, concluir/reabrir, excluir)
- Persistência em MySQL com consultas parametrizadas (proteção contra SQL Injection)
- Rota `/resumo` que lê as tarefas pendentes do banco e consulta uma API de IA
- Front-end em HTML + JavaScript puro consumindo a API via `fetch`
- Configuração por variáveis de ambiente (`.env`)

## Tecnologias

- **Back-end:** Node.js, Express
- **Banco de dados:** MySQL (`mysql2`)
- **IA:** API do Google Gemini
- **Front-end:** HTML, CSS e JavaScript

## Como rodar

### Pré-requisitos

- Node.js 18+
- MySQL 8+
- Uma chave de API do Gemini (grátis no [Google AI Studio](https://aistudio.google.com))

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/nicoleborges-nico/gerenciador-tarefas-ia.git
cd gerenciador-tarefas-ia

# 2. Instale as dependências
npm install

# 3. Crie o banco e a tabela
mysql -u root -p < schema.sql

# 4. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com sua senha do MySQL e sua chave de API

# 5. Inicie o servidor
npm start
```

Acesse `http://localhost:3000`.

## Endpoints

| Método | Rota           | Descrição                            |
| ------ | -------------- | ------------------------------------ |
| GET    | `/tarefas`     | Lista todas as tarefas               |
| POST   | `/tarefas`     | Cria uma tarefa                      |
| PUT    | `/tarefas/:id` | Atualiza título, descrição ou status |
| DELETE | `/tarefas/:id` | Remove uma tarefa                    |
| POST   | `/resumo`      | Gera o plano do dia com IA           |

## Modelo de dados

```sql
tarefas (
  id INT PK AUTO_INCREMENT,
  titulo VARCHAR(150),
  descricao TEXT,
  status ENUM('pendente', 'concluida'),
  criado_em TIMESTAMP,
  atualizado_em TIMESTAMP
)
```

## Autor

Feito por Nicole Silva Borges
