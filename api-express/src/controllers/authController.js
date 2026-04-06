import { createAuthToken } from "../lib/jwt.js";
import { setAuthCookie, clearAuthCookie } from "../lib/cookies.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import { scheduleDispatch } from "../lib/outbox.js";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildValidationError(errors) {
  return {
    message: "Validation error",
    errors
  };
}

async function recordLoginFailedEvent(requestId, subjectEmail) {
  await prisma.integrationEvent.create({
    data: {
      eventType: "auth.login_failed",
      payloadJson: {
        eventType: "auth.login_failed",
        requestId,
        subjectEmail,
        occurredAt: new Date().toISOString(),
        message: "Tentativa de login invalida."
      }
    }
  });

  scheduleDispatch();
}

export async function register(request, response) {
  const name = String(request.body?.name ?? "").trim();
  const email = normalizeEmail(request.body?.email);
  const password = String(request.body?.password ?? "");
  const errors = {};

  if (name.length < 2) {
    errors.name = ["The name field must contain at least 2 characters."];
  }

  if (!validateEmail(email)) {
    errors.email = ["The email field must contain a valid email address."];
  }

  if (password.length < 8) {
    errors.password = ["The password field must contain at least 8 characters."];
  }

  if (Object.keys(errors).length > 0) {
    response.status(422).json(buildValidationError(errors));
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    response.status(409).json({ message: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash
    }
  });

  setAuthCookie(response, createAuthToken(user));
  response.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email
  });
}

export async function login(request, response) {
  const email = normalizeEmail(request.body?.email);
  const password = String(request.body?.password ?? "");
  const errors = {};

  if (!validateEmail(email)) {
    errors.email = ["The email field must contain a valid email address."];
  }

  if (password.length === 0) {
    errors.password = ["The password field is required."];
  }

  if (Object.keys(errors).length > 0) {
    response.status(422).json(buildValidationError(errors));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordLoginFailedEvent(request.requestId, email);
    response.status(401).json({ message: "Invalid credentials" });
    return;
  }

  setAuthCookie(response, createAuthToken(user));
  response.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email
  });
}

export function logout(_request, response) {
  clearAuthCookie(response);
  response.status(204).end();
}

export function me(request, response) {
  response.status(200).json({
    id: request.auth.userId,
    name: request.auth.name,
    email: request.auth.email
  });
}
