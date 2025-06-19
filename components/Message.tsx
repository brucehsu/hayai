import { JSX } from "preact";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { useEffect, useState } from "preact/hooks";
import hljs from "highlight.js";
import Icon from "./Icon.tsx";
import Button from "./Button.tsx";

// Configure marked with syntax highlighting
const marked = new Marked(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code: string, lang: string, info: string) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

interface MessageProps {
  message: {
    type: string;
    content: string | null;
    summary?: string | null;
    timestamp?: string;
  };
  showSummary?: boolean;
}

export default function Message(
  { message, showSummary = false }: MessageProps,
): JSX.Element {
  // Use summary if showSummary is true and summary is available, otherwise use content
  const [internalShowSummary, setInternalShowSummary] = useState(showSummary);
  useEffect(() => {
    setInternalShowSummary(showSummary);
  }, [showSummary]);

  const displayContent = internalShowSummary && message.summary
    ? message.summary
    : message.content;

    let summaryOperationButton: JSX.Element | null = null;
    if (showSummary && message.summary !== message.content) {
      const opType = internalShowSummary ? "unfold" : "summarise";
      summaryOperationButton = (<span class="absolute left-40 top-1/2 -translate-y-1/2 pr-2"><Button variant="create" onClick={() => setInternalShowSummary(!internalShowSummary)} class={`${opType}-button`}><Icon type={opType} /></Button></span>);
    }

  return (
    <div
      class={`relative flex justify-center`}
    >
      {summaryOperationButton}
      <div
        class={`w-[80%] px-4 py-2 rounded-lg ${
          message.type === "user"
            ? "bg-user-message text-white text-right"
            : "bg-white text-gray-800 border border-gray-200"
        }`}
      >
        {displayContent === null
          ? (
            <div class="flex justify-center p-4">
              <Icon type="spinner" />
            </div>
          )
          : (
            <div
              class="text-sm markdown-content"
              dangerouslySetInnerHTML={{
                __html: marked.parse(displayContent) as string,
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
