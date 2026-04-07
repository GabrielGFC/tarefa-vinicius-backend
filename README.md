# TODO List Distribuido

Sistema distribuido de TODO List com 3 servicos, 3 linguagens e 3 ORMs:

- `api-express`: servico principal de autenticacao e tarefas com Node.js + Express + Prisma
- `api-laravel`: servico interno de logs com PHP + Laravel + Eloquent
- `Api-fastapi`: servico analitico com Python + FastAPI + SQLAlchemy
- `frontend`: interface web estatica servida por Nginx
- `mysql`: banco MySQL unico com 3 schemas logicos

## Arquitetura

```text
frontend (Nginx, porta 5500)
  -> api-express (porta 3001)
      -> mysql / schema db-projeto-2026
      -> api-laravel /internal/logs (porta 8000)
      -> api-fastapi /internal/task-events (porta 8001)

frontend (Nginx, porta 5500)
  -> api-fastapi /api/stats (porta 8001)

mysql
  -> db-projeto-2026
  -> projeto-log-2026
  -> projeto-analytics-2026
```

## Responsabilidades

### Servico 1: `api-express`

- cadastro de usuario
- login e logout
- emissao de JWT em cookie HttpOnly
- rotas protegidas
- CRUD de tarefas por usuario autenticado
- outbox de integracao para logs e analytics

### Servico 2: `api-laravel`

- recepcao de logs internos via `X-Internal-Token`
- persistencia idempotente de eventos relevantes

### Servico 3: `Api-fastapi`

- recepcao de eventos internos de tarefa
- projecao analitica por usuario
- contagem de tarefas totais, concluidas e pendentes

## Portas

- `5500`: frontend
- `3001`: API de tarefas e autenticacao
- `8000`: API interna de logs
- `8001`: API de estatisticas
- `3306`: MySQL

## Requisitos

### Para rodar com Docker

- Docker Desktop
- Docker Compose v2

### Para rodar sem Docker

- Node.js 22+
- npm 10+
- PHP 8.3+
- Composer 2+
- Python 3.12+
- MySQL 8

## Estrutura

```text
tarefa-vinicius-backend/
  api-express/
  api-laravel/
  Api-fastapi/
  frontend/
  docker/
  docker-compose.yml
  README.md
```

## Execucao rapida com Docker

### 1. Subir tudo

Na raiz do projeto:

```bash
docker compose up --build
```

O Compose sobe:

- `mysql`
- `api-express`
- `api-laravel`
- `api-fastapi`
- `frontend`

### 2. Acessar o sistema

