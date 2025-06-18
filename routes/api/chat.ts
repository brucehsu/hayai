import { aiManager } from "../../lib/ai/ai-manager.ts";
import { AIMessage, AIProvider } from "../../lib/ai/types.ts";
import { updateThreadByUuid } from "../../db/database.ts";

export const handler = {
  async POST(req: Request, _ctx) {
    const url = new URL(req.url);
    const isStreaming = url.searchParams.get("stream") === "true";
    const isUpdateTitle = url.searchParams.get("updateTitle") === "true";

    if (isStreaming) {
      return handleStreamingRequest(req);
    }

    if (isUpdateTitle) {
      return handleTitleUpdateRequest(req);
    }

    try {
      const { messages, provider, model, temperature, maxTokens } = await req
        .json();

      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ error: "Messages array is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Validate and normalize provider
      let targetProvider: AIProvider | undefined;
      if (provider) {
        if (!aiManager.isProviderAvailable(provider)) {
          return new Response(
            JSON.stringify({
              error: `Provider ${provider} is not available`,
              availableProviders: aiManager.getAvailableProviders(),
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        targetProvider = provider;
      }

      // Send chat request
      const response = await aiManager.chat(
        messages as AIMessage[],
        targetProvider,
        {
          model,
          temperature,
          maxTokens,
        },
      );

      return new Response(
        JSON.stringify({
          success: true,
          response: response.content,
          model: response.model,
          provider: targetProvider || aiManager.getDefaultProvider(),
          usage: response.usage,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Chat API error:", error);

      return new Response(
        JSON.stringify({
          error: error.message ||
            "An error occurred while processing the chat request",
          success: false,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },

  async GET(_req: Request, _ctx) {
    try {
      const availableProviders = aiManager.getAvailableProviders();
      const providersInfo = availableProviders.map((provider) => ({
        id: provider,
        name: aiManager.getProviderDisplayName(provider),
        models: aiManager.getAvailableModels(provider),
        isConfigured: aiManager.isProviderAvailable(provider),
      }));

      return new Response(
        JSON.stringify({
          success: true,
          providers: providersInfo,
          defaultProvider: aiManager.getDefaultProvider(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Chat API providers error:", error);

      return new Response(
        JSON.stringify({
          error: "Failed to get providers information",
          success: false,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};

async function handleStreamingRequest(req: Request): Promise<Response> {
  try {
    const { messages, provider, model, temperature, maxTokens } = await req
      .json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate and normalize provider
    let targetProvider: AIProvider | undefined;
    if (provider) {
      if (!aiManager.isProviderAvailable(provider)) {
        return new Response(
          JSON.stringify({
            error: `Provider ${provider} is not available`,
            availableProviders: aiManager.getAvailableProviders(),
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      targetProvider = provider;
    }

    // Create ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const streamResponse = aiManager.chatStream(
            messages as AIMessage[],
            targetProvider,
            {
              model,
              temperature,
              maxTokens,
            },
          );

          for await (const chunk of streamResponse) {
            const data = JSON.stringify({
              type: "chunk",
              data: chunk,
            });

            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send completion signal
          const completeData = JSON.stringify({
            type: "complete",
            provider: targetProvider || aiManager.getDefaultProvider(),
          });
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData = JSON.stringify({
            type: "error",
            error: error.message || "An error occurred during streaming",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Streaming request error:", error);

    return new Response(
      JSON.stringify({
        error: error.message ||
          "An error occurred while processing the streaming request",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function handleTitleUpdateRequest(req: Request): Promise<Response> {
  try {
    const { threadId, message } = await req.json();

    if (!threadId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Generate title using Gemini
    let title = message.trim().slice(0, 50) +
      (message.length > 50 ? "..." : ""); // fallback

    try {
      if (aiManager.isProviderAvailable("gemini")) {
        const titlePrompt =
          `Given this message "${message}" and the language it's written in, give me a 40-character overview as title without any formatting.`;
        const titleResponse = await aiManager.chat(
          [{ role: "user", content: titlePrompt }] as AIMessage[],
          "gemini",
          {
            model: "gemini-2.5-flash-lite-preview-06-17",
            temperature: 0.3,
            maxTokens: 50,
          },
        );
        title = titleResponse.content.trim();
      }
    } catch (error) {
      console.error("Title generation error:", error);
      // Keep fallback title
    }

    // Update the thread title
    updateThreadByUuid(threadId, { title });

    return new Response(
      JSON.stringify({
        success: true,
        title: title,
        message: "Thread title updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Title update error:", error);

    return new Response(
      JSON.stringify({
        error: error.message ||
          "An error occurred while updating the thread title",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
