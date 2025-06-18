import { JSX } from "preact";
import { marked } from "marked";

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
      class={`flex justify-center`}
    >
      <div
        class={`w-[80%] px-4 py-2 rounded-lg ${
          message.type === "user"
            ? "bg-user-message text-white text-right"
            : "bg-white text-gray-800 border border-gray-200"
        }`}
      >
        <div 
          class="text-sm markdown-content"
          dangerouslySetInnerHTML={{ __html: marked(message.content) }}
        />
        <p class="text-xs mt-1 opacity-70 text-right">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
