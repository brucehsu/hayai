import { AIClient, AIMessage, AIResponse, AIClientConfig, ChatOptions } from "./types.ts";

export class GeminiClient implements AIClient {
  readonly provider = "gemini";
  readonly defaultModel = "gemini-2.5-flash";
  
  private config: AIClientConfig;
  
  constructor(config: AIClientConfig) {
    this.config = {
      model: this.defaultModel,
      temperature: 0.7,
      maxTokens: 100000,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      ...config,
    };
  }
  
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
  
  async chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new GeminiAIError("Gemini API key not configured", this.provider);
    }
    
    const model = options?.model || this.config.model || this.defaultModel;
    const temperature = options?.temperature || this.config.temperature || 0.7;
    const maxTokens = options?.maxTokens || this.config.maxTokens || 1000;
    
    try {
      // Convert messages to Gemini format
      const contents = this.convertMessagesToGeminiFormat(messages);
      
      const response = await fetch(
        `${this.config.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GeminiAIError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          this.provider,
          response.status
        );
      }
      
      const data = await response.json();

      console.log(model);
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(JSON.stringify(data, null, 2));
        throw new GeminiAIError("Invalid response format from Gemini", this.provider);
      }
      
      return {
        content: data.candidates[0].content.parts[0].text,
        model: model,
        usage: {
          prompt_tokens: data.usageMetadata?.promptTokenCount,
          completion_tokens: data.usageMetadata?.candidatesTokenCount,
          total_tokens: data.usageMetadata?.totalTokenCount,
        },
      };
      
    } catch (error) {
      if (error instanceof GeminiAIError) {
        throw error;
      }
      
      throw new GeminiAIError(
        `Gemini API error: ${error.message}`,
        this.provider
      );
    }
  }
  
  private convertMessagesToGeminiFormat(messages: AIMessage[]) {
    const contents: any[] = [];
    
    for (const message of messages) {
      if (message.role === "system") {
        // Gemini doesn't have system role, so we'll add it as user message with context
        contents.push({
          role: "user",
          parts: [{ text: `System: ${message.content}` }],
        });
      } else {
        contents.push({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        });
      }
    }
    
    return contents;
  }
}

class GeminiAIError extends Error {
  constructor(message: string, public provider: string, public statusCode?: number, public type?: string) {
    super(message);
    this.name = "AIError";
  }
} 