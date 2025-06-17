import { Handlers, PageProps } from "$fresh/server.ts";
import { getExtendedSessionFromRequest, getOrCreateGuestUser, createSession, setSessionCookie } from "../../utils/session.ts";
import { createThread, getThreadsByUserId } from "../../db/database.ts";
import ChatLayout from "../../components/ChatLayout.tsx";
import { aiManager } from "../../lib/ai/ai-manager.ts";
import { AIMessage } from "../../lib/ai/types.ts";

interface PageData {
  user: { id: number; name: string; email: string; isLoggedIn: boolean } | null;
  threads: any[];
  currentThread: any;
  tempMessages?: any[];
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
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
      
      // Set session cookie
      const headers = new Headers();
      setSessionCookie(headers, sessionToken);
      
      // Return response with session cookie
      const response = await ctx.render({
        user: session,
        threads: getThreadsByUserId(guestUser.id),
        currentThread: null
      });
      
      // Copy headers to response
      for (const [key, value] of headers.entries()) {
        response.headers.set(key, value);
      }
      
      return response;
    }
    
    // Load threads for existing session
    const threads = getThreadsByUserId(session.userId);
    
    return ctx.render({
      user: session,
      threads,
      currentThread: null
    });
  },
  
  async POST(req, ctx) {
    let session = await getSessionFromRequest(req);
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const provider = formData.get("provider") as string || "openai";
    
    if (!message?.trim()) {
      return new Response("Message is required", { status: 400 });
    }
    
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
    
    // For all users (now including guests), save to database
    const userMessage = {
      id: crypto.randomUUID(),
      type: "user",
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Get AI response
    let aiContent = `Hello! I'm ${aiManager.getProviderDisplayName(provider as any)}. Welcome to Hayai!`;
    let modelUsed = provider;
    
    try {
      if (aiManager.isProviderAvailable(provider as any)) {
        const aiResponse = await aiManager.chat(
          [{ role: "user", content: message.trim() }] as AIMessage[],
          provider as any
        );
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

    const messages = [userMessage, aiMessage];
    const title = message.trim().slice(0, 50) + (message.length > 50 ? "..." : "");
    
    const newThread = createThread({
      user_id: session.userId,
      title: title,
      messages: JSON.stringify(messages),
      llm_provider: provider
    });
    
    const headers = new Headers();
    headers.set("location", `/chat/${newThread.uuid}`);
    return new Response(null, { status: 302, headers });
  }
};

export default function NewChat({ data }: PageProps<PageData>) {
  return <ChatLayout user={data.user} threads={data.threads} currentThread={data.currentThread} />;
} 