import { JSX } from "preact";

interface ChatHeaderProps {
  currentThread?: {
    uuid: string;
    title: string;
    llm_provider: string;
    public: boolean;
    user_id: number;
  } | null;
  title?: string;
  isOwner?: boolean;
}

export default function ChatHeader(
  { currentThread, title, isOwner = false }: ChatHeaderProps,
): JSX.Element {
  const handleShare = async () => {
    if (!currentThread) return;

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadUuid: currentThread.uuid }),
      });

      if (response.ok) {
        const { shareUrl } = await response.json();
        await navigator.clipboard.writeText(shareUrl);

        // Show tooltip
        const button = document.querySelector("#share-button") as HTMLElement;
        if (button) {
          const tooltip = document.createElement("div");
          tooltip.textContent = "URL copied to clipboard!";
          tooltip.className =
            "absolute bg-black text-white px-2 py-1 rounded text-xs top-full mt-2 left-1/2 transform -translate-x-1/2 z-10";
          button.style.position = "relative";
          button.appendChild(tooltip);

          setTimeout(() => {
            if (tooltip.parentNode) {
              tooltip.parentNode.removeChild(tooltip);
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Failed to share thread:", error);
    }
  };

  return (
    <div class="bg-white border-b border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold">
            {title || (currentThread ? currentThread.title : "hayai")}
          </h2>
          {currentThread && isOwner && !Boolean(currentThread.public) && (
            <button
              id="share-button"
              type="button"
              onClick={handleShare}
              class="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Share thread"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
            </button>
          )}
          {currentThread && Boolean(currentThread.public) && (
            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Public
            </span>
          )}
        </div>
        {currentThread && (
          <div class="flex items-center gap-2">
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {currentThread.llm_provider === "openai"
                ? "OpenAI GPT-4o"
                : "Google Gemini 2.5 Flash"}
            </span>
            <img
              src="/logo.png"
              alt="hayai Logo"
              class="h-8 w-auto mr-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
