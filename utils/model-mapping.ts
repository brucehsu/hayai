export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "gpt-4o-2024-08-06": "GPT-4o",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
};

export function getModelDisplayName(modelVersion: string): string {
  return MODEL_DISPLAY_NAMES[modelVersion] || modelVersion;
}

export function getModelDisplayNameFromThread(thread: {
  llm_model_version?: string;
  llm_provider?: string;
}): string {
  // Use llm_model_version if available, otherwise fall back to provider-based logic
  if (thread.llm_model_version) {
    return getModelDisplayName(thread.llm_model_version);
  }

  // Fallback for threads that don't have llm_model_version yet
  if (thread.llm_provider === "openai") {
    return "GPT-4o";
  } else if (thread.llm_provider === "google") {
    return "Gemini 2.5 Flash";
  }

  return "Unknown Model";
}

export function getModelVersionFromProvider(provider: string): string {
  if (provider === "openai") {
    return "gpt-4o-2024-08-06";
  } else if (provider === "google") {
    return "gemini-2.5-flash";
  }
  return "";
}
