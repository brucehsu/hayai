import { JSX } from "preact";

interface MessageProps {
  message: {
    type: string;
    content: string;
    timestamp: string;
  };
}

export default function Message({ message }: MessageProps): JSX.Element {
  return (
    <div
      class={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        class={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.type === "user"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-800 border border-gray-200"
        }`}
      >
        {message.type !== "user" && (
          <p class="text-xs text-gray-500 mb-1 font-medium">
            {message.type}
          </p>
        )}
        <p class="text-sm whitespace-pre-wrap">{message.content}</p>
        <p class="text-xs mt-1 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
} 