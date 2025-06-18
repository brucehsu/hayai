import { JSX } from "preact";
import { useState } from "preact/hooks";
import Message from "../components/Message.tsx";

interface ChatAreaProps {
  currentThread: any;
  error?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    isLoggedIn: boolean;
    messagesRemaining?: number;
    messageLimit?: number;
    isRateLimited?: boolean;
  } | null;
}

export default function ChatArea({ currentThread, error, user }: ChatAreaProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  
  const baseMessages = currentThread ? JSON.parse(currentThread.messages || "[]") : [];
  const allMessages = [...baseMessages, ...optimisticMessages];
  
  // Check if guest user is rate limited
  const isGuestRateLimited = Boolean(user && !user.isLoggedIn && user.isRateLimited);

  const handleExistingThreadSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const message = formData.get('message') as string;
    
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    
    // Add user message optimistically
    const userMessage = {
      type: "user",
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    setOptimisticMessages(prev => [...prev, userMessage]);
    
    // Clear the input
    const messageInput = form.querySelector('input[name="message"]') as HTMLInputElement;
    messageInput.value = '';
    
    // Submit the form
    fetch(window.location.href, {
      method: 'POST',
      body: formData
    }).then(() => {
      // Reset optimistic messages and reload the page to get the AI response
      setOptimisticMessages([]);
      setIsSubmitting(false);
      window.location.reload();
    }).catch(() => {
      setIsSubmitting(false);
      // Remove the optimistic message on error
      setOptimisticMessages(prev => prev.slice(0, -1));
    });
  };

  const handleNewChatSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const message = formData.get('message') as string;
    
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    
    // Submit the form
    fetch('/chat/new', {
      method: 'POST',
      body: formData
    }).then(response => {
      if (response.redirected) {
        window.location.href = response.url;
      }
    }).catch(() => {
      setIsSubmitting(false);
    });
  };

  return (
    <div class="flex-1 flex flex-col">
      {/* Header with LLM Selector */}
      <div class="bg-white border-b border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">
            {currentThread ? currentThread.title : "Hayai"}
          </h2>
          {currentThread && (
            <form method="post" class="flex items-center gap-2">
              <label class="text-sm text-gray-600">Model:</label>
              <select 
                name="provider"
                class="border border-gray-300 rounded px-3 py-1 text-sm"
                value={currentThread.llm_provider}
                onChange={(e) => (e.target as HTMLSelectElement).form?.submit()}
                disabled={true}
              >
                <option value="openai">OpenAI GPT-4o</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="gemini">Google Gemini 2.5 Flash</option>
              </select>
              <input type="hidden" name="message" value="" />
            </form>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div class="flex-1 overflow-y-auto p-4 bg-gray-50">
        {error ? (
          <div class="flex items-center justify-center h-full">
            <div class="text-center text-gray-500">
              <p class="text-xl mb-4 text-red-600">{error}</p>
              <a 
                href="/auth/login" 
                class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Sign In with Google
              </a>
            </div>
          </div>
        ) : !currentThread ? (
          <div class="flex items-center justify-center h-full">
            <div class="text-center text-gray-500">
              <p class="text-xl mb-4">Welcome to Hayai</p>
              <p class="mb-6">Start a new conversation or select an existing chat from the sidebar</p>
              <a 
                href="/chat/new" 
                class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Start New Chat
              </a>
            </div>
          </div>
        ) : allMessages.length === 0 ? (
          <div class="flex items-center justify-center h-full">
            <div class="text-center text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div class="space-y-4">
            {allMessages.map((message: any, index: number) => (
              <Message key={index} message={message} />
            ))}
            {isSubmitting && currentThread && (
              <div class="flex justify-start">
                <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-200">
                  <p class="text-xs text-gray-500 mb-1 font-medium">AI</p>
                  <p class="text-sm text-gray-500">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      {!error && (
        currentThread ? (
          <div class="bg-white border-t border-gray-200 p-4">
            {isGuestRateLimited ? (
              <div class="text-center py-4">
                <p class="text-red-600 mb-3 font-medium">You've reached the 10 message limit for guest accounts.</p>
                <a 
                  href="/auth/login" 
                  class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Sign In with Google to Continue
                </a>
              </div>
            ) : (
              <>
                {user && !user.isLoggedIn && user.messagesRemaining !== undefined && user.messagesRemaining <= 3 && (
                  <div class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p class="text-sm text-yellow-800">
                      <span class="font-medium">Warning:</span> You have {user.messagesRemaining} message{user.messagesRemaining !== 1 ? 's' : ''} remaining. 
                      <a href="/auth/login" class="text-blue-600 hover:underline ml-1">Sign in</a> to continue chatting without limits.
                    </p>
                  </div>
                )}
                <form onSubmit={handleExistingThreadSubmit} class="flex gap-2">
                  <input
                    type="text"
                    placeholder={isSubmitting ? "Sending..." : "Type your message..."}
                    class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    name="message"
                    required
                    disabled={isSubmitting || isGuestRateLimited}
                  />
                  <input type="hidden" name="provider" value={currentThread.llm_provider} />
                  <button
                    type="submit"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isSubmitting || isGuestRateLimited}
                  >
                    {isSubmitting ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            )}
          </div>
        ) : (
          <div class="bg-white border-t border-gray-200 p-4">
            {isGuestRateLimited ? (
              <div class="text-center py-4">
                <p class="text-red-600 mb-3 font-medium">You've reached the 10 message limit for guest accounts.</p>
                <a 
                  href="/auth/login" 
                  class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Sign In with Google to Continue
                </a>
              </div>
            ) : (
              <>
                {user && !user.isLoggedIn && user.messagesRemaining !== undefined && user.messagesRemaining <= 3 && (
                  <div class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p class="text-sm text-yellow-800">
                      <span class="font-medium">Warning:</span> You have {user.messagesRemaining} message{user.messagesRemaining !== 1 ? 's' : ''} remaining. 
                      <a href="/auth/login" class="text-blue-600 hover:underline ml-1">Sign in</a> to continue chatting without limits.
                    </p>
                  </div>
                )}
                <form onSubmit={handleNewChatSubmit} class="flex gap-2">
                  <input
                    type="text"
                    placeholder={isSubmitting ? "Starting chat..." : "Start a new conversation..."}
                    class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    name="message"
                    required
                    disabled={isSubmitting || isGuestRateLimited}
                  />
                  <select 
                    name="provider" 
                    class="border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={isSubmitting || isGuestRateLimited}
                  >
                    <option value="openai">OpenAI GPT-4o</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="gemini" selected>Google Gemini 2.5 Flash</option>
                  </select>
                  <button
                    type="submit"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isSubmitting || isGuestRateLimited}
                  >
                    {isSubmitting ? "Starting..." : "Start Chat"}
                  </button>
                </form>
              </>
            )}
          </div>
        )
      )}
    </div>
  );
} 