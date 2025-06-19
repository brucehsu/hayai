import {
  AIClient,
  AIClientConfig,
  AIError,
  AIMessage,
  AIResponse,
  AIStreamResponse,
  ChatOptions,
} from "./types.ts";

export class GeminiClient implements AIClient {
  readonly provider = "google";
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

  async chat(
    messages: AIMessage[],
    options?: ChatOptions,
  ): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new GeminiAIError("Gemini API key not configured", this.provider);
    }

    const model = options?.model || this.config.model || this.defaultModel;
    const temperature = this.config.temperature || 0.7;
    const maxTokens = this.config.maxTokens || 1000;

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
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GeminiAIError(
          errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          this.provider,
          response.status,
        );
      }

      const data = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new GeminiAIError(
          "Invalid response format from Gemini",
          this.provider,
        );
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
        `Gemini API error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        this.provider,
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

  async *chatStream(
    messages: AIMessage[],
    options?: ChatOptions,
  ): AsyncIterable<AIStreamResponse> {
    if (!this.isConfigured()) {
      throw new GeminiAIError("Gemini API key not configured", this.provider);
    }

    const model = options?.model || this.config.model || this.defaultModel;
    const temperature = this.config.temperature || 0.7;
    const maxTokens = this.config.maxTokens || 1000;

    try {
      const contents = this.convertMessagesToGeminiFormat(messages);

      const response = await fetch(
        `${this.config.baseUrl}/models/${model}:streamGenerateContent?key=${this.config.apiKey}`,
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
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GeminiAIError(
          errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          this.provider,
          response.status,
        );
      }

      if (!response.body) {
        throw new GeminiAIError("No response body received", this.provider);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Gemini returns JSON objects separated by newlines, but sometimes they can be partial
          // We need to find complete JSON objects in the buffer
          let startIndex = 0;
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;

          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];

            if (escapeNext) {
              escapeNext = false;
              continue;
            }

            if (char === "\\" && inString) {
              escapeNext = true;
              continue;
            }

            if (char === '"') {
              inString = !inString;
              continue;
            }

            if (!inString) {
              if (char === "{") {
                if (braceCount === 0) {
                  startIndex = i;
                }
                braceCount++;
              } else if (char === "}") {
                braceCount--;
                if (braceCount === 0) {
                  // We have a complete JSON object
                  const jsonStr = buffer.slice(startIndex, i + 1);
                  try {
                    const data = JSON.parse(jsonStr);

                    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                      yield {
                        id: crypto.randomUUID(),
                        model: model,
                        delta: {
                          content: data.candidates[0].content.parts[0].text,
                          role: "assistant",
                        },
                        finish_reason: data.candidates[0].finishReason || null,
                        usage: data.usageMetadata
                          ? {
                            prompt_tokens: data.usageMetadata.promptTokenCount,
                            completion_tokens:
                              data.usageMetadata.candidatesTokenCount,
                            total_tokens: data.usageMetadata.totalTokenCount,
                          }
                          : undefined,
                      };
                    }

                    if (data.candidates?.[0]?.finishReason) {
                      yield {
                        id: crypto.randomUUID(),
                        model: model,
                        delta: {},
                        finish_reason: data.candidates[0].finishReason,
                        usage: data.usageMetadata
                          ? {
                            prompt_tokens: data.usageMetadata.promptTokenCount,
                            completion_tokens:
                              data.usageMetadata.candidatesTokenCount,
                            total_tokens: data.usageMetadata.totalTokenCount,
                          }
                          : undefined,
                      };
                      return; // Stream is complete
                    }
                  } catch (parseError) {
                    // Silently skip invalid JSON - this is normal for partial chunks
                  }

                  // Remove the processed JSON from buffer
                  buffer = buffer.slice(i + 1);
                  i = -1; // Reset loop to start from beginning of remaining buffer
                  startIndex = 0;
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof GeminiAIError) {
        throw error;
      }

      throw new GeminiAIError(
        `Gemini API streaming error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        this.provider,
      );
    }
  }
}

class GeminiAIError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public type?: string,
  ) {
    super(message);
    this.name = "AIError";
  }
}
