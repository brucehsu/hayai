# Tech Stack

- **Framework**: Deno Fresh (SSR with Islands architecture)
- **Runtime**: Deno 2.0+
- **Database**: SQLite with Deno SQLite driver (`@db/sqlite`)
- **Authentication**: Google OAuth 2.0
- **Styling**: Tailwind CSS (via Twind)
- **AI Integration**: Universal client interface supporting multiple providers


# Project Structure

```
├── routes/                 # Fresh routes (pages and API endpoints)
│   ├── _app.tsx           # App wrapper component
│   ├── index.tsx          # Home page (chat interface)
│   ├── api/
│   │   └── chat.ts        # Universal AI API endpoint
│   ├── auth/              # Authentication routes
│   │   ├── login.tsx      # Google OAuth login
│   │   ├── callback.ts    # OAuth callback handler
│   │   └── logout.ts      # Logout handler
│   └── chat/              # Chat-related routes
│       ├── [id].tsx       # Individual chat thread (UUID-based)
│       └── new.tsx        # New chat creation
├── islands/               # Interactive client-side components
│   └── ChatArea.tsx       # Main chat interface with optimistic updates
├── components/            # Server-side components
│   ├── ChatLayout.tsx     # Main layout with sidebar
│   └── Sidebar.tsx        # Thread list and navigation
├── lib/                   # Core library code
│   └── ai/                # Universal AI client system
│       ├── ai-manager.ts  # Main AI manager with provider switching
│       ├── types.ts       # AI interfaces and types
│       ├── openai-client.ts   # OpenAI GPT implementation
│       ├── gemini-client.ts   # Google Gemini implementation
│       └── README.md      # Detailed AI system documentation
├── db/                    # Database operations
│   └── database.ts        # SQLite schema, migrations, and queries
├── utils/                 # Utility functions
│   └── session.ts         # Session management
├── static/                # Static assets
│   └── styles.css         # Global styles
├── deno.json              # Deno configuration and dependencies
├── fresh.config.ts        # Fresh framework configuration
├── twind.config.ts        # Tailwind CSS configuration
├── main.ts                # Production entry point
└── dev.ts                 # Development entry point
```

# Database Schema

## Users Table

- `id`: Primary key (auto-increment)
- `email`: User email from Google OAuth
- `name`: User display name
- `avatar_url`: Profile picture URL (optional)
- `oauth_id`: Google OAuth ID (unique)
- `oauth_type`: Authentication type ('google' or 'guest')
- `created_at`, `updated_at`: Auto-managed timestamps

## Threads Table

- `id`: Primary key (auto-increment)
- `uuid`: Unique identifier for URL routing
- `user_id`: Foreign key to users table
- `title`: Auto-generated chat thread title
- `messages`: JSON array of message objects
- `llm_provider`: Selected AI provider ('openai', 'gemini')
- `created_at`, `updated_at`: Auto-managed timestamps with triggers

## Message Format (in JSON)

```json
{
  "id": "uuid",
  "type": "user" | "gpt-4o-2024-08-06" | "gemini-2.5-flash",
  "content": "message content",
  "timestamp": "ISO 8601 string"
}
```

# AI Integration

## Universal AI Client Architecture

The application features a sophisticated AI client system that provides:

- **Unified Interface**: Single API for all AI providers
- **Provider Switching**: Runtime switching between AI models
- **Error Handling**: Comprehensive error handling with fallbacks
- **Usage Tracking**: Token usage monitoring (where supported)
- **Model Selection**: Dynamic model selection per conversation

## Supported AI Providers

### OpenAI (Fully Implemented)

- **Default Model**: GPT-4o-2024-08-06
- **Available Models**: GPT-4, GPT-4-turbo, GPT-3.5-turbo
- **Features**: Full chat completion, token usage tracking
- **Configuration**: Requires `OPENAI_API_KEY`

### Google Gemini (Fully Implemented)

- **Default Model**: gemini-2.5-flash
- **Available Models**: Gemini-1.5-flash, Gemini-1.5-pro, Gemini-pro
- **Features**: Chat completion with message format conversion
- **Configuration**: Requires `GEMINI_API_KEY`
- **Note**: System messages converted to user messages with "System:" prefix


### Available Tasks

```bash
# Start development server with auto-reload
deno task start

# Build for production
deno task build

# Run production build
deno task preview

# Code quality checks
deno task check

# Update Fresh framework
deno task update
```

### Adding New AI Providers

To integrate a new AI provider:

1. **Create Client Class**: Implement the `AIClient` interface in `lib/ai/`
2. **Update Types**: Add provider to `AIProvider` type in `types.ts`
3. **Register Client**: Add initialization in `AIManager.initializeClients()`
4. **Define Models**: Add models in `getAvailableModels()`
5. **Set Display Name**: Add name in `getProviderDisplayName()`

Example client implementation:

```typescript
export class CustomAIClient implements AIClient {
  readonly provider = "custom";
  readonly defaultModel = "custom-v1";

  constructor(private config: AIClientConfig) {}

  async chat(
    messages: AIMessage[],
    options?: ChatOptions,
  ): Promise<AIResponse> {
    // Implementation here
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}
```

### Database Management

The SQLite database includes:

- **Auto-initialization**: Creates tables on first run
- **Migrations**: UUID column added automatically to existing databases
- **Triggers**: Automatic timestamp updates
- **Data Integrity**: Foreign key constraints

To reset the database:

```bash
rm database.db
```

### Islands Architecture

The app uses Fresh's Islands architecture for optimal performance:

- **Server-Side Rendering**: Initial page loads are fast
- **Selective Hydration**: Only interactive components run on client
- **Optimistic Updates**: Immediate UI feedback before server response
