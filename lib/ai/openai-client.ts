import { AIClient, AIMessage, AIResponse, AIClientConfig, ChatOptions, AIError } from "./types.ts";

export class OpenAIClient implements AIClient {
  readonly provider = "openai";
  readonly defaultModel = "gpt-4o-2024-08-06";
  
  private config: AIClientConfig;
  
  constructor(config: AIClientConfig) {
    this.config = {
      model: "gpt-4o-2024-08-06",
      temperature: 0.7,
      maxTokens: 16384,
      baseUrl: "https://api.openai.com/v1",
      ...config,
    };
  }
  
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
  
  async chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new CustomAIError("OpenAI API key not configured", this.provider);
    }
    
    const model = options?.model || this.config.model || this.defaultModel;
    const temperature = options?.temperature || this.config.temperature || 0.7;
    const maxTokens = options?.maxTokens || this.config.maxTokens || 1000;
    
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature,
          max_tokens: maxTokens,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new CustomAIError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          this.provider,
          response.status
        );
      }
      
      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new CustomAIError("Invalid response format from OpenAI", this.provider);
      }
      
      return {
        content: data.choices[0].message.content,
        model: data.model || model,
        usage: {
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
          total_tokens: data.usage?.total_tokens,
        },
      };
      
    } catch (error) {
      if (error instanceof CustomAIError) {
        throw error;
      }
      
      throw new CustomAIError(
        `OpenAI API error: ${error.message}`,
        this.provider
      );
    }
  }
}

class CustomAIError extends Error implements AIError {
  constructor(message: string, public provider: string, public statusCode?: number, public type?: string) {
    super(message);
    this.name = "AIError";
  }
} 