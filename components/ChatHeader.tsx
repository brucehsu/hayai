import { JSX } from "preact";
import Badge from "./Badge.tsx";
import Button from "./Button.tsx";
import Icon from "./Icon.tsx";
import { getModelDisplayNameFromThread } from "../utils/model-mapping.ts";
import { Thread } from "../db/database.ts";

interface ChatHeaderProps {
  currentThread?: Thread | null;
  title?: string;
  isOwner?: boolean;
  onSummarize?: (threadUuid: string) => void;
  isSummarizing?: boolean;
  showSummaries?: boolean;
  onToggleSummaries?: () => void;
}

// Utility function to check if a thread has been summarized
function isThreadSummarized(thread: ChatHeaderProps["currentThread"]): boolean {
  if (!thread || !thread.messages) return false;

  try {
    const messages = JSON.parse(thread.messages);
    if (!Array.isArray(messages) || messages.length === 0) return false;

    // Check if any message has a summary field that's different from its content
    return messages.some((message: { summary?: string; content: string }) =>
      message.summary &&
      message.summary !== message.content
    );
  } catch {
    return false;
  }
}

export default function ChatHeader(
  {
    currentThread,
    title,
    isOwner = false,
    onSummarize,
    isSummarizing = false,
    showSummaries = false,
    onToggleSummaries,
  }: ChatHeaderProps,
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

  const handleSummarise = async () => {
    if (!currentThread || isSummarizing || !onSummarize) {
      return;
    }

    onSummarize(currentThread.uuid);
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
              disabled={isSummarizing}
            >
              <Icon type="share" />
            </Button>
          )}
          {currentThread && Boolean(currentThread.public) && (
            <Badge variant="green">Public</Badge>
          )}
        </div>

        {/* Center Buttons */}
        {currentThread && (
          <div class="flex-1 flex justify-center gap-2">
            {!showSummaries
              ? (
                <Button
                  variant="submit"
                  type="button"
                  onClick={handleSummarise}
                  class="px-4 py-2 flex items-center gap-2 summarise-button"
                  disabled={isSummarizing}
                >
                  <span>Summarise</span>
                  <Icon type={isSummarizing ? "spinner" : "summarise"} />
                  <span>Messages</span>
                </Button>
              )
              : (
                <Button
                  variant="submit"
                  type="button"
                  onClick={onToggleSummaries}
                  class="px-4 py-2 flex items-center gap-2 unfold-button"
                >
                  <span>Unfold</span>
                  <Icon type={"unfold"} />
                  <span>Messages</span>
                </Button>
              )}
          </div>
        )}

        {currentThread && (
          <div class="flex items-center gap-2">
            <Badge variant="blue">
              {getModelDisplayNameFromThread(currentThread)}
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
