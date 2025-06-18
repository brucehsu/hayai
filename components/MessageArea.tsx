import { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";
import Message from "./Message.tsx";
import Button from "./Button.tsx";

interface MessageAreaProps {
  error?: string;
  currentThread?: any;
  allMessages: any[];
  isStreaming: boolean;
  isSubmitting: boolean;
  streamingMessage: string;
}

export default function MessageArea({
  error,
  currentThread,
  allMessages,
  isStreaming,
  isSubmitting,
  streamingMessage,
}: MessageAreaProps): JSX.Element {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or when streaming
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [allMessages.length, streamingMessage, isStreaming, isSubmitting]);

  const renderStreamingMessage = () => {
    const shouldShowStreamingMessage = (isSubmitting || isStreaming) &&
      currentThread;

    if (!shouldShowStreamingMessage) {
      return null;
    }

    const streamingContent = isStreaming && streamingMessage
      ? `${streamingMessage}<span class="animate-pulse">|</span>`
      : "Thinking...";

    return (
      <Message
        key={allMessages.length}
        message={{
          type: "assistant",
          content: streamingContent,
        }}
      />
    );
  };

  let children;

  // Handle error state
  if (error) {
    children = <ErrorState error={error} />;
  } // Handle no current thread
  else if (!currentThread) {
    children = <EmptyState />;
  } // Handle empty messages and not streaming
  else if (allMessages.length === 0 && !isStreaming) {
    children = <EmptyState />;
  } // Render messages
  else {
    children = (
      <div class="space-y-4">
        {allMessages.map((message: any, index: number) => (
          <Message key={index} message={message} />
        ))}
        {renderStreamingMessage()}
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      class="flex-1 overflow-y-auto p-4 bg-gray-50"
    >
      {children}
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div class="flex items-center justify-center h-full">
      <div class="flex justify-center mb-6">
        <img
          src="/logo.png"
          alt="hayai Logo"
          class="h-16 w-auto"
        />
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }): JSX.Element {
  return (
    <div class="flex items-center justify-center h-full">
      <div class="text-center text-gray-500">
        <p class="text-xl mb-4 text-red-600">{error}</p>
      </div>
    </div>
  );
}
