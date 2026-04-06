const DEFAULTS = {
  SERVER_PORT: "3001",
  CORS_ORIGIN: "http://localhost:5500",
  JWT_SECRET: "change-me-super-secret-jwt",
  INTERNAL_TOKEN: "change-me-internal-token",
  LOG_SERVICE_URL: "http://localhost:8000/internal/logs",
  ANALYTICS_SERVICE_URL: "http://localhost:8001/internal/task-events",
  AUTH_COOKIE_NAME: "auth_token",
  AUTH_TOKEN_TTL_SECONDS: "604800"
};

function readEnv(name) {
  return process.env[name] ?? DEFAULTS[name];
}

export const config = {
  port: Number(readEnv("SERVER_PORT")),
  corsOrigin: readEnv("CORS_ORIGIN"),
  jwtSecret: readEnv("JWT_SECRET"),
  internalToken: readEnv("INTERNAL_TOKEN"),
  logServiceUrl: readEnv("LOG_SERVICE_URL"),
  analyticsServiceUrl: readEnv("ANALYTICS_SERVICE_URL"),
  authCookieName: readEnv("AUTH_COOKIE_NAME"),
  authTokenTtlSeconds: Number(readEnv("AUTH_TOKEN_TTL_SECONDS"))
};
