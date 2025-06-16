import { Handlers, PageProps } from "$fresh/server.ts";
import { getSessionFromRequest } from "../utils/session.ts";
import { getThreadsByUserId } from "../db/database.ts";
import ChatLayout from "../components/ChatLayout.tsx";

interface PageData {
  user: { id: number; name: string; email: string } | null;
  threads: any[];
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const session = await getSessionFromRequest(req);
    
    let threads = [];
    if (session) {
      // Load threads only if user is logged in
      threads = getThreadsByUserId(session.userId);
    }
    
    return ctx.render({
      user: session,
      threads
    });
  },
};

export default function Home({ data }: PageProps<PageData>) {
  return <ChatLayout user={data.user} threads={data.threads} currentThread={null} />;
} 