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

  return (
    <div
      ref={scrollContainerRef}
      class="flex-1 overflow-y-auto p-4 bg-gray-50"
    >
      {error
        ? <ErrorState error={error} />
        : !currentThread
        ? <EmptyState />
        : allMessages.length === 0 && !isStreaming
        ? (
          <div class="flex items-center justify-center h-full">
            <div class="flex justify-center mb-6">
              <img
                src="/logo.png"
                alt="hayai Logo"
                class="h-16 w-auto"
              />
            </div>
          </div>
        )
        : (
          <div class="space-y-4">
            {allMessages.map((message: any, index: number) => (
              <Message key={index} message={message} />
            ))}
            {(isSubmitting || isStreaming) && currentThread && (
              <Message
                key={allMessages.length}
                message={{
                  type: "assistant",
                  content: isStreaming && streamingMessage
                    ? `${streamingMessage}<span class="animate-pulse">|</span>`
                    : "Thinking...",
                }}
              />
            )}
          </div>
        )}
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div class="flex items-center justify-center h-full">
      <div class="text-center text-gray-500">
        <div class="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="hayai Logo"
            class="h-16 w-auto"
          />
        </div>
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
