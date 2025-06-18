import { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";
import Button from "./Button.tsx";
import Spinner from "./Spinner.tsx";

interface MessageInputProps {
  onSubmit: (e: Event) => void;
  placeholder: string;
  disabled: boolean;
  isSubmitting: boolean;
  // For existing threads
  providerValue?: string;
  // For new threads
  showProviderSelect?: boolean;
  class?: string;
}

export default function MessageInput({
  onSubmit,
  placeholder,
  disabled,
  isSubmitting,
  providerValue,
  showProviderSelect = false,
  class: className = "",
}: MessageInputProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea functionality
  const handleInput = (e: Event) => {
    const textarea = e.target as HTMLTextAreaElement;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set height to scrollHeight with max height of 30vh
      const maxHeight = window.innerHeight * 0.3; // 30% of viewport height
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Handle form submission with Ctrl+Enter or Cmd+Enter
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      const form = textareaRef.current?.closest("form");
      if (form) {
        const submitEvent = new Event("submit", { cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <form onSubmit={onSubmit} class={`flex flex-col gap-2 ${className}`}>
        {/* Textarea row */}
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none overflow-y-auto min-h-[2.5rem] max-h-[30vh]"
          name="message"
          required
          disabled={disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        {/* Controls row */}
        <div class="flex gap-2 justify-between items-center">
          <div class="flex gap-2 items-center">
            {/* Hidden provider input for existing threads */}
            {providerValue && (
              <input
                type="hidden"
                name="provider"
                value={providerValue}
              />
            )}

            {/* Provider select for new threads */}
            {showProviderSelect && (
              <select
                name="provider"
                class="border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={disabled}
              >
                <option value="openai">OpenAI GPT-4o</option>
                <option value="gemini">Google Gemini 2.5 Flash</option>
              </select>
            )}
          </div>

          <div class="flex gap-2 items-center">
            <p class="text-xs text-gray-500">
              Press Ctrl+Enter (⌘+Enter on Mac) to send
            </p>
            <Button
              type="submit"
              variant="submit"
              disabled={disabled}
              class="px-3 py-2 rounded-lg flex-shrink-0"
            >
              {isSubmitting ? <Spinner /> : (
                <svg
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
