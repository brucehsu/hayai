export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
}

export interface AIClientConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
}

export interface AIStreamResponse {
  id: string;
  model: string;
  delta: {
    content?: string;
    role?: string;
  };
  finish_reason?: string | null;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface AIClient {
  /**
   * The provider name (e.g., 'openai', 'google')
   */
  readonly provider: string;

  /**
   * The default model for this client
   */
  readonly defaultModel: string;

  /**
   * Send a chat completion request
   */
  chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse>;

  /**
   * Send a streaming chat completion request
   */
  chatStream(
    messages: AIMessage[],
    options?: ChatOptions,
  ): AsyncIterable<AIStreamResponse>;

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean;
}

export interface ChatOptions {
  model?: string;
  stream?: boolean;
}

export type AIProvider = "openai" | "google";

export interface AIError extends Error {
  provider: string;
  statusCode?: number;
  type?: string;
}
