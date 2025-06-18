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
                variant="blue"
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
                  alt="Hayai Logo" 
                  class="h-16 w-auto"
                />
              </div>
              <p class="mb-6">
                Start a new conversation or select an existing chat from the
                sidebar
              </p>
              <Button
                variant="green"
                href="/chat/new"
                class="inline-block px-6 py-3 rounded-lg"
              >
                Start New Chat
              </Button>
            </div>
          </div>
        )
        : allMessages.length === 0 && !isStreaming
        ? (
          <div class="flex items-center justify-center h-full">
            <div class="text-center text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        )
        : (
          <div class="space-y-4">
            {allMessages.map((message: any, index: number) => (
              <Message key={index} message={message} />
            ))}
            {(isSubmitting || isStreaming) && currentThread && (
              <div class="flex justify-start">
                <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-200">
                  <p class="text-xs text-gray-500 mb-1 font-medium">AI</p>
                  {isStreaming && streamingMessage
                    ? (
                      <div class="text-sm whitespace-pre-wrap">
                        {streamingMessage}
                        <span class="animate-pulse">|</span>
                      </div>
                    )
                    : <p class="text-sm text-gray-500">Thinking...</p>}
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
