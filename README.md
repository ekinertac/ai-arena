# AI Arena

A platform where two AI models engage in turn-based conversations about any topic. Watch River (the Defender) and Sage (the Critic) debate, discuss, and explore ideas in real-time.

## Features

- **Real-time AI Conversations**: Two AI models converse with each other
- **Multiple Conversation Types**: Mixed models, same-model debates, or collaborative discussions
- **Local AI Support**: Works with Ollama for free, private conversations
- **Whisper System**: Private messages to specific AI using @mentions (@River, @Sage)
- **Conversation Starters**: 30 curated topics across 6 categories
- **Streaming Responses**: Real-time typing indicators and message streaming
- **Dark UI**: Beautiful, modern interface optimized for extended use

## Quick Start

### Prerequisites

1. **Node.js 18+** installed
2. **Ollama** installed and running (for local AI models)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-battle

# Install dependencies
npm install

# Set up the database (Django-style)
npm run migrate

# Start the development server
npm run dev
```

### Setting up Ollama (Recommended)

1. Install Ollama: [ollama.ai](https://ollama.ai)
2. Start Ollama server: `ollama serve`
3. Pull some models:
   ```bash
   ollama pull phi3:3.8b      # Fast, efficient model
   ollama pull qwen3:8b       # Good reasoning model
   ollama pull deepseek-r1    # Advanced reasoning
   ollama pull phi4           # Latest Microsoft model
   ```

## Testing

### Full Integration Test

```bash
npm run test:ollama
```

Tests all functionality: Ollama connection, API endpoints, streaming, conversation flow, and whisper system.

### Quick Topic Test

```bash
npm run test:quick "Your debate topic here"

# Examples:
npm run test:quick "Should social media be regulated?"
npm run test:quick "Climate change solutions" phi4 deepseek-r1
```

### Hybrid Architecture Test

```bash
npm run test:hybrid
```

Tests the hybrid client-side Ollama vs server-side API routing, including performance comparisons.

### Database Test

```bash
npm run test:database
```

Tests database operations: conversation creation, message management, search, and CRUD operations.

### Manual Testing

1. Open [http://localhost:3000](http://localhost:3000)
2. Choose a conversation starter or enter your own topic
3. Watch River and Sage discuss the topic
4. Interrupt with your own messages or whispers (@River, @Sage)

## Hybrid Architecture 🏗️

AI Arena uses a **smart hybrid approach** that routes requests based on the selected AI provider:

### 🏠 Client-Side (Ollama)

- **Direct connection** to user's local Ollama server
- **Zero server costs** and **complete privacy**
- **4.5x faster** than server routing (tested: 2.1s vs 9.6s)
- Works **offline** with local models

### ☁️ Server-Side (OpenAI/Anthropic)

- Secure API key management on your server
- Access to **latest cloud models**
- **Reliable** and **always updated**

## Database

### SQLite (Development)

AI Arena uses **SQLite** for local development:

- **Zero setup** - Database file created automatically
- **File-based** - Easy backup and migration
- **Fast** - Perfect for development and testing

### PostgreSQL (Production)

For production deployment, easily migrate to PostgreSQL:

- **Scalable** - Handles multiple concurrent users
- **Reliable** - ACID transactions and data integrity
- **Cloud-ready** - Works with Vercel, Railway, Heroku, etc.

See [MIGRATION-TO-POSTGRESQL.md](./MIGRATION-TO-POSTGRESQL.md) for detailed migration guide.

**Django Developers**: See [DJANGO-COMMANDS.md](./DJANGO-COMMANDS.md) for familiar Django-style commands!

### Database Features

- **Persistent conversations** - Chat history saved between sessions
- **Message management** - Full CRUD operations for conversations and messages
- **Search functionality** - Find conversations by title or topic
- **Whisper support** - Private messages with @mentions tracked
- **Timestamps** - Automatic conversation and message timestamping

### Database Commands (Django-style)

```bash
# Get help with all commands
npm run help             # Show all available commands

# Django-familiar commands
npm run makemigrations    # Create new migration files
npm run migrate           # Apply migrations to database
npm run showmigrations    # Show migration status
npm run dbshell          # Open database GUI (Prisma Studio)
npm run shell            # Alias for dbshell

# Additional migration commands
npm run migrate:deploy   # Deploy migrations (production)
npm run migrate:reset    # Reset all migrations
npm run migrate:status   # Check migration status
npm run generate         # Regenerate Prisma client
```

## Configuration

### Local Development (Default)

Uses Ollama models with no API keys required. Perfect for development and testing.

### Production with API Keys

Set environment variables in `.env.local`:

```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Deployment Architecture

When you deploy AI Arena:

- **Ollama users**: Connect directly to their local Ollama (bypasses your server)
- **Cloud API users**: Use your server for secure API key management
- **Result**: Lower server costs, better performance, maximum privacy

## AI Models

### Supported Providers

- **Ollama** (Local): phi3, qwen3, deepseek-r1, phi4, mistral, etc.
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude-3.5-sonnet, Claude-3-haiku

### Default Configurations

- **Mixed**: phi3:3.8b vs qwen3:8b
- **Same Model**: deepseek-r1 vs deepseek-r1
- **Collaborative**: phi4 + qwen3:8b

## Project Structure

```
ai-battle/
├── app/
│   ├── api/
│   │   ├── chat/              # AI conversation endpoint
│   │   └── conversations/     # Database API endpoints
│   ├── page.tsx               # Main chat interface
│   └── layout.tsx             # App layout
├── components/ui/             # Reusable UI components
├── hooks/                     # React hooks
├── lib/
│   ├── ai-providers.ts        # AI provider implementations
│   ├── database.ts            # Database utilities and ORM
│   ├── system-prompts.ts      # AI personalities and roles
│   └── starters.ts            # Conversation topics
├── prisma/
│   └── schema.prisma          # Database schema
└── scripts/
    ├── test-ollama.js         # Comprehensive test suite
    ├── test-quick.js          # Quick topic testing
    ├── test-hybrid.js         # Hybrid architecture tests
    └── test-database.js       # Database operation tests
```

## Use Cases

- **Debate Practice**: Explore both sides of controversial topics
- **Creative Writing**: Let AIs build stories collaboratively
- **Research**: Get multiple perspectives on complex subjects
- **Learning**: Understand different viewpoints through AI discussion
- **Entertainment**: Watch AIs debate anything from pizza toppings to philosophy

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: Tailwind CSS + shadcn/ui components
- **Animation**: Framer Motion
- **AI**: OpenAI, Anthropic, Ollama
- **TypeScript**: Full type safety

## Development

### Adding New AI Providers

1. Implement the `AIProvider` interface in `lib/ai-providers.ts`
2. Add provider configuration in conversation setup
3. Test with the test scripts

### Adding Conversation Starters

Edit `lib/starters.ts` to add new topics and categories.

### Modifying AI Personalities

Update `lib/system-prompts.ts` to change how River and Sage behave.

## Troubleshooting

### Ollama Issues

- Check if Ollama is running: `ollama list`
- Start Ollama: `ollama serve`
- Pull models: `ollama pull phi3:3.8b`

### API Errors

- Verify environment variables in `.env.local`
- Check API key validity
- Ensure sufficient API credits

### Build Issues

- Clear cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:ollama`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
