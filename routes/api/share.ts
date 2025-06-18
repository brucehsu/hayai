import { Handlers } from "$fresh/server.ts";
import { getExtendedSessionFromRequest } from "../../utils/session.ts";
import { getThreadByUuid, makeThreadPublic } from "../../db/database.ts";

export const handler: Handlers = {
  async POST(req) {
    const extendedSession = await getExtendedSessionFromRequest(req);
    
    if (!extendedSession) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { threadUuid } = await req.json();
    
    if (!threadUuid) {
      return new Response("Thread UUID is required", { status: 400 });
    }

    const thread = getThreadByUuid(threadUuid);
    
    if (!thread) {
      return new Response("Thread not found", { status: 404 });
    }

    if (thread.user_id !== extendedSession.userId) {
      return new Response("Access denied", { status: 403 });
    }

    // Make the thread public
    makeThreadPublic(threadUuid);

    const shareUrl = `${new URL(req.url).origin}/chat/${threadUuid}`;
    
    return new Response(JSON.stringify({ shareUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  },
}; 