import { JSX } from "preact";

interface ChatHeaderProps {
  currentThread?: {
    title: string;
    llm_provider: string;
  } | null;
  title?: string;
}

export default function ChatHeader(
  { currentThread, title }: ChatHeaderProps,
): JSX.Element {
  return (
    <div class="bg-white border-b border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">
          {title || (currentThread ? currentThread.title : "hayai")}
        </h2>
        {currentThread && (
          <form method="post" class="flex items-center gap-2">
            <label class="text-sm text-gray-600">Model:</label>
            <select
              name="provider"
              class="border border-gray-300 rounded px-3 py-1 text-sm"
              value={currentThread.llm_provider}
              onChange={(e) => (e.target as HTMLSelectElement).form?.submit()}
              disabled={true}
            >
              <option value="openai">OpenAI GPT-4o</option>
              <option value="gemini">Google Gemini 2.5 Flash</option>
            </select>
            <img 
              src="/logo.png" 
              alt="hayai Logo" 
              class="h-8 w-auto mr-2"
            />
            <input type="hidden" name="message" value="" />
          </form>
        )}
      </div>
    </div>
  );
}
