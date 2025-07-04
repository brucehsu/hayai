import { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";
import Message from "./Message.tsx";
import Button from "./Button.tsx";

interface MessageAreaProps {
  error?: string;
  allMessages: any[];
  isStreaming: boolean;
  isSubmitting: boolean;
  streamingMessage: string;
  disabled?: boolean;
  showSummaries?: boolean;
}

export default function MessageArea({
  error,
  allMessages,
  isStreaming,
  isSubmitting,
  streamingMessage,
  disabled = false,
  showSummaries = false,
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
      allMessages.length > 0;

    if (!shouldShowStreamingMessage) {
      return null;
    }

    const streamingContent = isStreaming && streamingMessage
      ? `${streamingMessage}<span class="animate-pulse">|</span>`
      : null;

    return (
      <Message
        key={allMessages.length}
        message={{
          type: "assistant",
          content: streamingContent,
        }}
        showSummary={showSummaries}
      />
    );
  };

  let children;

  // Handle error state
  if (error) {
    children = <ErrorState error={error} />;
  } // Handle empty messages and not streaming
  else if (allMessages.length === 0 && !isStreaming) {
    children = <EmptyState />;
  } // Render messages
  else {
    children = (
      <div class="space-y-4">
        {allMessages.map((message: any, index: number) => (
          <Message key={index} message={message} showSummary={showSummaries} />
        ))}
        {renderStreamingMessage()}
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      class={`flex-1 overflow-y-auto p-4 bg-gray-50 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
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
