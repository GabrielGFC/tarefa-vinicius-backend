import {
    createTodo,
    deleteTodo,
    getCurrentUser,
    getStats,
    getTodos,
    loginUser,
    logoutUser,
    registerUser,
    toggleTodo
} from "./todoService.js";

const statusMessage = document.getElementById("statusMessage");
const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const logoutButton = document.getElementById("logoutButton");
const currentUserName = document.getElementById("currentUserName");
const currentUserEmail = document.getElementById("currentUserEmail");
const todoForm = document.getElementById("todoForm");
const todoList = document.getElementById("todoList");
const emptyState = document.getElementById("emptyState");
const totalSpan = document.getElementById("total");
const completedSpan = document.getElementById("completed");
const pendingSpan = document.getElementById("pending");

let currentUser = null;

function setStatus(message = "", type = "info") {
    statusMessage.textContent = message;
    statusMessage.className = "status";
    if (type !== "info") {
        statusMessage.classList.add(type);
    }
}

function showApp(user) {
    currentUser = user;
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    currentUserName.textContent = user.name;
    currentUserEmail.textContent = user.email;
}

function showAuth() {
    currentUser = null;
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    currentUserName.textContent = "Usuario";
    currentUserEmail.textContent = "";
    todoList.innerHTML = "";
    renderStats({ total: 0, completed: 0, pending: 0 });
}

function renderStats(stats) {
    totalSpan.textContent = stats.total;
    completedSpan.textContent = stats.completed;
    pendingSpan.textContent = stats.pending;
}

function createActionButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
}

function renderTodosList(todos) {
    todoList.innerHTML = "";
    emptyState.classList.toggle("hidden", todos.length > 0);

    todos.forEach(todo => {
        const item = document.createElement("li");
        item.className = "todo-item";
        if (todo.completed) {
            item.classList.add("completed");
        }

        const content = document.createElement("div");
        content.className = "todo-content";

        const title = document.createElement("strong");
        title.textContent = todo.title;
        content.appendChild(title);

        if (todo.description) {
            const description = document.createElement("p");
            description.textContent = todo.description;
            content.appendChild(description);
        }

        const actions = document.createElement("div");
        actions.className = "actions";
        actions.appendChild(createActionButton("Concluir", "btn-complete", async () => {
            try {
                await toggleTodo(todo.id);
                await refresh();
                setStatus("Tarefa atualizada com sucesso.", "success");
            } catch (error) {
                handleError("Erro ao atualizar tarefa", error);
            }
        }));
        actions.appendChild(createActionButton("Excluir", "btn-delete", async () => {
            try {
                await deleteTodo(todo.id);
                await refresh();
                setStatus("Tarefa excluida com sucesso.", "success");
            } catch (error) {
                handleError("Erro ao excluir tarefa", error);
            }
        }));

        item.appendChild(content);
        item.appendChild(actions);
        todoList.appendChild(item);
    });
}

function handleError(prefix, error) {
    if (error?.status === 401) {
        showAuth();
        setStatus("Sua sessao expirou. Entre novamente.", "warning");
        return;
    }

    setStatus(`${prefix}: ${error.message}`, "error");
}

async function refresh() {
    const [todos, stats] = await Promise.all([getTodos(), getStats()]);
    renderTodosList(todos);
    renderStats(stats);
}

loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    try {
        const user = await loginUser({
            email: document.getElementById("loginEmail").value.trim(),
            password: document.getElementById("loginPassword").value
        });
        loginForm.reset();
        showApp(user);
        await refresh();
        setStatus("Login realizado com sucesso.", "success");
    } catch (error) {
        handleError("Falha ao entrar", error);
    }
});

registerForm.addEventListener("submit", async event => {
    event.preventDefault();

    try {
        const user = await registerUser({
            name: document.getElementById("registerName").value.trim(),
            email: document.getElementById("registerEmail").value.trim(),
            password: document.getElementById("registerPassword").value
        });
        registerForm.reset();
        showApp(user);
        await refresh();
        setStatus("Conta criada com sucesso.", "success");
    } catch (error) {
        handleError("Falha ao criar conta", error);
    }
});

logoutButton.addEventListener("click", async () => {
    try {
        await logoutUser();
        showAuth();
        setStatus("Sessao encerrada.", "success");
    } catch (error) {
        handleError("Falha ao encerrar sessao", error);
    }
});

todoForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!title) {
        setStatus("Titulo e obrigatorio.", "error");
        return;
    }

    try {
        await createTodo({ title, description });
        todoForm.reset();
        await refresh();
        setStatus("Tarefa criada com sucesso.", "success");
    } catch (error) {
        handleError("Erro ao criar tarefa", error);
    }
});

async function bootstrap() {
    try {
        const user = await getCurrentUser();
        showApp(user);
        await refresh();
    } catch (error) {
        if (error?.status === 401) {
            showAuth();
            setStatus("Entre com sua conta para acessar suas tarefas.");
            return;
        }

        showAuth();
        handleError("Falha ao carregar estado inicial", error);
    }
}

bootstrap();
