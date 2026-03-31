import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function buildValidationError(errors) {
  return {
    message: "Validation error",
    errors
  };
}

export async function listLogs(_request, response) {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { id: "desc" }
    });
    response.status(200).json({ data: logs });
  } catch (error) {
    response.status(500).json({
      message: "Failed to list logs",
      detail: error.message
    });
  }
}

export async function createLog(request, response) {
  const { action, todo_id, message = null } = request.body ?? {};
  const errors = {};

  if (typeof action !== "string" || action.trim().length === 0) {
    errors.action = ["The action field is required."];
  }

  const todoIdNumber = Number(todo_id);
  if (!Number.isInteger(todoIdNumber) || todoIdNumber <= 0) {
    errors.todo_id = ["The todo_id field must be a positive integer."];
  }

  if (message !== null && typeof message !== "string") {
    errors.message = ["The message field must be a string or null."];
  }

  if (Object.keys(errors).length > 0) {
    response.status(422).json(buildValidationError(errors));
    return;
  }

  try {
    const log = await prisma.log.create({
      data: {
        action: action.trim(),
        todo_id: todoIdNumber,
        message: message?.trim?.() ?? null
      }
    });

    response.status(201).json({ data: log });
  } catch (error) {
    response.status(500).json({
      message: "Failed to create log",
      detail: error.message
    });
  }
}
