import { prisma } from "../lib/prisma.js";
import { parseCookies } from "../lib/cookies.js";
import { config } from "../lib/config.js";
import { verifyAuthToken } from "../lib/jwt.js";

export async function requireAuth(request, response, next) {
  const cookies = parseCookies(request.headers.cookie ?? "");
  const token = cookies[config.authCookieName];

  if (!token) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const userId = Number(payload.sub);
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      response.status(401).json({ message: "Authentication required" });
      return;
    }

    request.auth = {
      userId: user.id,
      name: user.name,
      email: user.email
    };
    next();
  } catch (_error) {
    response.status(401).json({ message: "Authentication required" });
  }
}
