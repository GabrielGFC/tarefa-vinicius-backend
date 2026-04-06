import { prisma } from "../lib/prisma.js";
import { scheduleDispatch } from "../lib/outbox.js";

function buildValidationError(errors) {
  return {
    message: "Validation error",
    errors
  };
}

function normalizeDescription(description) {
  return String(description ?? "").trim();
}

function normalizeTitle(title) {
  return String(title ?? "").trim();
}

async function recordAccessDeniedEvent(request, todoOwnerId, todoId) {
  await prisma.integrationEvent.create({
    data: {
      eventType: "auth.access_denied",
      payloadJson: {
        eventType: "auth.access_denied",
        requestId: request.requestId,
        userId: request.auth.userId,
        todoId,
        ownerUserId: todoOwnerId,
        occurredAt: new Date().toISOString(),
        message: "Tentativa de acesso indevido detectada."
      }
    }
  });

  scheduleDispatch();
}

function serializeTodo(todo) {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    completed: todo.completed
  };
}

export async function listTodos(request, response) {
  const todos = await prisma.todo.findMany({
    where: {
      userId: request.auth.userId
    },
    orderBy: {
      id: "asc"
    }
  });

  response.status(200).json({
    data: todos.map(serializeTodo)
  });
}

export async function createTodo(request, response) {
  const title = normalizeTitle(request.body?.title);
  const description = normalizeDescription(request.body?.description);
  const errors = {};

  if (title.length === 0) {
    errors.title = ["The title field is required."];
  }

  if (title.length > 255) {
    errors.title = ["The title field must not exceed 255 characters."];
  }

  if (description.length > 255) {
    errors.description = ["The description field must not exceed 255 characters."];
  }

  if (Object.keys(errors).length > 0) {
    response.status(422).json(buildValidationError(errors));
    return;
  }

  const todo = await prisma.$transaction(async transaction => {
    const createdTodo = await transaction.todo.create({
      data: {
        title,
        description,
        completed: false,
        userId: request.auth.userId
      }
    });

    await transaction.integrationEvent.create({
      data: {
        eventType: "todo.created",
        payloadJson: {
          eventType: "todo.created",
          requestId: request.requestId,
          userId: request.auth.userId,
          todoId: createdTodo.id,
          completed: createdTodo.completed,
          title: createdTodo.title,
          description: createdTodo.description,
          occurredAt: new Date().toISOString(),
          message: "Tarefa criada."
        }
      }
    });

    return createdTodo;
  });

  scheduleDispatch();
  response.status(201).json({
    data: serializeTodo(todo)
  });
}

export async function toggleTodo(request, response) {
  const todoId = Number(request.params.id);

  if (!Number.isInteger(todoId) || todoId <= 0) {
    response.status(422).json(buildValidationError({
      id: ["The id parameter must be a positive integer."]
    }));
    return;
  }

  const existingTodo = await prisma.todo.findUnique({
    where: { id: todoId }
  });

  if (!existingTodo) {
    response.status(404).json({ message: "Todo not found" });
    return;
  }

  if (existingTodo.userId !== request.auth.userId) {
    await recordAccessDeniedEvent(request, existingTodo.userId, existingTodo.id);
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const updatedTodo = await prisma.$transaction(async transaction => {
    const toggledTodo = await transaction.todo.update({
      where: { id: existingTodo.id },
      data: {
        completed: !existingTodo.completed
      }
    });

    await transaction.integrationEvent.create({
      data: {
        eventType: "todo.toggled",
        payloadJson: {
          eventType: "todo.toggled",
          requestId: request.requestId,
          userId: request.auth.userId,
          todoId: toggledTodo.id,
          completed: toggledTodo.completed,
          occurredAt: new Date().toISOString(),
          message: "Status da tarefa alterado."
        }
      }
    });

    return toggledTodo;
  });

  scheduleDispatch();
  response.status(200).json({
    data: serializeTodo(updatedTodo)
  });
}

export async function deleteTodo(request, response) {
  const todoId = Number(request.params.id);

  if (!Number.isInteger(todoId) || todoId <= 0) {
    response.status(422).json(buildValidationError({
      id: ["The id parameter must be a positive integer."]
    }));
    return;
  }

  const existingTodo = await prisma.todo.findUnique({
    where: { id: todoId }
  });

  if (!existingTodo) {
    response.status(404).json({ message: "Todo not found" });
    return;
  }

  if (existingTodo.userId !== request.auth.userId) {
    await recordAccessDeniedEvent(request, existingTodo.userId, existingTodo.id);
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  await prisma.$transaction(async transaction => {
    await transaction.todo.delete({
      where: { id: existingTodo.id }
    });

    await transaction.integrationEvent.create({
      data: {
        eventType: "todo.deleted",
        payloadJson: {
          eventType: "todo.deleted",
          requestId: request.requestId,
          userId: request.auth.userId,
          todoId: existingTodo.id,
          completed: existingTodo.completed,
          occurredAt: new Date().toISOString(),
          message: "Tarefa excluida."
        }
      }
    });
  });

  scheduleDispatch();
  response.status(204).end();
}
