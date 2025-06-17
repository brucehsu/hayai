import { JSX } from "preact";

interface ThreadListProps {
  threads: any[];
  title: string;
  emptyMessage: string;
  currentThreadId?: string;
}

export default function ThreadList({ threads, title, emptyMessage, currentThreadId }: ThreadListProps): JSX.Element {
  return (
    <>
      <h2 class="text-sm font-medium text-gray-400 mb-2">{title}</h2>
      {threads.length === 0 ? (
        <p class="text-gray-500 text-sm">{emptyMessage}</p>
      ) : (
        threads.map((thread: any) => {
          const isSelected = thread.uuid === currentThreadId;
          return (
            <a
              key={thread.id}
              href={`/chat/${thread.uuid}`}
              class={`block p-3 mb-2 rounded-md transition-colors ${
                isSelected 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-gray-800"
              }`}
            >
              <div class="font-medium text-sm truncate">
                {thread.title}
              </div>
              <div class={`text-xs mt-1 ${
                isSelected ? "text-blue-100" : "text-gray-400"
              }`}>
                {new Date(thread.updated_at).toLocaleDateString()}
              </div>
            </a>
          );
        })
      )}
    </>
  );
} 