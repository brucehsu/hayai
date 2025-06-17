import { Handlers } from "$fresh/server.ts";
import { clearSessionCookie } from "../../utils/session.ts";

export const handler: Handlers = {
  GET() {
    const headers = new Headers();
    clearSessionCookie(headers);
    headers.set("location", "/");
    
    return new Response(null, { status: 302, headers });
  },
}; 