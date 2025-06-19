import { Handlers, PageProps } from "$fresh/server.ts";
import {
  canGuestSendMessage,
  createSession,
  getExtendedSessionFromRequest,
  getOrCreateGuestUser,
  setSessionCookie,
} from "../../utils/session.ts";
import { createThread, getThreadsByUserId } from "../../db/database.ts";
import ChatLayout from "../../components/ChatLayout.tsx";
import { aiManager } from "../../lib/ai/ai-manager.ts";
import { AIMessage } from "../../lib/ai/types.ts";
import { getModelVersionFromProvider } from "../../utils/model-mapping.ts";

interface PageData {
  user: {
    id: number;
    name: string;
    email: string;
    isLoggedIn: boolean;
    messageCount?: number;
    messageLimit?: number;
    messagesRemaining?: number;
    isRateLimited?: boolean;
  } | null;
  threads: any[];
  currentThread: any;
  tempMessages?: any[];
  error?: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    let extendedSession = await getExtendedSessionFromRequest(req);

    // If no session, create a guest user
    if (!extendedSession) {
      const { user: guestUser, sessionData } = await getOrCreateGuestUser(req);
      const sessionToken = await createSession(sessionData);

      extendedSession = {
        ...sessionData,
        isGuest: true,
        isLoggedIn: false,
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
          messageCount: extendedSession.messageCount,
          messageLimit: extendedSession.messageLimit,
          messagesRemaining: extendedSession.messagesRemaining,
          isRateLimited: extendedSession.isRateLimited,
        },
        threads: getThreadsByUserId(sessionData.userId),
        currentThread: null,
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
        messageCount: extendedSession.messageCount,
        messageLimit: extendedSession.messageLimit,
        messagesRemaining: extendedSession.messagesRemaining,
        isRateLimited: extendedSession.isRateLimited,
      },
      threads,
      currentThread: null,
    });
  },

  async POST(req, ctx) {
    let extendedSession = await getExtendedSessionFromRequest(req);
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const provider = formData.get("provider") as string || "google";

    if (!message?.trim()) {
      return new Response("Message is required", { status: 400 });
    }

    // If no session, create a guest user
    if (!extendedSession) {
      const { user: guestUser, sessionData } = await getOrCreateGuestUser(req);
      const sessionToken = await createSession(sessionData);

      extendedSession = {
        ...sessionData,
        isGuest: true,
        isLoggedIn: false,
      };
    }

    // Check rate limit for guest users
    if (
      extendedSession.isGuest && !canGuestSendMessage(extendedSession.userId)
    ) {
      const threads = getThreadsByUserId(extendedSession.userId);
      const errorResponse = await ctx.render({
        user: {
          id: extendedSession.userId,
          name: extendedSession.name,
          email: extendedSession.email,
          isLoggedIn: extendedSession.isLoggedIn,
          messageCount: extendedSession.messageCount,
          messageLimit: extendedSession.messageLimit,
          messagesRemaining: extendedSession.messagesRemaining,
          isRateLimited: true,
        },
        threads,
        currentThread: null,
        error:
          "You've reached the 10 message limit for guest accounts. Please sign in with Google to continue chatting!",
      });

      return errorResponse;
    }

    // Create empty thread with placeholder title
    const llm_model_version = getModelVersionFromProvider(provider);
    
    const newThread = createThread({
      user_id: extendedSession.userId,
      title: "New Conversation", // Placeholder title
      messages: JSON.stringify([]), // Empty messages array
      llm_provider: provider,
      llm_model_version: llm_model_version,
      public: false,
    });

    // Redirect to the new thread with the message as URL parameter
    const headers = new Headers();
    const redirectUrl = `/chat/${newThread.uuid}?message=${
      encodeURIComponent(message.trim())
    }`;
    headers.set("location", redirectUrl);
    return new Response(null, { status: 302, headers });
  },
};

export default function NewChat({ data }: PageProps<PageData>) {
  return (
    <ChatLayout
      user={data.user}
      threads={data.threads}
      currentThread={data.currentThread}
    />
  );
}
