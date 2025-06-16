import { JSX } from "preact";
import Sidebar from "./Sidebar.tsx";
import ChatArea from "./ChatArea.tsx";

interface ChatLayoutProps {
  user: { id: number; name: string; email: string } | null;
  threads: any[];
  currentThread: any;
  error?: string;
}

export default function ChatLayout({ user, threads, currentThread, error }: ChatLayoutProps): JSX.Element {
  return (
    <div class="flex h-screen bg-gray-100">
      <Sidebar user={user} threads={threads} />
      <ChatArea currentThread={currentThread} error={error} />
    </div>
  );
} 