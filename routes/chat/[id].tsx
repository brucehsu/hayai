import { Handlers, PageProps } from "$fresh/server.ts";
import { getSessionFromRequest, getOrCreateGuestUser, createSession, setSessionCookie } from "../../utils/session.ts";
import { getThreadByUuid, getThreadsByUserId, updateThreadByUuid } from "../../db/database.ts";
import ChatLayout from "../../components/ChatLayout.tsx";
import { aiManager } from "../../lib/ai/ai-manager.ts";
import { AIMessage } from "../../lib/ai/types.ts";

interface PageData {
  user: { id: number; name: string; email: string } | null;
  threads: any[];
  currentThread: any;
  error?: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    let session = await getSessionFromRequest(req);
    const threadUuid = ctx.params.id;
    
    // If no session, create a guest user
    if (!session) {
      const guestUser = await getOrCreateGuestUser(req);
      const sessionToken = await createSession({
        userId: guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
      });
      
      session = {
        userId: guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
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
        user: session,
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
    const threads = getThreadsByUserId(session.userId);
    const currentThread = getThreadByUuid(threadUuid);
    let error = undefined;
    
    if (currentThread && currentThread.user_id !== session.userId) {
      error = "Access denied";
      return ctx.render({
        user: session,
        threads,
        currentThread: null,
        error
      });
    }
    
    return ctx.render({
      user: session,
      threads,
      currentThread,
      error
    });
  },
  
  async POST(req, ctx) {
    let session = await getSessionFromRequest(req);
    
    // If no session, create a guest user
    if (!session) {
      const guestUser = await getOrCreateGuestUser(req);
      const sessionToken = await createSession({
        userId: guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
      });
      
      session = {
        userId: guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
      };
    }
    
    const threadUuid = ctx.params.id;
    const currentThread = getThreadByUuid(threadUuid);
    
    if (!currentThread || currentThread.user_id !== session.userId) {
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
    const threads = getThreadsByUserId(session.userId);
    const updatedThread = getThreadByUuid(threadUuid);
    
    return ctx.render({
      user: session,
      threads,
      currentThread: updatedThread,
      error: undefined
    });
  }
};

export default function ChatThread({ data }: PageProps<PageData>) {
  return <ChatLayout user={data.user} threads={data.threads} currentThread={data.currentThread} error={data.error} />;
} 