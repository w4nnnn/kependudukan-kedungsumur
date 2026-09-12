import type { FastifyInstance } from "fastify";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { requireAuth } from "../middlewares/auth.middleware.js";

const signinFailures = new Map<string, { count: number; resetTime: number }>();

function isSigninThrottled(ip: string, username = ""): boolean {
  const now = Date.now();
  const key = `${ip}:${username.toLowerCase().trim()}`;
  const entry = signinFailures.get(key);
  if (!entry) return false;
  if (now > entry.resetTime) {
    signinFailures.delete(key);
    return false;
  }
  return entry.count >= 10;
}

function recordSigninAttempt(ip: string, username = "", isFailure: boolean) {
  const now = Date.now();
  const key = `${ip}:${username.toLowerCase().trim()}`;
  if (!isFailure) {
    signinFailures.delete(key);
    return;
  }
  const entry = signinFailures.get(key);
  if (!entry || now > entry.resetTime) {
    signinFailures.set(key, { count: 1, resetTime: now + 60000 });
  } else {
    entry.count++;
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of signinFailures.entries()) {
    if (now > entry.resetTime) {
      signinFailures.delete(key);
    }
  }
}, 60000).unref();

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    url: "/api/auth/*",
    async handler(request, reply) {
      try {
        const isSignin = request.method === "POST" && request.url.includes("/sign-in");
        const ip = request.ip || (request.headers["x-forwarded-for"] as string) || "127.0.0.1";
        const signinUser = String((request.body as any)?.username || (request.body as any)?.email || "");

        if (isSignin && isSigninThrottled(ip, signinUser)) {
          return reply.status(429).send({
            statusCode: 429,
            error: "Too Many Requests",
            message: "Terlalu banyak percobaan login gagal. Harap tunggu beberapa saat sebelum mencoba lagi.",
          });
        }

        const protocol = request.protocol || (request.headers["x-forwarded-proto"] as string) || "http";
        const host = (request.headers["x-forwarded-host"] as string) || request.headers.host || "localhost";
        const url = new URL(request.url, `${protocol}://${host}`);
        const headers = fromNodeHeaders(request.headers);
        const hasBody = request.body && request.method !== "GET" && request.method !== "HEAD";

        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          ...(hasBody ? { body: JSON.stringify(request.body) } : {}),
        });

        const response = await auth.handler(req);

        if (isSignin) {
          const isFailure = response.status >= 400;
          recordSigninAttempt(ip, signinUser, isFailure);
        }

        reply.status(response.status);

        if (typeof (response.headers as any).getSetCookie === "function") {
          const cookies: string[] = (response.headers as any).getSetCookie();
          if (cookies && cookies.length > 0) {
            reply.header("set-cookie", cookies);
          }
        } else {
          const cookieHeader = response.headers.get("set-cookie");
          if (cookieHeader) {
            reply.header("set-cookie", cookieHeader);
          }
        }

        response.headers.forEach((value, key) => {
          if (key.toLowerCase() !== "set-cookie") {
            reply.header(key, value);
          }
        });
        
        if (response.body) {
          return reply.send(await response.text());
        }
        return reply.send();
      } catch (error: any) {
        fastify.log.error("Authentication Error:", error);
        return reply.status(500).send({ 
          error: "Internal authentication error",
          code: "AUTH_FAILURE"
        });
      }
    }
  });

  fastify.get("/api/me", { preHandler: requireAuth }, async (request, reply) => {
    const user = (request as any).user;
    
    return reply.send({
      message: "Anda berhasil mengakses rute terproteksi!",
      user: user,
    });
  });
}