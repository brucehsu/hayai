# Universal AI Client Interface

This directory contains a universal AI client interface that supports multiple AI providers including OpenAI and Gemini.

## Overview

The system provides a unified interface for interacting with different AI providers, making it easy to switch between providers or add new ones without changing the application code.

## Architecture

### Core Components

- **`types.ts`** - Defines interfaces and types for the AI system
- **`ai-manager.ts`** - Main manager class that handles multiple providers
- **`openai-client.ts`** - OpenAI API implementation
- **`gemini-client.ts`** - Google Gemini API implementation

### Key Interfaces

#### AIClient
```typescript
interface AIClient {
  readonly provider: string;
  readonly defaultModel: string;
  chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse>;
  isConfigured(): boolean;
}
```

#### AIMessage
```typescript
interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}
```

#### Database Message Format
```typescript
interface Message {
  id: string;
  type: string; // "user" or model name like "gpt-4o-2024-08-06", "gemini-2.5-flash-preview-05-20"
  content: string;
  timestamp: string;
}
```

#### AIResponse
```typescript
interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
}
```

## Usage

### Basic Usage

```typescript
import { aiManager } from "./lib/ai/ai-manager.ts";

// Send a chat message
const response = await aiManager.chat([
  { role: "user", content: "Hello!" }
]);

console.log(response.content);
```

### With Specific Provider

```typescript
// Use a specific provider
const response = await aiManager.chat([
  { role: "user", content: "Hello!" }
], "gemini");
```

### Check Available Providers

```typescript
const providers = aiManager.getAvailableProviders();
console.log(providers); // ["openai", "gemini"]

const isAvailable = aiManager.isProviderAvailable("openai");
console.log(isAvailable); // true/false
```

## Configuration

Set up your API keys in environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Supported Providers

### OpenAI
- **Models**: GPT-4o-2024-08-06 (default), GPT-4, GPT-4-turbo, GPT-3.5-turbo
- **Features**: Full chat completion support, token usage tracking
- **Requires**: `OPENAI_API_KEY` environment variable

### Google Gemini
- **Models**: Gemini-2.5-flash-preview-05-20 (default), Gemini-1.5-flash, Gemini-1.5-pro, Gemini-pro
- **Features**: Chat completion with automatic message format conversion
- **Requires**: `GEMINI_API_KEY` environment variable
- **Note**: System messages are converted to user messages with "System:" prefix

### Anthropic Claude (Planned)
- **Status**: Interface ready, implementation pending
- **Models**: Claude-3-sonnet, Claude-3-haiku
- **Requires**: `ANTHROPIC_API_KEY` environment variable

## API Routes

### POST /api/chat
Send a chat completion request:

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }],
    provider: 'openai', // optional
    model: 'gpt-4', // optional
    temperature: 0.7, // optional
    maxTokens: 1000 // optional
  })
});
```

### GET /api/chat
Get available providers and their status:

```javascript
const response = await fetch('/api/chat');
const data = await response.json();
// Returns: { providers: [...], defaultProvider: "openai" }
```

## Error Handling

The system includes comprehensive error handling:

- **Configuration errors**: When API keys are missing or invalid
- **API errors**: When the provider API returns an error
- **Network errors**: When requests fail due to connectivity issues
- **Format errors**: When responses don't match expected format

All errors are wrapped in a consistent `AIError` interface with provider information.

## Adding New Providers

To add a new AI provider:

1. Create a new client class implementing the `AIClient` interface
2. Add the provider to the `AIProvider` type in `types.ts`
3. Register the client in `AIManager.initializeClients()`
4. Add model definitions in `getAvailableModels()`
5. Add display name in `getProviderDisplayName()`

Example:
```typescript
export class NewProviderClient implements AIClient {
  readonly provider = "newprovider";
  readonly defaultModel = "model-v1";
  
  // Implement required methods...
}
```

## Integration with Fresh Routes

The AI client system is integrated into the chat routes:

- **`routes/chat/new.tsx`** - Creates new conversations with AI responses
- **`routes/chat/[id].tsx`** - Continues existing conversations
- **`routes/api/chat.ts`** - Direct API access for frontend interactions

The system gracefully handles both anonymous and authenticated users, with fallback responses when API keys are not configured.

## Message Format

The system uses a specific message format for database storage that differs from the AI client interface:

### Database Storage Format
Messages are stored in the database as JSON arrays with this structure:
```json
[
  { "id": "uuid", "type": "user", "content": "What model are you?", "timestamp": "2024-01-01T12:00:00Z" },
  { "id": "uuid", "type": "gpt-4o-2024-08-06", "content": "I'm GPT-4o from OpenAI.", "timestamp": "2024-01-01T12:00:01Z" }
]
```

### AI Client Interface Format
For communication with AI providers, messages are converted to:
```json
[
  { "role": "user", "content": "What model are you?" },
  { "role": "assistant", "content": "I'm GPT-4o from OpenAI." }
]
```

### Key Differences
- **Database**: Uses `type` field with "user" or actual model name (e.g., "gpt-4o-2024-08-06")
- **AI Client**: Uses `role` field with "user", "assistant", or "system"
- **Database**: Includes `id` and `timestamp` fields for tracking
- **AI Client**: Minimal structure focused on conversation flow

This dual format allows the UI to display which specific model generated each response while maintaining compatibility with different AI provider APIs. 