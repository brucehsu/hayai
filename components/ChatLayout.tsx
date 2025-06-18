import { JSX } from "preact";
import Sidebar from "./Sidebar.tsx";
import ChatArea from "../islands/ChatArea.tsx";

interface ChatLayoutProps {
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
  isOwner: boolean;
  error?: string;
}

export default function ChatLayout(
  { user, threads, currentThread, isOwner, error }: ChatLayoutProps,
): JSX.Element {
  return (
    <div class="flex h-screen bg-gray-100">
      <Sidebar user={user} threads={threads} currentThread={currentThread} />
      <ChatArea currentThread={currentThread} error={error} user={user} isOwner={isOwner} />
    </div>
  );
}
