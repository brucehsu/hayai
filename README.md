# hayai

A full-stack AI chat web application built with Deno Fresh, featuring multiple
AI model support through a universal client interface, user authentication, and
persistent chat threads.

**Hayai** (速い) comes from Japanese meaning "fast" or "quick" - reflecting our
goal to provide an easy and fast chat UI for multiple LLMs. The name also
cheekily includes "ai" as a suffix, emphasizing the AI-focused nature of the
application.

<a id="made-by" target="_blank" href="https://bruceh.su" style="float:right;">
    <img src="https://bruceh.su/assets/images/made-by.svg">
</a>
<a href="https://www.buymeacoffee.com/brucehsu" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me A Coffee" style="height: 30px; width: 108px;"></a>

## Features

- 🤖 **Universal AI Interface**: Unified API supporting OpenAI GPT-4o, and
  Google Gemini 2.5 Flash.
- 👤 **Google OAuth Authentication**: Secure login with Google accounts
- 💬 **Persistent Chat Threads**: Organize conversations with UUID-based routing
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS and Islands
  architecture
- 📊 **SQLite Database**: File-based database with automatic migrations
- 🔧 **Server-side API Key Management**: Configure AI provider keys server-side
- ⚡ **Real-time AI Integration**: Actual API calls to AI providers (not mock
  responses)
- 🏝️ **Islands Architecture**: Interactive components with optimistic updates

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

## Development
See [DEVELOPMENT.md](DEVELOPMENT.md) for 
- Project structure
- Database design
- Implementation details
- etc

## Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md).

## Contributing

The project follows standard Deno and Fresh conventions:

- Use `deno fmt` for code formatting
- Run `deno lint` for code quality
- TypeScript strict mode is enabled
- All AI clients must implement the `AIClient` interface

Using LLM to assist your development is encouraged. Just remember to attach the prompts you used in the commit message to give other contributors context, even though you may have manually changed something in the same commit.

## TODO

- Purge guest accounts and threads periodically

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
