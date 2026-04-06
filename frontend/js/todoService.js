import { API_CONFIG } from "./api.js";

let cachedTodos = [];

function buildUrl(baseUrl, path) {
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
}

function buildError(response, payload) {
    const fallback = `${response.status} ${response.statusText}`;
    const error = new Error(payload?.message || payload?.detail || fallback);
    error.status = response.status;
    error.payload = payload;
    return error;
}

async function request(baseUrl, path, options = {}) {
    const response = await fetch(buildUrl(baseUrl, path), {
        credentials: "include",
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
        throw buildError(response, payload);
    }

    return payload;
}

function normalizeTodo(todo) {
    return {
        id: Number(todo.id),
        title: String(todo.title ?? ""),
        description: String(todo.description ?? ""),
        completed: Boolean(todo.completed)
    };
}

function normalizeUser(payload) {
    const user = payload?.data ?? payload;
    return {
        id: Number(user.id),
        name: String(user.name ?? ""),
        email: String(user.email ?? "")
    };
}

export async function registerUser(data) {
    const payload = await request(API_CONFIG.TASKS_BASE_URL, "/register", {
        method: "POST",
        body: JSON.stringify(data)
    });

    return normalizeUser(payload);
}

export async function loginUser(data) {
    const payload = await request(API_CONFIG.TASKS_BASE_URL, "/login", {
        method: "POST",
        body: JSON.stringify(data)
    });

    return normalizeUser(payload);
}

export async function logoutUser() {
    await request(API_CONFIG.TASKS_BASE_URL, "/logout", {
        method: "POST"
    });
    cachedTodos = [];
}

export async function getCurrentUser() {
    const payload = await request(API_CONFIG.TASKS_BASE_URL, "/me");
    return normalizeUser(payload);
}

export async function getTodos() {
    const payload = await request(API_CONFIG.TASKS_BASE_URL, "/todos");
    const todos = Array.isArray(payload?.data) ? payload.data.map(normalizeTodo) : [];
    cachedTodos = todos;
    return todos;
}

export async function createTodo(data) {
    const payload = await request(API_CONFIG.TASKS_BASE_URL, "/todos", {
        method: "POST",
        body: JSON.stringify(data)
    });
    const createdTodo = normalizeTodo(payload.data);
    cachedTodos = [...cachedTodos, createdTodo];
    return createdTodo;
}

export async function toggleTodo(id) {
    const payload = await request(API_CONFIG.TASKS_BASE_URL, `/todos/${id}/toggle`, {
        method: "PATCH"
    });
    const updatedTodo = normalizeTodo(payload.data);
    cachedTodos = cachedTodos.map(todo => (todo.id === updatedTodo.id ? updatedTodo : todo));
    return updatedTodo;
}

export async function deleteTodo(id) {
    await request(API_CONFIG.TASKS_BASE_URL, `/todos/${id}`, {
        method: "DELETE"
    });
    cachedTodos = cachedTodos.filter(todo => todo.id !== Number(id));
}

export async function getStats() {
    const payload = await request(API_CONFIG.STATS_BASE_URL, "/stats");
    return {
        total: Number(payload?.total ?? 0),
        completed: Number(payload?.completed ?? 0),
        pending: Number(payload?.pending ?? 0)
    };
}
