import { Handlers, PageProps } from "$fresh/server.ts";
import { getExtendedSessionFromRequest, getOrCreateGuestUser, createSession, setSessionCookie, canGuestSendMessage } from "../../utils/session.ts";
import { createThread, getThreadsByUserId } from "../../db/database.ts";
import ChatLayout from "../../components/ChatLayout.tsx";
import { aiManager } from "../../lib/ai/ai-manager.ts";
import { AIMessage } from "../../lib/ai/types.ts";

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
        isLoggedIn: false
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
          isRateLimited: extendedSession.isRateLimited
        },
        threads: getThreadsByUserId(sessionData.userId),
        currentThread: null
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
        isRateLimited: extendedSession.isRateLimited
      },
      threads,
      currentThread: null
    });
  },
  
  async POST(req, ctx) {
    let extendedSession = await getExtendedSessionFromRequest(req);
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const provider = formData.get("provider") as string || "openai";
    
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
        isLoggedIn: false
      };
    }
    
    // Check rate limit for guest users
    if (extendedSession.isGuest && !canGuestSendMessage(extendedSession.userId)) {
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
          isRateLimited: true
        },
        threads,
        currentThread: null,
        error: "You've reached the 10 message limit for guest accounts. Please sign in with Google to continue chatting!"
      });
      
      return errorResponse;
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
    
    // Generate title using Gemini
    let title = message.trim().slice(0, 50) + (message.length > 50 ? "..." : ""); // fallback
    try {
      if (aiManager.isProviderAvailable("gemini")) {
        const titlePrompt = `Given this message ${message} and the language it's written in, give me a 40-character overview as title without any formatting.`;
        const titleResponse = await aiManager.chat(
          [{ role: "user", content: titlePrompt }] as AIMessage[],
          "gemini",
          {
            model: "gemini-2.5-flash-lite-preview-06-17",
            temperature: 0.3,
            maxTokens: 50
          }
        );
        title = titleResponse.content.trim();
      }
    } catch (error) {
      console.error("Title generation error:", error);
      // Keep fallback title
    }
    
    const newThread = createThread({
      user_id: extendedSession.userId,
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