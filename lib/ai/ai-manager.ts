import {
  AIClient,
  AIClientConfig,
  AIMessage,
  AIProvider,
  AIResponse,
  AIStreamResponse,
  ChatOptions,
} from "./types.ts";
import { OpenAIClient } from "./openai-client.ts";
import { GeminiClient } from "./gemini-client.ts";

export class AIManager {
  private clients: Map<AIProvider, AIClient> = new Map();
  private defaultProvider: AIProvider = "openai";

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize OpenAI client
    const openaiKey = globalThis.Deno?.env.get("OPENAI_API_KEY");
    if (openaiKey) {
      this.clients.set("openai", new OpenAIClient({ apiKey: openaiKey }));
    }

    // Initialize Gemini client
    const geminiKey = globalThis.Deno?.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      this.clients.set("google", new GeminiClient({ apiKey: geminiKey }));
    }
  }

  /**
   * Get available AI providers
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: AIProvider): boolean {
    return this.clients.has(provider) &&
      this.clients.get(provider)!.isConfigured();
  }

  /**
   * Get a specific AI client
   */
  getClient(provider: AIProvider): AIClient | null {
    return this.clients.get(provider) || null;
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(provider: AIProvider) {
    if (this.isProviderAvailable(provider)) {
      this.defaultProvider = provider;
    } else {
      throw new Error(`Provider ${provider} is not available`);
    }
  }

  /**
   * Get the default provider
   */
  getDefaultProvider(): AIProvider {
    return this.defaultProvider;
  }

  /**
   * Send a chat request using the specified or default provider
   */
  async chat(
    messages: AIMessage[],
    provider?: AIProvider,
    options?: ChatOptions,
  ): Promise<AIResponse> {
    const targetProvider = provider || this.defaultProvider;
    const client = this.getClient(targetProvider);

    if (!client) {
      throw new Error(`AI provider ${targetProvider} is not available`);
    }

    if (!client.isConfigured()) {
      throw new Error(
        `AI provider ${targetProvider} is not properly configured`,
      );
    }

    return await client.chat(messages, options);
  }

  /**
   * Send a streaming chat request using the specified or default provider
   */
  async *chatStream(
    messages: AIMessage[],
    provider?: AIProvider,
    options?: ChatOptions,
  ): AsyncIterable<AIStreamResponse> {
    const targetProvider = provider || this.defaultProvider;
    const client = this.getClient(targetProvider);

    if (!client) {
      throw new Error(`AI provider ${targetProvider} is not available`);
    }

    if (!client.isConfigured()) {
      throw new Error(
        `AI provider ${targetProvider} is not properly configured`,
      );
    }

    yield* client.chatStream(messages, options);
  }

  /**
   * Get provider display names
   */
  getProviderDisplayName(provider: AIProvider): string {
    switch (provider) {
      case "openai":
        return "OpenAI GPT-4o";
      case "google":
        return "Google Gemini 2.5 Flash";
      default:
        return provider;
    }
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: AIProvider): string[] {
    switch (provider) {
      case "openai":
        return ["gpt-4o-2024-08-06", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"];
      case "google":
        return [
          "gemini-2.5-flash",
          "gemini-1.5-flash",
          "gemini-1.5-pro",
          "gemini-pro",
        ];
      default:
        return [];
    }
  }
}

// Singleton instance
export const aiManager = new AIManager();

/**
 * Helper function to convert legacy provider strings to AIProvider type
 */
export function normalizeProvider(provider: string): AIProvider {
  switch (provider.toLowerCase()) {
    case "openai":
    case "gpt":
    case "gpt-4":
      return "openai";
    case "gemini":
    case "google":
      return "google";
    default:
      return "openai"; // fallback
  }
}
