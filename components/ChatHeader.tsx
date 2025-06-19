import { JSX } from "preact";
import Badge from "./Badge.tsx";
import Button from "./Button.tsx";
import Icon from "./Icon.tsx";

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
            <Button
              variant="outline"
              type="button"
              onClick={handleShare}
              class="px-3 py-2"
              id="share-button"
            >
              <Icon type="share" />
            </Button>
          )}
          {currentThread && Boolean(currentThread.public) && (
            <Badge variant="green">Public</Badge>
          )}
        </div>
        {currentThread && (
          <div class="flex items-center gap-2">
            <Badge variant="blue">
              {currentThread.llm_provider === "openai"
                ? "OpenAI GPT-4o"
                : "Google Gemini 2.5 Flash"}
            </Badge>
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
