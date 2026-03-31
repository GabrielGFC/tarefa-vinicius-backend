import {
    createLog,
    createTodo,
    deleteTodo,
    getStats,
    getTodos,
    toggleTodo
} from "./todoService.js";

const form = document.getElementById("todoForm");
const todoList = document.getElementById("todoList");
const totalSpan = document.getElementById("total");
const completedSpan = document.getElementById("completed");
const pendingSpan = document.getElementById("pending");
const statusMessage = document.getElementById("statusMessage");

function setStatus(message, type = "info") {
    statusMessage.textContent = message;
    statusMessage.classList.remove("error", "warning");
    if (type === "error") {
        statusMessage.classList.add("error");
    }
    if (type === "warning") {
        statusMessage.classList.add("warning");
    }
}

function renderStats(stats) {
    totalSpan.textContent = stats.total;
    completedSpan.textContent = stats.completed;
    pendingSpan.textContent = stats.pending;
}

function renderTodosList(todos) {
    todoList.innerHTML = "";

    todos.forEach(todo => {
        const li = document.createElement("li");
        if (todo.completed) {
            li.classList.add("completed");
        }

        li.innerHTML = `
            <span>${todo.title}</span>
            <div class="actions">
                <button class="btn-complete">✔</button>
                <button class="btn-delete">✖</button>
            </div>
        `;

        li.querySelector(".btn-complete").addEventListener("click", async () => {
            try {
                const updatedTodo = await toggleTodo(todo.id);
                try {
                    await createLog("toggle", updatedTodo.id, "Status da tarefa alterado.");
                } catch (logError) {
                    setStatus(`Tarefa atualizada, mas falhou ao registrar log: ${logError.message}`, "warning");
                }
                await refresh();
            } catch (error) {
                setStatus(`Erro ao atualizar tarefa: ${error.message}`, "error");
            }
        });

        li.querySelector(".btn-delete").addEventListener("click", async () => {
            try {
                await deleteTodo(todo.id);
                try {
                    await createLog("delete", todo.id, "Tarefa excluída.");
                } catch (logError) {
                    setStatus(`Tarefa excluída, mas falhou ao registrar log: ${logError.message}`, "warning");
                }
                await refresh();
            } catch (error) {
                setStatus(`Erro ao excluir tarefa: ${error.message}`, "error");
            }
        });

        todoList.appendChild(li);
    });
}

async function refresh() {
    const [todos, stats] = await Promise.all([getTodos(), getStats()]);
    renderTodosList(todos);
    renderStats(stats);
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!title) {
        setStatus("Título é obrigatório.", "error");
        return;
    }

    try {
        const createdTodo = await createTodo({ title, description });
        try {
            await createLog("create", createdTodo.id, "Tarefa criada.");
        } catch (logError) {
            setStatus(`Tarefa criada, mas falhou ao registrar log: ${logError.message}`, "warning");
        }

        form.reset();
        await refresh();
        if (!statusMessage.classList.contains("warning")) {
            setStatus("Operação concluída.");
        }
    } catch (error) {
        setStatus(`Erro ao criar tarefa: ${error.message}`, "error");
    }
});

refresh().catch(error => {
    renderStats({ total: 0, completed: 0, pending: 0 });
    setStatus(`Falha ao carregar dados iniciais: ${error.message}`, "error");
});
