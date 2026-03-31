import { API_CONFIG } from "./api.js";

let cachedTodos = [];

function buildUrl(baseUrl, path) {
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
}

async function request(baseUrl, path, options = {}) {
    const url = buildUrl(baseUrl, path);

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {})
        }
    });

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
        ? await response.json()
        : null;

    if (!response.ok) {
        const fallback = `${response.status} ${response.statusText}`;
        const message = payload?.message || payload?.detail || fallback;
        throw new Error(message);
    }

    return payload;
}

function normalizeTodo(todo) {
    return {
        id: Number(todo.id),
        title: todo.title,
        description: todo.description ?? "",
        completed: Boolean(todo.completed)
    };
}

export async function getTodos() {
    const payload = await request(API_CONFIG.LARAVEL_BASE_URL, "/todos");
    const todos = Array.isArray(payload?.data) ? payload.data.map(normalizeTodo) : [];
    cachedTodos = todos;
    return todos;
}

export async function createTodo(data) {
    const payload = await request(API_CONFIG.LARAVEL_BASE_URL, "/todos", {
        method: "POST",
        body: JSON.stringify(data)
    });

    const createdTodo = normalizeTodo(payload.data);
    cachedTodos = [...cachedTodos, createdTodo];

    return createdTodo;
}

export async function toggleTodo(id) {
    const payload = await request(API_CONFIG.LARAVEL_BASE_URL, `/todos/${id}/toggle`, {
        method: "PATCH"
    });

    const updatedTodo = normalizeTodo(payload.data);
    cachedTodos = cachedTodos.map(todo => (todo.id === updatedTodo.id ? updatedTodo : todo));
    return updatedTodo;
}

export async function deleteTodo(id) {
    await request(API_CONFIG.LARAVEL_BASE_URL, `/todos/${id}`, {
        method: "DELETE"
    });
    cachedTodos = cachedTodos.filter(todo => todo.id !== Number(id));
}

export async function getStats() {
    const payload = await request(API_CONFIG.FASTAPI_BASE_URL, "/stats");

    return {
        total: Number(payload?.total ?? 0),
        completed: Number(payload?.completed ?? 0),
        pending: Number(payload?.pending ?? 0)
    };
}

export async function createLog(action, todoId, message = null) {
    await request(API_CONFIG.EXPRESS_BASE_URL, "/logs", {
        method: "POST",
        body: JSON.stringify({
            action,
            todo_id: Number(todoId),
            message
        })
    });
}
