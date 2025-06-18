import { Handlers, PageProps } from "$fresh/server.ts";
import { getExtendedSessionFromRequest, getOrCreateGuestUser, createSession, setSessionCookie, getGuestRateLimit } from "../utils/session.ts";
import { getThreadsByUserId } from "../db/database.ts";
import ChatLayout from "../components/ChatLayout.tsx";

interface PageData {
  user: { 
    id: number; 
    name: string; 
    email: string; 
    isLoggedIn: boolean;
    messagesRemaining?: number;
    messageLimit?: number;
    isRateLimited?: boolean;
  } | null;
  threads: any[];
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    let extendedSession = await getExtendedSessionFromRequest(req);
    
    // If no session, create a guest user
    if (!extendedSession) {
      const { user: guestUser, sessionData } = await getOrCreateGuestUser(req);
      const sessionToken = await createSession(sessionData);
      
      // Get rate limit info for the guest user
      const rateLimit = getGuestRateLimit(guestUser.id);
      
      extendedSession = {
        ...sessionData,
        isGuest: true,
        isLoggedIn: false,
        ...rateLimit
      };
      
      // Set session cookie
      const headers = new Headers();
      setSessionCookie(headers, sessionToken);
      
      // Return response with session cookie
      const response = await ctx.render({
        user: {
          id: extendedSession.userId,
          name: extendedSession.name,
          email: extendedSession.email,
          isLoggedIn: extendedSession.isLoggedIn,
          messagesRemaining: extendedSession.messagesRemaining,
          messageLimit: extendedSession.messageLimit,
          isRateLimited: extendedSession.isRateLimited
        },
        threads: getThreadsByUserId(guestUser.id)
      });
      
      // Copy headers to response
      for (const [key, value] of headers.entries()) {
        response.headers.set(key, value);
      }
      
      return response;
    }
    
    // Load threads for existing session
    const threads = getThreadsByUserId(extendedSession.userId);
    
    return ctx.render({
      user: {
        id: extendedSession.userId,
        name: extendedSession.name,
        email: extendedSession.email,
        isLoggedIn: extendedSession.isLoggedIn,
        messagesRemaining: extendedSession.messagesRemaining,
        messageLimit: extendedSession.messageLimit,
        isRateLimited: extendedSession.isRateLimited
      },
      threads
    });
  },
};

export default function Home({ data }: PageProps<PageData>) {
  return <ChatLayout user={data.user} threads={data.threads} currentThread={null} />;
} 