# API Contract - To-Do List Microsserviços

## Laravel (`api-laravel`)

### `GET /api/todos`
- Resposta `200`:
```json
{ "data": [{ "id": 1, "title": "Tarefa", "description": "Texto", "completed": false }] }
```

### `POST /api/todos`
- Request:
```json
{ "title": "Nova tarefa", "description": "Opcional" }
```
- Resposta `201`:
```json
{ "data": { "id": 1, "title": "Nova tarefa", "description": "Opcional", "completed": false } }
```

### `PATCH /api/todos/{id}/toggle`
- Resposta `200`: `{ "data": Todo }`

### `DELETE /api/todos/{id}`
- Resposta `204` sem body

## Express (`api-express`)

### `POST /api/logs`
- Request:
```json
{ "action": "create", "todo_id": 1, "message": "Tarefa criada." }
```
- Resposta `201`:
```json
{ "data": { "id": 1, "action": "create", "todo_id": 1, "message": "Tarefa criada.", "created_at": "..." } }
```

### `GET /api/logs`
- Resposta `200`:
```json
{ "data": [{ "id": 1, "action": "create", "todo_id": 1, "message": "Tarefa criada.", "created_at": "..." }] }
```

## FastAPI (`api-fastapi`)

### `GET /api/stats`
- Resposta `200`:
```json
{
  "total": 10,
  "completed": 4,
  "pending": 6,
  "total_logs": 14,
  "most_frequent_action": "create",
  "average_logs_per_todo": 1.4
}
```
