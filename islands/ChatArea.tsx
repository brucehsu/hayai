import { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import Message from "../components/Message.tsx";
import ChatHeader from "../components/ChatHeader.tsx";
import MessageArea from "../components/MessageArea.tsx";
import Button from "../components/Button.tsx";
import MessageInput from "../components/MessageInput.tsx";
import Icon from "../components/Icon.tsx";

interface ChatAreaProps {
  currentThread: any;
  error?: string;
  isOwner?: boolean;
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

export default function ChatArea(
  { currentThread, error, isOwner, user }: ChatAreaProps,
): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [threadTitle, setThreadTitle] = useState<string>(
    currentThread?.title || "New Conversation",
  );
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummaries, setShowSummaries] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [baseMessages, setBaseMessages] = useState<Array<any>>([]);
  useEffect(() => {
    if (currentThread) {
      setBaseMessages(JSON.parse(currentThread?.messages));
    }
  }, [currentThread?.uuid]);

  const allMessages = [...baseMessages, ...optimisticMessages];

  // Check if this is a new empty thread
  const isNewEmptyThread = currentThread && baseMessages.length === 0;

  // Check if guest user is rate limited
  const isGuestRateLimited = Boolean(
    user && !user.isLoggedIn && user.isRateLimited,
  );

  // Update title state when currentThread changes
  useEffect(() => {
    if (currentThread?.title) {
      setThreadTitle(currentThread.title);
    }
  }, [currentThread?.title]);

  // Handle automatic message submission for new threads
  useEffect(() => {
    if (isNewEmptyThread && !isSubmitting && !isStreaming) {
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get("message");

      if (message && message.trim()) {
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState(null, "", newUrl);

        // Add user message optimistically
        const userMessage = {
          type: "user",
          content: message.trim(),
          timestamp: new Date().toISOString(),
        };

        setOptimisticMessages((prev) => [...prev, userMessage]);
        setIsSubmitting(true);

        // Use streaming response
        handleStreamingResponse(
          message.trim(),
          currentThread.uuid,
          currentThread.llm_provider,
        )
          .finally(() => {
            setIsSubmitting(false);
          });
      }
    }
  }, [isNewEmptyThread, currentThread, isSubmitting, isStreaming]);

  const handleStreamingResponse = async (
    message: string,
    threadId?: string,
    provider?: string,
  ) => {
    try {
      setIsStreaming(true);
      setStreamingMessage("");

      // Prepare the messages for AI
      const messages = [...baseMessages, {
        type: "user",
        content: message,
        timestamp: new Date().toISOString(),
      }];
      const aiMessages = messages.map((msg: any) => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      // For new threads with empty messages, also trigger title update
      const isNewThread = baseMessages.length === 0 && threadId;
      if (isNewThread) {
        // Trigger title update asynchronously
        updateThreadTitle(threadId, message);
      }

      // Call streaming API
      const response = await fetch("/api/chat?stream=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: aiMessages,
          provider: provider || "openai", // Use provided provider or default to OpenAI
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start streaming response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "chunk" && data.data?.delta?.content) {
                  fullContent += data.data.delta.content;
                  setStreamingMessage(fullContent);
                } else if (data.type === "complete") {
                  // Streaming complete, save to database
                  if (threadId) {
                    await saveStreamedMessage(threadId, message, fullContent);
                  }
                  
                  // Update local state instead of reloading the page  
                  const userMessage = {
                    type: "user",
                    content: message,
                    timestamp: new Date().toISOString(),
                  };
                  
                  const aiMessage = {
                    type: "assistant", 
                    content: fullContent,
                    timestamp: new Date().toISOString(),
                  };
                  
                  // Add both user and AI messages to base messages
                  setBaseMessages(prev => [...prev, userMessage, aiMessage]);
                  setOptimisticMessages([]);
                  return;
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.warn("Failed to parse streaming data:", parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("Streaming error:", error);
      
      // Only remove the optimistic message if this was a real streaming failure,
      // not just a parse error or network timeout
      if (error instanceof Error && 
          (error.message.includes("Failed to start streaming") || 
           error.message.includes("No response body"))) {
        setOptimisticMessages((prev) => prev.slice(0, -1)); // Remove optimistic user message
      } else {
        // For other errors (like parse errors), keep the user message and show it as failed
        console.warn("Non-critical streaming error, keeping user message:", error);
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const saveStreamedMessage = async (
    threadId: string,
    userMessage: string,
    aiResponse: string,
  ) => {
    try {
      await fetch(`/chat/${threadId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          message: userMessage,
          ai_response: aiResponse,
          is_streamed: "true",
        }),
      });
    } catch (error) {
      console.error("Failed to save streamed message:", error);
    }
  };

  const updateThreadTitle = async (threadId: string, message: string) => {
    try {
      const response = await fetch("/api/chat?updateTitle=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId,
          message,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.title) {
          // Update the title in the UI immediately
          setThreadTitle(result.title);
        }
      }
    } catch (error) {
      console.error("Failed to update thread title:", error);
    }
  };

  const handleExistingThreadSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const message = formData.get("message") as string;

    if (!message.trim()) return;

    setIsSubmitting(true);

    // Add user message optimistically
    const userMessage = {
      type: "user",
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    setOptimisticMessages((prev) => [...prev, userMessage]);

    // Clear the input
    const messageInput = form.querySelector(
      'textarea[name="message"]',
    ) as HTMLInputElement;
    messageInput.value = "";

    // Use streaming response
    handleStreamingResponse(
      message.trim(),
      currentThread?.uuid,
      currentThread?.llm_provider,
    )
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleNewChatSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const message = formData.get("message") as string;

    if (!message.trim()) return;

    setIsSubmitting(true);

    // Submit the form - backend will create thread and redirect with message parameter
    fetch("/chat/new", {
      method: "POST",
      body: formData,
    }).then((response) => {
      if (response.redirected) {
        // Navigate to the new thread - useEffect will handle automatic message submission
        window.location.href = response.url;
      }
    }).catch(() => {
      setIsSubmitting(false);
    });
  };

  // Handle summarization
  const handleSummarization = async (threadUuid: string) => {
    setIsSummarizing(true);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadUuid }),
      });

      const data = await response.json();

      if (response.ok) {
        // Enable summary view
        setShowSummaries(true);
        setBaseMessages(JSON.parse(data.thread.messages));
      } else {
        console.error("Summarization failed:", data);
      }
    } catch (error) {
      console.error("Error calling summarize endpoint:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div class="flex-1 flex flex-col relative">
      <ChatHeader
        currentThread={currentThread}
        title={threadTitle}
        isOwner={isOwner}
        onSummarize={handleSummarization}
        isSummarizing={isSummarizing}
        showSummaries={showSummaries}
        onToggleSummaries={() => setShowSummaries(!showSummaries)}
      />

      {/* Loading Overlay for Summarization */}
      {isSummarizing && (
        <div
          class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ top: "73px" }}
        >
          <div class="bg-white rounded-lg p-6 flex flex-col items-center gap-3 shadow-lg">
            <Icon type="spinner" size="lg" />
            <p class="text-gray-700 font-medium">Summarizing messages...</p>
            <p class="text-gray-500 text-sm">This may take a few moments</p>
          </div>
        </div>
      )}

      <MessageArea
        error={error}
        allMessages={allMessages}
        isStreaming={isStreaming}
        isSubmitting={isSubmitting}
        streamingMessage={streamingMessage}
        disabled={isSummarizing}
        showSummaries={showSummaries}
      />

      {/* Input Area */}
      {!error && (
        currentThread
          ? (
            <div class="bg-white border-t border-gray-200 p-4">
              {isGuestRateLimited
                ? (
                  <div class="text-center py-4">
                    <p class="text-red-600 mb-3 font-medium">
                      You've reached the 10 message limit for guest accounts.
                    </p>
                    <Button
                      variant="google"
                      href="/auth/login"
                      class="inline-block px-6 py-3 rounded-lg"
                    >
                      Sign In with Google to Continue
                    </Button>
                  </div>
                )
                : (
                  <>
                    {user && !user.isLoggedIn &&
                      user.messagesRemaining !== undefined &&
                      user.messagesRemaining <= 3 && (
                      <div class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p class="text-sm text-yellow-800">
                          <span class="font-medium">Warning:</span> You have
                          {" "}
                          {user.messagesRemaining}{" "}
                          message{user.messagesRemaining !== 1 ? "s" : ""}{" "}
                          remaining.
                          <a
                            href="/auth/login"
                            class="text-blue-600 hover:underline ml-1"
                          >
                            Sign in
                          </a>{" "}
                          to continue chatting without limits.
                        </p>
                      </div>
                    )}
                    <MessageInput
                      onSubmit={handleExistingThreadSubmit}
                      placeholder={isSubmitting || isStreaming
                        ? "Processing..."
                        : !isOwner
                        ? "You can only view this shared thread"
                        : "Type your message..."}
                      disabled={isSubmitting || isGuestRateLimited ||
                        isStreaming || !isOwner || isSummarizing}
                      isSubmitting={isSubmitting}
                      providerValue={currentThread.llm_provider}
                    />
                  </>
                )}
            </div>
          )
          : (
            <div class="bg-white border-t border-gray-200 p-4">
              {isGuestRateLimited
                ? (
                  <div class="text-center py-4">
                    <p class="text-red-600 mb-3 font-medium">
                      You've reached the 10 message limit for guest accounts.
                    </p>
                    <Button
                      variant="google"
                      href="/auth/login"
                      class="inline-block px-6 py-3 rounded-lg"
                    >
                      Sign In with Google to Continue
                    </Button>
                  </div>
                )
                : (
                  <>
                    {user && !user.isLoggedIn &&
                      user.messagesRemaining !== undefined &&
                      user.messagesRemaining <= 3 && (
                      <div class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p class="text-sm text-yellow-800">
                          <span class="font-medium">Warning:</span> You have
                          {" "}
                          {user.messagesRemaining}{" "}
                          message{user.messagesRemaining !== 1 ? "s" : ""}{" "}
                          remaining.
                          <a
                            href="/auth/login"
                            class="text-blue-600 hover:underline ml-1"
                          >
                            Sign in
                          </a>{" "}
                          to continue chatting without limits.
                        </p>
                      </div>
                    )}
                    <MessageInput
                      onSubmit={handleNewChatSubmit}
                      placeholder={isSubmitting
                        ? "Starting chat..."
                        : "Start a new conversation..."}
                      disabled={isSubmitting || isGuestRateLimited ||
                        isSummarizing}
                      isSubmitting={isSubmitting}
                      showProviderSelect={true}
                    />
                  </>
                )}
            </div>
          )
      )}
    </div>
  );
}