- frontend: [http://localhost:5500](http://localhost:5500)
- health express: [http://localhost:3001/api/health](http://localhost:3001/api/health)
- health laravel: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- health fastapi: [http://localhost:8001/api/health](http://localhost:8001/api/health)

### 3. Derrubar tudo

```bash
docker compose down
```

Para derrubar inclusive o volume do banco:

```bash
docker compose down -v
```

## O que o Docker faz automaticamente

### MySQL

Ao iniciar o container do MySQL, o projeto cria:

- `db-projeto-2026`
- `projeto-log-2026`
- `projeto-analytics-2026`

O script de inicializacao fica em:

- `docker/mysql/init/01-create-databases.sql`

### api-express

Ao subir o container:

- instala dependencias via `npm ci`
- gera client Prisma
- executa `npx prisma migrate deploy`
- sobe a API na porta `3001`

### api-laravel

Ao subir o container:

- instala dependencias via Composer
- executa `php artisan migrate --force`
- sobe o servidor embutido na porta `8000`

### Api-fastapi

Ao subir o container:

- instala dependencias Python via `pip`
- cria as tabelas SQLAlchemy no startup
- sobe a API na porta `8001`

### frontend

Ao subir o container:

- serve `index.html`, `css/` e `js/` via Nginx
- publica na porta `5500`

## Variaveis de ambiente principais

### api-express

```env
SERVER_PORT=3001
DATABASE_URL=mysql://root:todo_root_password@mysql:3306/db-projeto-2026
CORS_ORIGIN=http://localhost:5500
JWT_SECRET=change-me-super-secret-jwt
INTERNAL_TOKEN=change-me-internal-token
LOG_SERVICE_URL=http://api-laravel:8000/internal/logs
ANALYTICS_SERVICE_URL=http://api-fastapi:8001/internal/task-events
AUTH_COOKIE_NAME=auth_token
AUTH_TOKEN_TTL_SECONDS=604800
```

### api-laravel

```env
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=projeto-log-2026
DB_USERNAME=root
DB_PASSWORD=todo_root_password
INTERNAL_TOKEN=change-me-internal-token
CORS_ORIGIN=http://localhost:5500
```

### Api-fastapi

```env
DATABASE_URL_ANALYTICS=mysql+pymysql://root:todo_root_password@mysql:3306/projeto-analytics-2026
PORT=8001
CORS_ORIGIN=http://localhost:5500
JWT_SECRET=change-me-super-secret-jwt
INTERNAL_TOKEN=change-me-internal-token
AUTH_COOKIE_NAME=auth_token
```

## Fluxo funcional esperado

### Pelo frontend

1. abrir `http://localhost:5500`
2. criar conta
3. fazer login
4. criar tarefas
5. concluir ou excluir tarefas
6. visualizar estatisticas por usuario

### Internamente

1. o frontend chama `api-express`
2. o `api-express` persiste usuario e tarefas no schema `db-projeto-2026`
3. o `api-express` cria eventos de integracao
4. o outbox do `api-express` envia:
   - logs para `api-laravel`
   - eventos de tarefa para `api-fastapi`
5. o `api-fastapi` atualiza a projecao analitica
6. o frontend consulta `GET /api/stats`

## Contratos principais

### api-express

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`
- `GET /api/todos`
- `POST /api/todos`
- `PATCH /api/todos/:id/toggle`
- `DELETE /api/todos/:id`

### api-laravel

- `POST /internal/logs`
- `GET /internal/logs`

### Api-fastapi

- `POST /internal/task-events`
- `GET /api/stats`

## Teste manual rapido

### 1. Registrar usuario

```bash
curl -i -X POST http://localhost:3001/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Gabriel\",\"email\":\"gabriel@example.com\",\"password\":\"12345678\"}"
```

### 2. Fazer login e salvar cookie

```bash
curl -i -c cookies.txt -X POST http://localhost:3001/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"gabriel@example.com\",\"password\":\"12345678\"}"
```

### 3. Criar tarefa autenticada

```bash
curl -i -b cookies.txt -X POST http://localhost:3001/api/todos ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Estudar Docker\",\"description\":\"Subir stack completa\"}"
```

### 4. Listar tarefas do usuario autenticado

```bash
curl -i -b cookies.txt http://localhost:3001/api/todos
```

### 5. Consultar estatisticas do usuario autenticado

```bash
curl -i -b cookies.txt http://localhost:8001/api/stats
```

## Execucao manual sem Docker

Se voce quiser rodar cada servico fora do Compose, use a ordem abaixo.

### 1. Suba o MySQL

Crie manualmente os 3 bancos:

- `db-projeto-2026`
- `projeto-log-2026`
- `projeto-analytics-2026`

### 2. api-express

```bash
cd api-express
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm start
```

### 3. api-laravel

```bash
cd api-laravel
copy .env.example .env
composer install
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000
```

### 4. Api-fastapi

```bash
cd Api-fastapi
copy .env.example .env
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 5. frontend

Voce pode servir o frontend com Python:

```bash
cd frontend
python -m http.server 5500
```

Abra:

- [http://localhost:5500](http://localhost:5500)

## Logs uteis

### Ver logs de todos os containers

```bash
docker compose logs -f
```

### Ver logs de um servico especifico

```bash
docker compose logs -f api-express
docker compose logs -f api-laravel
docker compose logs -f api-fastapi
docker compose logs -f frontend
docker compose logs -f mysql
```

## Rebuild quando mudar codigo

Se alterar Dockerfile, dependencias ou codigo e quiser forcar rebuild:

```bash
docker compose up --build
```

Para rebuild limpo:

```bash
docker compose down -v
docker compose up --build
```

## Problemas comuns

### Porta em uso

Se alguma porta ja estiver ocupada, encerre o processo anterior ou ajuste o mapeamento em `docker-compose.yml`.

### Cookie nao funcionando

Use sempre:

- `http://localhost:5500`

Nao use `127.0.0.1:5500` no navegador se quiser manter o comportamento esperado dos cookies.

### Banco subiu mas as APIs falharam no inicio

Espere o MySQL ficar saudavel e rode novamente:

```bash
docker compose up --build
```

### Quero limpar tudo e recomecar

```bash
docker compose down -v
docker compose up --build
```

## Observacoes

- O projeto usa um MySQL unico com 3 schemas logicos.
- O `frontend` fala diretamente com `api-express` e `api-fastapi`.
- O `api-laravel` e o endpoint interno do `api-fastapi` nao sao para consumo direto do navegador.
- O `JWT` fica em cookie HttpOnly.

## Rotas das Apis

### API Express (Node.js) - Autenticacao e Tarefas
**Porta:** `3001`

- `GET /api/health` - Healthcheck da API.
- `POST /api/register` - Cria um novo usuario.
- `POST /api/login` - Autenticacao do usuario (define cookie HttpOnly).
- `POST /api/logout` - Encerra a sessao do usuario (limpa cookie).
- `GET /api/me` - Retorna os dados do usuario logado (Requer Autenticacao).
- `GET /api/todos` - Lista as tarefas do usuario logado (Requer Autenticacao).
- `POST /api/todos` - Cria uma nova tarefa (Requer Autenticacao).
- `PATCH /api/todos/:id/toggle` - Alterna o status (concluido/pendente) de uma tarefa (Requer Autenticacao).
- `DELETE /api/todos/:id` - Exclui uma tarefa (Requer Autenticacao).

### API Laravel (PHP) - Servico de Logs
**Porta:** `8000`

- `GET /` - Pagina de welcome padrao do Laravel.
- `GET /up` - Healthcheck interno nativo do Laravel 11.
- `GET /api/health` - Healthcheck da API.
- `POST /internal/logs` - Salva logs de auditoria (Requer Header `X-Internal-Token`).
- `GET /internal/logs` - Retorna os logs armazenados (Requer Header `X-Internal-Token`).

### API FastAPI (Python) - Servico Analitico
**Porta:** `8001`

- `GET /api/health` - Healthcheck da API.
- `POST /internal/task-events` - Recebe eventos internos de tarefas atraves do pattern de outbox (Requer Header `X-Internal-Token`).
- `GET /api/stats` - Retorna as estatisticas e contagem de tarefas do usuario logado (Requer Autenticacao via Cookie).

