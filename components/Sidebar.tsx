import { JSX } from "preact";

interface SidebarProps {
  user: { id: number; name: string; email: string; isLoggedIn: boolean } | null;
  threads: any[];
}

export default function Sidebar({ user, threads }: SidebarProps): JSX.Element {
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
            <>
              <h2 class="text-sm font-medium text-gray-400 mb-2">Your Chats</h2>
              {threads.length === 0 ? (
                <p class="text-gray-500 text-sm">No saved chats yet</p>
              ) : (
                threads.map((thread: any) => (
                  <a
                    key={thread.id}
                    href={`/chat/${thread.uuid}`}
                    class="block p-3 mb-2 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <div class="font-medium text-sm truncate">
                      {thread.title}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      {new Date(thread.updated_at).toLocaleDateString()}
                    </div>
                  </a>
                ))
              )}
            </>
          ) : (
            <>
              <h2 class="text-sm font-medium text-gray-400 mb-2">
                Recent Chats
              </h2>
              {threads.length === 0 ? (
                <p class="text-gray-500 text-sm">No chats yet</p>
              ) : (
                threads.map((thread: any) => (
                  <a
                    key={thread.id}
                    href={`/chat/${thread.uuid}`}
                    class="block p-3 mb-2 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <div class="font-medium text-sm truncate">
                      {thread.title}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      {new Date(thread.updated_at).toLocaleDateString()}
                    </div>
                  </a>
                ))
              )}
            </>
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
