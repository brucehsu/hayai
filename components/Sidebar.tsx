import { JSX } from "preact";
import ThreadList from "./ThreadList.tsx";
import Button from "./Button.tsx";

interface SidebarProps {
  user: {
    id: number;
    name: string;
    email: string;
    isLoggedIn: boolean;
    messagesRemaining?: number;
    messageLimit?: number;
    isRateLimited?: boolean;
  } | null;
  threads: any[];
  currentThread: any;
}

export default function Sidebar(
  { user, threads, currentThread }: SidebarProps,
): JSX.Element {
  return (
    <div class="w-64 bg-primary-bg text-white flex flex-col">
      {/* Header */}
      <div class="p-4 border-gray-700">
        {user && user.isLoggedIn
          ? (
            <div class="mt-2 text-sm text-gray-300">
              <p>{user.name}</p>
              <p class="text-xs">{user.email}</p>
            </div>
          )
          : (
            <div class="mt-2">
              <div class="mt-2 p-3 bg-gray-800 rounded-md border border-gray-600">
                <p class="text-sm text-gray-300 font-bold">
                  You're now in Guest mode
                </p>
                <p class="text-sm text-gray-300">
                  To save your threads, create an account!
                </p>

                {/* Rate Limiting Info for Guests */}
                {user && user.messagesRemaining !== undefined && (
                  <div class="mt-3 p-2 bg-gray-700 rounded border border-gray-500">
                    <p class="text-xs text-gray-300 font-medium">
                      Messages remaining:
                      <span
                        class={`ml-1 font-bold ${
                          user.messagesRemaining <= 2
                            ? "text-red-400"
                            : user.messagesRemaining <= 5
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {user.messagesRemaining}/{user.messageLimit}
                      </span>
                    </p>
                    {user.isRateLimited && (
                      <p class="text-xs text-red-400 mt-1 font-medium">
                        Limit reached! Sign in to continue.
                      </p>
                    )}
                  </div>
                )}

                <div class="mt-4">
                  <Button
                    variant="google"
                    href="/auth/login"
                    class="block text-center w-full"
                  >
                    Sign In with Google
                  </Button>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* New Chat Button */}
      <div class="p-4">
        <Button
          variant="create"
          href="/chat/new"
          class="w-full flex items-center justify-center"
        >
          New Chat
        </Button>
      </div>

      {/* Threads List */}
      <div class="flex-1 overflow-y-auto">
        <div class="p-2">
          <ThreadList
            threads={threads}
            title="Your Chats"
            emptyMessage="What's on your mind today?"
            currentThreadId={currentThread?.uuid}
          />
        </div>
      </div>

      {/* User Menu */}

      {user && user.isLoggedIn && (
        <div class="p-4 border-gray-700">
          <Button
            variant="cancel"
            href="/auth/logout"
            class="block text-center w-full mt-4"
          >
            Sign Out
          </Button>
        </div>
      )}
      <a id="made-by" target="_blank" href="https://bruceh.su">
        <img
          src="https://bruceh.su/assets/images/made-by.svg"
          class="rounded-tr-2xl"
        >
        </img>
      </a>
    </div>
  );
}
