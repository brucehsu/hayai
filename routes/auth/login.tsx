import { Handlers, PageProps } from "$fresh/server.ts";
import Icon from "../../components/Icon.tsx";

export const handler: Handlers = {
  GET() {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const redirectUri = `${
      Deno.env.get("HOST_URL") || "http://localhost:8000"
    }/auth/callback`;

    const googleAuthUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    googleAuthUrl.searchParams.set("client_id", clientId || "");
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");

    const headers = new Headers();
    headers.set("location", googleAuthUrl.toString());
    return new Response(null, { status: 302, headers });
  },
};

export default function Login() {
  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 class="text-2xl font-bold text-center mb-6">hayai</h1>
        <p class="text-gray-600 text-center mb-6">
          Sign in with your Google account to start chatting with AI assistants
        </p>
        <a
          href="/auth/login"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md flex items-center justify-center transition-colors"
        >
          <Icon type="google" class="mr-2" />
          Continue with Google
        </a>
      </div>
    </div>
  );
}
