import { Handlers, PageProps } from "$fresh/server.ts";
import { getSessionFromRequest } from "../../utils/session.ts";
import { getThreadByUuid, getThreadsByUserId, updateThreadByUuid } from "../../db/database.ts";
import ChatLayout from "../../components/ChatLayout.tsx";

interface PageData {
  user: { id: number; name: string; email: string } | null;
  threads: any[];
  currentThread: any;
  error?: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const session = await getSessionFromRequest(req);
    const threadUuid = ctx.params.id;
    
    let threads = [];
    let currentThread = null;
    let error = undefined;
    
    if (session) {
      threads = getThreadsByUserId(session.userId);
      currentThread = getThreadByUuid(threadUuid);
      
      if (currentThread && currentThread.user_id !== session.userId) {
        error = "Access denied";
        currentThread = null;
      }
    } else {
      // Anonymous users can't access saved threads
      error = "Please log in to view saved conversations";
    }
    
    return ctx.render({
      user: session,
      threads,
      currentThread,
      error
    });
  },
  
  async POST(req, ctx) {
    const session = await getSessionFromRequest(req);
    
    if (!session) {
      return new Response("Please log in to save messages", { status: 401 });
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
      role: "user",
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    messages.push(userMessage);
    
    // Mock AI response (replace with actual AI API call)
    const aiMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `This is a mock response from ${provider}. In a real implementation, this would call the actual AI API with your configured keys.`,
      timestamp: new Date().toISOString()
    };
    messages.push(aiMessage);
    
    // Update thread
    updateThreadByUuid(threadUuid, {
      messages: JSON.stringify(messages),
      llm_provider: provider
    });
    
    // Redirect back to the same thread
    const headers = new Headers();
    headers.set("location", `/chat/${threadUuid}`);
    return new Response(null, { status: 302, headers });
  }
};

export default function ChatThread({ data }: PageProps<PageData>) {
  return <ChatLayout user={data.user} threads={data.threads} currentThread={data.currentThread} error={data.error} />;
} 