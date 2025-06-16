import { JSX } from "preact";

interface SidebarProps {
  user: { id: number; name: string; email: string } | null;
  threads: any[];
}

export default function Sidebar({ user, threads }: SidebarProps): JSX.Element {
  return (
    <div class="w-64 bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div class="p-4 border-b border-gray-700">
        <h1 class="text-xl font-bold">Hayai</h1>
        {user ? (
          <div class="mt-2 text-sm text-gray-300">
            <p>{user.name}</p>
            <p class="text-xs">{user.email}</p>
          </div>
        ) : (
          <div class="mt-2 text-sm text-gray-300">
            <p>Anonymous User</p>
            <a href="/auth/login" class="text-blue-400 hover:text-blue-300 text-xs">
              Sign in to save chats
            </a>
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
          {user ? (
            <>
              <h2 class="text-sm font-medium text-gray-400 mb-2">Your Chats</h2>
              {threads.length === 0 ? (
                <p class="text-gray-500 text-sm">No saved chats yet</p>
              ) : (
                threads.map((thread: any) => (
                  <a
                    key={thread.id}
                    href={`/chat/${thread.id}`}
                    class="block p-3 mb-2 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <div class="font-medium text-sm truncate">{thread.title}</div>
                    <div class="text-xs text-gray-400 mt-1">
                      {new Date(thread.updated_at).toLocaleDateString()}
                    </div>
                  </a>
                ))
              )}
            </>
          ) : (
            <div class="text-center text-gray-400 text-sm">
              <p class="mb-2">Sign in to save and access your chat history</p>
              <a 
                href="/auth/login" 
                class="inline-block bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-xs transition-colors"
              >
                Sign In
              </a>
            </div>
          )}
        </div>
      </div>

      {/* User Menu */}
      <div class="p-4 border-t border-gray-700">
        {user ? (
          <a 
            href="/auth/logout" 
            class="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </a>
        ) : (
          <a 
            href="/auth/login" 
            class="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Sign In with Google
          </a>
        )}
      </div>
    </div>
  );
} 