# Smoke Checklist - To-Do List Microsserviços

## 1) Estrutura

- [ ] Existe `frontend/`
- [ ] Existe `api-laravel/`
- [ ] Existe `api-express/`
- [ ] Existe `api-fastapi/`

## 2) Laravel (tarefas)

- [ ] `.env` com `DB_CONNECTION=mysql` e `DB_DATABASE=db-projeto-2026`
- [ ] Migration de `todos` com `title`, `description`, `completed`
- [ ] `GET /api/todos` responde `200`
- [ ] `POST /api/todos` cria tarefa
- [ ] `PATCH /api/todos/{id}/toggle` alterna status
- [ ] `DELETE /api/todos/{id}` remove tarefa

## 3) Express (logs)

- [ ] `src/server.js` existe na raiz de `src/`
- [ ] `src/controllers/logController.js` existe
- [ ] `src/routes/logRoutes.js` existe
- [ ] `prisma/schema.prisma` contém model `Log`
- [ ] `POST /api/logs` cria log
- [ ] `GET /api/logs` lista logs

## 4) FastAPI (estatísticas)

- [ ] `app/database.py`, `main.py`, `models_logs.py`, `models_todos.py`, `schemas.py`
- [ ] `app/service/stats_service.py` existe
- [ ] `.env` com `DATABASE_URL_LARAVEL`, `DATABASE_URL_EXPRESS`, `PORT=8000`
- [ ] `GET /api/stats` retorna `total`, `completed`, `pending`

## 5) Integração fim a fim

- [ ] Criar tarefa no frontend gera registro em `api-express`
- [ ] Alternar tarefa no frontend gera log
- [ ] Excluir tarefa no frontend gera log
- [ ] Estatísticas atualizam via `api-fastapi`
