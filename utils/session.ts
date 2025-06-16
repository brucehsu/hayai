import { getCookies, setCookie } from "$std/http/cookie.ts";

export interface SessionData {
  userId: number;
  email: string;
  name: string;
}

const SESSION_SECRET = Deno.env.get("SESSION_SECRET") || "default-secret-key";

// Simple session storage (in production, use Redis or database)
const sessions = new Map<string, SessionData>();

export async function createSession(data: SessionData): Promise<string> {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, data);
  return sessionId;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  return sessions.get(token) || null;
}

export function getSessionFromRequest(request: Request): Promise<SessionData | null> {
  const cookies = getCookies(request.headers);
  const sessionToken = cookies.session;
  
  if (!sessionToken) {
    return Promise.resolve(null);
  }
  
  return verifySession(sessionToken);
}

export function setSessionCookie(headers: Headers, token: string): void {
  setCookie(headers, {
    name: "session",
    value: token,
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export function clearSessionCookie(headers: Headers): void {
  setCookie(headers, {
    name: "session",
    value: "",
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: "Lax",
    maxAge: 0,
    path: "/",
  });
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
} 