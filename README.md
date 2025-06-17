# Hayai

A full-stack AI chat web application built with Deno Fresh, featuring multiple AI model support through a universal client interface, user authentication, and persistent chat threads.

## Features

- 🤖 **Universal AI Interface**: Unified API supporting OpenAI GPT-4o, Google Gemini 2.5 Flash, and Anthropic Claude (planned)
- 👤 **Google OAuth Authentication**: Secure login with Google accounts
- 💬 **Persistent Chat Threads**: Organize conversations with UUID-based routing
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS and Islands architecture
- 📊 **SQLite Database**: File-based database with automatic migrations
- 🔧 **Server-side API Key Management**: Configure AI provider keys server-side
- ⚡ **Real-time AI Integration**: Actual API calls to AI providers (not mock responses)
- 🏝️ **Islands Architecture**: Interactive components with optimistic updates

## Tech Stack

- **Framework**: Deno Fresh (SSR with Islands architecture)
- **Runtime**: Deno 2.0+
- **Database**: SQLite with Deno SQLite driver (`@db/sqlite`)
- **Authentication**: Google OAuth 2.0
- **Styling**: Tailwind CSS (via Twind)
- **AI Integration**: Universal client interface supporting multiple providers

## Project Structure

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

## Database Schema

### Users Table
- `id`: Primary key (auto-increment)
- `email`: User email from Google OAuth
- `name`: User display name
- `avatar_url`: Profile picture URL (optional)
- `oauth_id`: Google OAuth ID (unique)
- `oauth_type`: Authentication type ('google' or 'guest')
- `created_at`, `updated_at`: Auto-managed timestamps

### Threads Table
- `id`: Primary key (auto-increment)
- `uuid`: Unique identifier for URL routing
- `user_id`: Foreign key to users table
- `title`: Auto-generated chat thread title
- `messages`: JSON array of message objects
- `llm_provider`: Selected AI provider ('openai', 'gemini', 'anthropic')
- `created_at`, `updated_at`: Auto-managed timestamps with triggers

### Message Format (in JSON)
```json
{
  "id": "uuid",
  "type": "user" | "gpt-4o-2024-08-06" | "gemini-2.5-flash-preview-05-20",
  "content": "message content",
  "timestamp": "ISO 8601 string"
}
```

## AI Integration

### Universal AI Client Architecture

The application features a sophisticated AI client system that provides:

- **Unified Interface**: Single API for all AI providers
- **Provider Switching**: Runtime switching between AI models
- **Error Handling**: Comprehensive error handling with fallbacks
- **Usage Tracking**: Token usage monitoring (where supported)
- **Model Selection**: Dynamic model selection per conversation

### Supported AI Providers

#### OpenAI (Fully Implemented)
- **Default Model**: GPT-4o-2024-08-06
- **Available Models**: GPT-4, GPT-4-turbo, GPT-3.5-turbo
- **Features**: Full chat completion, token usage tracking
- **Configuration**: Requires `OPENAI_API_KEY`

#### Google Gemini (Fully Implemented)
- **Default Model**: Gemini-2.5-flash-preview-05-20
- **Available Models**: Gemini-1.5-flash, Gemini-1.5-pro, Gemini-pro
- **Features**: Chat completion with message format conversion
- **Configuration**: Requires `GEMINI_API_KEY`
- **Note**: System messages converted to user messages with "System:" prefix

#### Anthropic Claude (Interface Ready)
- **Status**: Client interface implemented, API integration pending
- **Planned Models**: Claude-3-sonnet, Claude-3-haiku
- **Configuration**: Will require `ANTHROPIC_API_KEY`

## Setup Instructions

### 1. Prerequisites

Install Deno 2.0+:
```bash
curl -fsSL https://deno.land/install.sh | sh
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp env.example .env
```

Configure your `.env` file:
```env
# Google OAuth (Required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
DATABASE_PATH=./database.db

# AI API Keys (Optional - app works without them)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key

# Session Secret (Required)
SESSION_SECRET=your_random_session_secret

# Host URL
HOST_URL=http://localhost:8000
```

### 3. Google OAuth Setup

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API or Google Identity API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8000/auth/callback`
5. Copy Client ID and Client Secret to your `.env` file

### 4. Run the Application

Start the development server:
```bash
deno task start
```

The application will be available at http://localhost:8000

## Usage

### Getting Started
1. **Authentication**: Click "Continue with Google" to sign in
2. **New Chat**: Click "New Chat" or start typing in the input area
3. **Model Selection**: Use the dropdown in chat header to switch AI providers
4. **Thread Management**: All conversations are saved with unique URLs
5. **Navigation**: Access chat history from the sidebar

### AI Provider Management
- The app automatically detects which AI providers are configured
- Unconfigured providers are gracefully disabled in the UI
- Provider switching is supported mid-conversation
- Each thread remembers its last used AI provider

### API Endpoints

#### POST /api/chat
Direct AI completion API:
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }],
    provider: 'openai', // optional: 'openai', 'gemini', 'anthropic'
    model: 'gpt-4o-2024-08-06', // optional, uses provider default
    temperature: 0.7, // optional
    maxTokens: 1000 // optional
  })
});
```

#### GET /api/chat
Get available providers and configuration:
```javascript
const response = await fetch('/api/chat');
const data = await response.json();
// Returns: { providers: [...], defaultProvider: "openai" }
```

## Development

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
  
  async chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse> {
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

## Production Deployment

### Environment Setup
1. Set `HOST_URL` to your production domain
2. Generate secure `SESSION_SECRET` (32+ random characters)
3. Configure production OAuth redirect URIs in Google Console
4. Set up AI provider API keys based on your needs

### Deployment Options
- **Deno Deploy**: Native support for Deno Fresh applications
- **Docker**: Use official Deno Docker images
- **VPS**: Direct deployment with systemd service

### Performance Considerations
- SQLite is suitable for moderate traffic; consider PostgreSQL for high volume
- AI API rate limits vary by provider
- Session data is stored server-side in memory (consider Redis for multi-instance)

## Contributing

The project follows standard Deno and Fresh conventions:
- Use `deno fmt` for code formatting
- Run `deno lint` for code quality
- TypeScript strict mode is enabled
- All AI clients must implement the `AIClient` interface

## TODO
- Purge guest accounts and threads periodically

## License

MIT License - feel free to use this project as a starting point for your own AI chat applications. 