import { config } from "./config.js";
import { prisma } from "./prisma.js";

const TASK_EVENT_TYPES = new Set(["todo.created", "todo.toggled", "todo.deleted"]);
let activeDispatch = null;

function toErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function mapAction(eventType) {
  const actionMap = {
    "todo.created": "todo_created",
    "todo.toggled": "todo_toggled",
    "todo.deleted": "todo_deleted",
    "auth.login_failed": "login_failed",
    "auth.access_denied": "access_denied"
  };

  return actionMap[eventType] ?? eventType;
}

function mapMessage(payload) {
  const messageMap = {
    "todo.created": "Tarefa criada.",
    "todo.toggled": "Status da tarefa alterado.",
    "todo.deleted": "Tarefa excluida.",
    "auth.login_failed": "Tentativa de login invalida.",
    "auth.access_denied": "Tentativa de acesso indevido detectada."
  };

  return payload.message ?? messageMap[payload.eventType] ?? payload.eventType;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": config.internalToken
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${responseText}`);
  }
}

function buildLogPayload(event) {
  return {
    event_id: event.id,
    user_id: event.payloadJson.userId ?? null,
    todo_id: event.payloadJson.todoId ?? null,
    action: mapAction(event.eventType),
    message: mapMessage(event.payloadJson),
    request_id: event.payloadJson.requestId,
    subject_email: event.payloadJson.subjectEmail ?? null,
    metadata: event.payloadJson
  };
}

function buildAnalyticsPayload(event) {
  if (!TASK_EVENT_TYPES.has(event.eventType)) {
    return null;
  }

  return {
    event_id: event.id,
    event_type: event.eventType,
    user_id: event.payloadJson.userId,
    todo_id: event.payloadJson.todoId,
    completed: event.payloadJson.completed,
    occurred_at: event.payloadJson.occurredAt,
    request_id: event.payloadJson.requestId
  };
}

async function markEventFailed(eventId, errorMessage) {
  await prisma.integrationEvent.update({
    where: { id: eventId },
    data: {
      status: "failed",
      lastError: errorMessage
    }
  });
}

async function markEventProcessed(eventId) {
  await prisma.integrationEvent.update({
    where: { id: eventId },
    data: {
      status: "processed",
      processedAt: new Date(),
      lastError: null
    }
  });
}

async function processEvent(event) {
  await prisma.integrationEvent.update({
    where: { id: event.id },
    data: {
      status: "processing",
      attemptCount: {
        increment: 1
      }
    }
  });

  try {
    await postJson(config.logServiceUrl, buildLogPayload(event));

    const analyticsPayload = buildAnalyticsPayload(event);
    if (analyticsPayload) {
      await postJson(config.analyticsServiceUrl, analyticsPayload);
    }

    await markEventProcessed(event.id);
  } catch (error) {
    await markEventFailed(event.id, toErrorMessage(error));
  }
}

async function runDispatchLoop() {
  while (true) {
    const events = await prisma.integrationEvent.findMany({
      where: {
        status: {
          not: "processed"
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 50
    });

    if (events.length === 0) {
      return;
    }

    for (const event of events) {
      await processEvent(event);
    }
  }
}

export async function dispatchPendingEvents() {
  if (activeDispatch) {
    return activeDispatch;
  }

  activeDispatch = runDispatchLoop().finally(() => {
    activeDispatch = null;
  });

  return activeDispatch;
}

export function scheduleDispatch() {
  void dispatchPendingEvents();
}
