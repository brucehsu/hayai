import { JSX } from "preact";
import ThreadList from "./ThreadList.tsx";

interface SidebarProps {
  user: { id: number; name: string; email: string; isLoggedIn: boolean; messagesRemaining?: number; messageLimit?: number; isRateLimited?: boolean } | null;
  threads: any[];
  currentThread: any;
}

export default function Sidebar({ user, threads, currentThread }: SidebarProps): JSX.Element {
  return (
    <div class="w-64 bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div class="p-4 border-b border-gray-700">
        <h1 class="text-xl font-bold">Hayai</h1>
        {user && user.isLoggedIn ? (
          <div class="mt-2 text-sm text-gray-300">
            <p>{user.name}</p>
            <p class="text-xs">{user.email}</p>
          </div>
        ) : (
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
                    <span class={`ml-1 font-bold ${user.messagesRemaining <= 2 ? 'text-red-400' : user.messagesRemaining <= 5 ? 'text-yellow-400' : 'text-green-400'}`}>
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
              
              <a
                href="/auth/login"
                class="block bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm text-center transition-colors mt-4"
              >
                Sign In with Google
              </a>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div class="p-4">
        <a
          href="/chat/new"
          class="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
        >
          + New Chat
        </a>
      </div>

      {/* Threads List */}
      <div class="flex-1 overflow-y-auto">
        <div class="p-2">
          {user && user.isLoggedIn ? (
            <ThreadList 
              threads={threads}
              title="Your Chats"
              emptyMessage="No saved chats yet"
              currentThreadId={currentThread?.uuid}
            />
          ) : (
            <ThreadList 
              threads={threads}
              title="Recent Chats"
              emptyMessage="No chats yet"
              currentThreadId={currentThread?.uuid}
            />
          )}
        </div>
      </div>

      {/* User Menu */}

      {user && user.isLoggedIn && (
        <div class="p-4 border-t border-gray-700">
          <a
            href="/auth/logout"
            class="block bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm text-center transition-colors mt-4"
          >
            Sign Out
          </a>
        </div>
      )}
    </div>
  );
}
