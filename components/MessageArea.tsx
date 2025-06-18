import { JSX } from "preact";
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
  return (
    <div class="flex-1 overflow-y-auto p-4 bg-gray-50">
      {error
        ? (
          <div class="flex items-center justify-center h-full">
            <div class="text-center text-gray-500">
              <p class="text-xl mb-4 text-red-600">{error}</p>
              <Button
                variant="google"
                href="/auth/login"
                class="inline-block px-6 py-3 rounded-lg"
              >
                Sign In with Google
              </Button>
            </div>
          </div>
        )
        : !currentThread
        ? (
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
        )
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
