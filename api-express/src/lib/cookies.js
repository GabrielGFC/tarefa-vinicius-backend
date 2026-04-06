import { config } from "./config.js";

export function parseCookies(headerValue = "") {
  return headerValue
    .split(";")
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex === -1) {
        return cookies;
      }

      const name = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function serializeCookie(name, value, options = {}) {
  const cookieParts = [`${name}=${encodeURIComponent(value)}`];

  if (options.httpOnly) {
    cookieParts.push("HttpOnly");
  }

  if (options.sameSite) {
    cookieParts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    cookieParts.push("Secure");
  }

  if (options.path) {
    cookieParts.push(`Path=${options.path}`);
  }

  if (typeof options.maxAge === "number") {
    cookieParts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires) {
    cookieParts.push(`Expires=${options.expires.toUTCString()}`);
  }

  return cookieParts.join("; ");
}

export function setAuthCookie(response, token) {
  response.setHeader("Set-Cookie", serializeCookie(config.authCookieName, token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
    path: "/",
    maxAge: config.authTokenTtlSeconds
  }));
}

export function clearAuthCookie(response) {
  response.setHeader("Set-Cookie", serializeCookie(config.authCookieName, "", {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
    path: "/",
    maxAge: 0,
    expires: new Date(0)
  }));
}
