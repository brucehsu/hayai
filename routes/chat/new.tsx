import { Handlers, PageProps } from "$fresh/server.ts";
import { getSessionFromRequest } from "../../utils/session.ts";
import { createThread, getThreadsByUserId } from "../../db/database.ts";
import ChatLayout from "../../components/ChatLayout.tsx";

interface PageData {
  user: { id: number; name: string; email: string } | null;
  threads: any[];
  currentThread: any;
  tempMessages?: any[];
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const session = await getSessionFromRequest(req);
    
    let threads = [];
    if (session) {
      threads = getThreadsByUserId(session.userId);
    }
    
    return ctx.render({
      user: session,
      threads,
      currentThread: null
    });
  },
  
  async POST(req, ctx) {
    const session = await getSessionFromRequest(req);
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const provider = formData.get("provider") as string || "openai";
    
    if (!message?.trim()) {
      return new Response("Message is required", { status: 400 });
    }
    
    if (!session) {
      // For anonymous users, create a temporary chat session
      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message.trim(),
        timestamp: new Date().toISOString()
      };
      
      const aiMessage = {
        id: crypto.randomUUID(),
        role: "assistant", 
        content: `Hello! This is a mock response from ${provider}. You're chatting anonymously - sign in to save your conversations! In a real implementation, this would call the actual AI API.`,
        timestamp: new Date().toISOString()
      };
      
      const tempThread = {
        id: "temp",
        title: message.trim().slice(0, 50) + (message.length > 50 ? "..." : ""),
        messages: JSON.stringify([userMessage, aiMessage]),
        llm_provider: provider,
        isTemporary: true
      };
      
      const threads = [];
      
      return ctx.render({
        user: null,
        threads,
        currentThread: tempThread
      });
    }
    
    // For logged-in users, save to database
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    const aiMessage = {
      id: crypto.randomUUID(),
      role: "assistant", 
      content: `Hello! This is a mock response from ${provider}. In a real implementation, this would call the actual AI API with your configured keys.`,
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
    headers.set("location", `/chat/${newThread.id}`);
    return new Response(null, { status: 302, headers });
  }
};

export default function NewChat({ data }: PageProps<PageData>) {
  return <ChatLayout user={data.user} threads={data.threads} currentThread={data.currentThread} />;
} 