import { aiManager } from "../../lib/ai/ai-manager.ts";
import { AIMessage, AIProvider } from "../../lib/ai/types.ts";

export const handler = {
  async POST(req: Request, _ctx) {
    try {
      const { messages, provider, model, temperature, maxTokens } = await req.json();
      
      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ error: "Messages array is required" }),
          { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Validate and normalize provider
      let targetProvider: AIProvider | undefined;
      if (provider) {
        if (!aiManager.isProviderAvailable(provider)) {
          return new Response(
            JSON.stringify({ 
              error: `Provider ${provider} is not available`,
              availableProviders: aiManager.getAvailableProviders()
            }),
            { 
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
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
        }
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
          headers: { "Content-Type": "application/json" }
        }
      );
      
    } catch (error) {
      console.error("Chat API error:", error);
      
      return new Response(
        JSON.stringify({ 
          error: error.message || "An error occurred while processing the chat request",
          success: false
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  },
  
  async GET(_req: Request, _ctx) {
    try {
      const availableProviders = aiManager.getAvailableProviders();
      const providersInfo = availableProviders.map(provider => ({
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
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Chat API providers error:", error);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to get providers information",
          success: false
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
}; 