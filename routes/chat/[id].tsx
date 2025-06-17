import { Handlers, PageProps } from "$fresh/server.ts";
import { getExtendedSessionFromRequest, getOrCreateGuestUser, createSession, setSessionCookie } from "../../utils/session.ts";
import { getThreadByUuid, getThreadsByUserId, updateThreadByUuid } from "../../db/database.ts";
import ChatLayout from "../../components/ChatLayout.tsx";
import { aiManager } from "../../lib/ai/ai-manager.ts";
import { AIMessage } from "../../lib/ai/types.ts";

interface PageData {
  user: { id: number; name: string; email: string; isLoggedIn: boolean } | null;
  threads: any[];
  currentThread: any;
  error?: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    let extendedSession = await getExtendedSessionFromRequest(req);
    const threadUuid = ctx.params.id;
    
    // If no session, create a guest user
    if (!extendedSession) {
      const { user: guestUser, sessionData } = await getOrCreateGuestUser(req);
      const sessionToken = await createSession(sessionData);
      
      extendedSession = {
        ...sessionData,
        isGuest: true,
        isLoggedIn: false
      };
      
      // Set session cookie
      const headers = new Headers();
      setSessionCookie(headers, sessionToken);
      
      // Return response with redirect if guest can't access this thread
      const currentThread = getThreadByUuid(threadUuid);
      if (!currentThread || currentThread.user_id !== guestUser.id) {
        headers.set("location", "/");
        return new Response(null, { status: 302, headers });
      }
      
      // Return response with session cookie
      const response = await ctx.render({
        user: {
          id: extendedSession.userId,
          name: extendedSession.name,
          email: extendedSession.email,
          isLoggedIn: extendedSession.isLoggedIn
        },
        threads: getThreadsByUserId(guestUser.id),
        currentThread,
        error: undefined
      });
      
      // Copy headers to response
      for (const [key, value] of headers.entries()) {
        response.headers.set(key, value);
      }
      
      return response;
    }
    
    // Load data for existing session
    const threads = getThreadsByUserId(extendedSession.userId);
    const currentThread = getThreadByUuid(threadUuid);
    let error = undefined;
    
    if (currentThread && currentThread.user_id !== extendedSession.userId) {
      const error = "Access denied";
      return ctx.render({
        user: {
          id: extendedSession.userId,
          name: extendedSession.name,
          email: extendedSession.email,
          isLoggedIn: extendedSession.isLoggedIn
        },
        threads,
        currentThread: null,
        error
      });
    }
    
    return ctx.render({
      user: {
        id: extendedSession.userId,
        name: extendedSession.name,
        email: extendedSession.email,
        isLoggedIn: extendedSession.isLoggedIn
      },
      threads,
      currentThread,
      error
    });
  },
  
  async POST(req, ctx) {
    let extendedSession = await getExtendedSessionFromRequest(req);
    
    // If no session, create a guest user
    if (!extendedSession) {
      const { user: guestUser, sessionData } = await getOrCreateGuestUser(req);
      const sessionToken = await createSession(sessionData);
      
      extendedSession = {
        ...sessionData,
        isGuest: true,
        isLoggedIn: false
      };
    }
    
    const threadUuid = ctx.params.id;
    const currentThread = getThreadByUuid(threadUuid);
    
    if (!currentThread || currentThread.user_id !== extendedSession.userId) {
      return new Response("Thread not found", { status: 404 });
    }
    
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const provider = formData.get("provider") as string || currentThread.llm_provider;
    
    if (!message?.trim()) {
      return new Response("Message is required", { status: 400 });
    }
    
    // Parse existing messages
    const messages = JSON.parse(currentThread.messages || "[]");
    
    // Add user message
    const userMessage = {
      id: crypto.randomUUID(),
      type: "user",
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    messages.push(userMessage);
    
    // Get AI response
    let aiContent = `I'm ${aiManager.getProviderDisplayName(provider as any)}. Thanks for continuing our conversation!`;
    let modelUsed = provider;
    
    try {
      if (aiManager.isProviderAvailable(provider as any)) {
        // Convert message history to AI client format
        const aiMessages: AIMessage[] = messages.map((msg: any) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
          timestamp: msg.timestamp
        }));
        
        const aiResponse = await aiManager.chat(aiMessages, provider as any);
        aiContent = aiResponse.content;
        modelUsed = aiResponse.model;
      }
    } catch (error) {
      console.error("AI API Error:", error);
      aiContent = `Sorry, I encountered an error with ${provider}. ${error.message || "Please try again later."}`;
    }
    
    const aiMessage = {
      id: crypto.randomUUID(),
      type: modelUsed,
      content: aiContent,
      timestamp: new Date().toISOString()
    };
    messages.push(aiMessage);
    
    // Update thread
    updateThreadByUuid(threadUuid, {
      messages: JSON.stringify(messages),
      llm_provider: provider
    });
    
    // Instead of redirecting, return the updated page data directly
    const threads = getThreadsByUserId(extendedSession.userId);
    const updatedThread = getThreadByUuid(threadUuid);
    
    return ctx.render({
      user: {
        id: extendedSession.userId,
        name: extendedSession.name,
        email: extendedSession.email,
        isLoggedIn: extendedSession.isLoggedIn
      },
      threads,
      currentThread: updatedThread,
      error: undefined
    });
  }
};

export default function ChatThread({ data }: PageProps<PageData>) {
  return <ChatLayout user={data.user} threads={data.threads} currentThread={data.currentThread} error={data.error} />;
} 