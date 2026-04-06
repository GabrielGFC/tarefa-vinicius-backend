import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  return Buffer.from(normalized, "base64").toString("utf8");
}

function sign(unsignedToken) {
  return createHmac("sha256", config.jwtSecret)
    .update(unsignedToken)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function createAuthToken(user) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + config.authTokenTtlSeconds;
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    iat: issuedAt,
    exp: expiresAt
  }));
  const unsignedToken = `${header}.${payload}`;
  const signature = sign(unsignedToken);

  return `${unsignedToken}.${signature}`;
}

export function verifyAuthToken(token) {
  const segments = token.split(".");

  if (segments.length !== 3) {
    throw new Error("Malformed token");
  }

  const [header, payload, signature] = segments;
  const unsignedToken = `${header}.${payload}`;
  const expectedSignature = sign(unsignedToken);

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error("Invalid signature");
  }

  const parsedPayload = JSON.parse(base64UrlDecode(payload));
  const now = Math.floor(Date.now() / 1000);

  if (typeof parsedPayload.exp !== "number" || parsedPayload.exp <= now) {
    throw new Error("Expired token");
  }

  return parsedPayload;
}
