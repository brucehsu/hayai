import { JSX } from "preact";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import Spinner from "./Spinner.tsx";

// Configure marked with syntax highlighting
const marked = new Marked(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

interface MessageProps {
  message: {
    type: string;
    content: string | null;
    timestamp?: string;
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
        {message.content === null
          ? (
            <div class="flex justify-center p-4">
              <Spinner />
            </div>
          )
          : (
            <div
              class="text-sm markdown-content"
              dangerouslySetInnerHTML={{
                __html: marked.parse(message.content),
              }}
            />
          )}
        {message.timestamp && (
          <p class="text-xs mt-1 opacity-70 text-right">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
