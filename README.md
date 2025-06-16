# Hayai

A full-stack AI chat web application built with Deno Fresh, featuring multiple AI model support, user authentication, and persistent chat threads.

## Features

- 🤖 **Multiple AI Models**: Support for OpenAI GPT-4, Anthropic Claude, and Google Gemini
- 👤 **Google OAuth Authentication**: Secure login with Google accounts
- 💬 **Persistent Chat Threads**: Organize conversations in the sidebar
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 📊 **SQLite Database**: File-based database for user data and chat history
- 🔧 **Server-side API Key Management**: Configure default API keys on the server

## Tech Stack

- **Framework**: Deno Fresh (SSR with Islands architecture)
- **Database**: SQLite with Deno SQLite driver
- **Authentication**: Google OAuth 2.0
- **Styling**: Tailwind CSS
- **Runtime**: Deno 2.0+

## Project Structure

```
├── routes/                 # Fresh routes (pages and API endpoints)
│   ├── _app.tsx           # App wrapper component
│   ├── index.tsx          # Home page (chat interface)
│   ├── auth/              # Authentication routes
│   │   ├── login.tsx      # Google OAuth login
│   │   ├── callback.ts    # OAuth callback handler
│   │   └── logout.ts      # Logout handler
│   └── chat/              # Chat-related routes
│       ├── [id].tsx       # Individual chat thread
│       └── new.tsx        # New chat creation
├── components/            # Reusable UI components
│   ├── ChatLayout.tsx     # Main layout with sidebar
│   ├── Sidebar.tsx        # Thread list and navigation
│   └── ChatArea.tsx       # Message interface
├── db/                    # Database setup and operations
│   └── database.ts        # SQLite schema and queries
├── utils/                 # Utility functions
│   └── session.ts         # Session management
├── static/                # Static assets
│   └── styles.css         # Global styles
└── fresh.config.ts        # Fresh configuration
```

## Database Schema

### Users Table
- `id`: Primary key
- `email`: User email from Google
- `name`: User display name
- `avatar_url`: Profile picture URL
- `google_id`: Google OAuth ID
- `created_at`, `updated_at`: Timestamps

### Threads Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `title`: Chat thread title
- `messages`: JSON array of messages
- `llm_provider`: Selected AI model (openai/anthropic/gemini)
- `created_at`, `updated_at`: Timestamps

## Setup Instructions

### 1. Prerequisites

Install Deno 2.0+:
```bash
curl -fsSL https://deno.land/install.sh | sh
```

### 2. Environment Configuration

Copy the example environment file and configure your variables:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Google OAuth (required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
DATABASE_PATH=./database.db

# AI API Keys (optional - for actual AI responses)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key

# Session Secret
SESSION_SECRET=your_random_session_secret

# Host URL
HOST_URL=http://localhost:8000
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8000/auth/callback`
5. Copy the Client ID and Client Secret to your `.env` file

### 4. Run the Application

Start the development server:
```bash
deno task start
```

The application will be available at http://localhost:8000

## Usage

1. **Authentication**: Visit the app and click "Continue with Google" to log in
2. **Start Chat**: Click "New Chat" or use the input at the bottom to start a conversation
3. **Switch Models**: Use the dropdown in the chat header to change AI models
4. **View History**: All your chat threads are saved and accessible from the sidebar
5. **Logout**: Click "Sign Out" in the sidebar

## Development Notes

### Adding Real AI Integration

The current implementation uses mock responses. To add real AI integration:

1. Implement API calls in the POST handlers of chat routes
2. Use the configured API keys from environment variables
3. Handle rate limiting and error responses appropriately

Example for OpenAI integration:
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  }),
});
```

### Database Management

The SQLite database is automatically created on first run. To reset:
```bash
rm database.db
```

### Production Deployment

For production deployment:

1. Set `HOST_URL` to your production domain
2. Use a secure `SESSION_SECRET`
3. Configure proper OAuth redirect URIs
4. Consider using a more robust database for high traffic

## License

MIT License - feel free to use this project as a starting point for your own AI chat applications. 