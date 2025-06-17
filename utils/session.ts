import { getCookies, setCookie } from "$std/http/cookie.ts";
import { createUser, getUserByGuestId, type User } from "../db/database.ts";

export interface SessionData {
  userId: number;
  email: string;
  name: string;
  oauth_type?: "google" | "guest";
}

export interface ExtendedSessionData extends SessionData {
  isGuest: boolean;
  isLoggedIn: boolean; // true only for OAuth users
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

export async function getExtendedSessionFromRequest(request: Request): Promise<ExtendedSessionData | null> {
  const session = await getSessionFromRequest(request);
  
  if (!session) {
    return null;
  }
  
  const isGuest = session.oauth_type === "guest";
  const isLoggedIn = session.oauth_type === "google";
  
  return {
    ...session,
    isGuest,
    isLoggedIn
  };
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

// Generate a fingerprint based on IP and user agent for guest users
export async function generateGuestFingerprint(request: Request): Promise<string> {
  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  // Create a simple hash of IP + User Agent
  const data = `${ip}:${userAgent}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  
  return `guest_${hashHex.substring(0, 16)}`;
}

// Create or get guest user and return session data
export async function getOrCreateGuestUser(request: Request): Promise<{ user: User; sessionData: SessionData }> {
  const fingerprint = await generateGuestFingerprint(request);
  
  // Check if guest user already exists
  let user = getUserByGuestId(fingerprint);
  
  if (!user) {
    // Create new guest user
    const guestName = `Guest ${fingerprint.substring(6, 12)}`;
    user = createUser({
      email: `${fingerprint}@guest.local`,
      name: guestName,
      oauth_id: fingerprint,
      oauth_type: "guest",
    });
  }
  
  const sessionData: SessionData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    oauth_type: "guest"
  };
  
  return { user, sessionData };
} 