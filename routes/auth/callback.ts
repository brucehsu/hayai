import { Handlers } from "$fresh/server.ts";
import { createUser, getUserByGoogleId } from "../../db/database.ts";
import {
  clearSession,
  createSession,
  setSessionCookie,
} from "../../utils/session.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response("Missing authorization code", { status: 400 });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
          code: code,
          grant_type: "authorization_code",
          redirect_uri: `${
            Deno.env.get("HOST_URL") || "http://localhost:8000"
          }/auth/callback`,
        }),
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Get user info from Google
      const userResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const googleUser = await userResponse.json();

      // Check if user exists or create new one
      let user = getUserByGoogleId(googleUser.id);
      if (!user) {
        user = createUser({
          email: googleUser.email,
          name: googleUser.name,
          avatar_url: googleUser.picture,
          oauth_id: googleUser.id,
          oauth_type: "google",
        });
      }

      // Create session
      const sessionToken = await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        oauth_type: "google",
      });

      // Set session cookie and redirect
      const headers = new Headers();
      setSessionCookie(headers, sessionToken);
      headers.set("location", "/");

      return new Response(null, { status: 302, headers });
    } catch (error) {
      console.error("OAuth callback error:", error);
      return new Response("Authentication failed", { status: 500 });
    }
  },
};
