# AI Arena - Todo List

## Project Overview

A platform where two AI models have turn-based discussions about user-provided prompts, with real-time user intervention capabilities, whisper functionality, and multi-provider support. The AIs engage in a structured debate format where River defends the user's idea and Sage critiques it.

## ✅ COMPLETED FEATURES

### ✅ Foundation & Infrastructure (DONE)

- [x] **Basic Chat Interface**

  - [x] Three-color chat bubble system (River/Defender, Sage/Critic, User)
  - [x] Real-time message streaming display
  - [x] Message timestamp and sender identification
  - [x] Auto-scroll to latest messages
  - [x] **Sidebar with Conversation History**
    - [x] List of previous conversations with titles
    - [x] Session management (create, select, delete)
    - [x] Session status indicators (active, completed, paused)
    - [x] Search functionality for conversation history
    - [x] Time-based grouping (Today, Yesterday, Last Week)

- [x] **AI Provider Integration**

  - [x] OpenAI API integration with streaming
  - [x] Anthropic Claude API integration
  - [x] **Ollama Local Models Integration** ⭐
    - [x] Ollama API client setup (http://localhost:11434)
    - [x] Local model discovery and listing
    - [x] Streaming response handling for local models
    - [x] Connection validation and error handling
  - [x] Generic provider interface for extensibility
  - [x] **API Key Management:**
    - [x] Environment variables for development (.env.local)
    - [x] Ollama server URL configuration (default: localhost:11434)
    - [x] No API key requirement for Ollama (free local usage)
  - [x] Error handling for API failures and connection issues

- [x] **System Prompt Design**
  - [x] **Defender AI (River) System Prompt:**
    - [x] Role: Advocate and defend the user's idea
    - [x] Provide supporting arguments and evidence
    - [x] Address counterarguments constructively
    - [x] Maintain enthusiasm while being logical
  - [x] **Critic AI (Sage) System Prompt:**
    - [x] Role: Find problems and weaknesses in the idea
    - [x] Identify potential issues, risks, and limitations
    - [x] Ask probing questions
    - [x] Be constructive rather than destructive
  - [x] **Conversation Format Guidelines:**
    - [x] Turn-based structured discussion
    - [x] Build upon previous arguments
    - [x] Role-based personalities and approaches

### ✅ Core Conversation Management (DONE)

- [x] **Turn-Based Logic**

  - [x] AI alternation system (Defender → Critic → Defender...)
  - [x] Turn state management
  - [x] Conversation flow control
  - [x] First turn always goes to Defender AI (River)

- [x] **User Controls**

  - [x] Play/Pause button functionality
  - [x] Always-available input field at bottom
  - [x] Pause state preservation and resume logic

- [x] **AI Naming System**

  - [x] Gender-neutral name assignment (River/Sage)
  - [x] Role-based display ("River (Defender)" / "Sage (Critic)")
  - [x] Name display in chat bubbles and typing indicators
  - [x] @mention parsing for whispers (@River, @Sage)

- [x] **Whisper Functionality**
  - [x] @mention detection in user input
  - [x] Private message delivery to specific AI
  - [x] Hide whisper content from other AI
  - [x] Visual indication of whisper events

### ✅ User Experience (DONE)

- [x] **Conversation Starters System** ⭐

  - [x] 6 categorized topic collections (Technology, Philosophy, Society, Creative, Science, Business)
  - [x] 30 curated conversation starters
  - [x] Interactive category tabs with icons
  - [x] Clickable starter cards with animations
  - [x] Random topic suggestions
  - [x] Vertically centered empty state

- [x] **UI/UX Core Features**
  - [x] Dark theme with glass morphism design
  - [x] Role indicators (Defender/Critic badges)
  - [x] Responsive conversation layout
  - [x] Loading states and typing indicators
  - [x] Error handling with user-friendly messages
  - [x] Smooth animations and transitions

### ✅ Multiple Conversation Types (DONE)

- [x] **Mixed Provider Conversations** (phi3:3.8b vs qwen3:8b)
- [x] **Same Model Discussions** (deepseek-r1 vs deepseek-r1)
- [x] **Collaborative Sessions** (phi4 + qwen3 as collaborators)

### ✅ Database Integration & Persistence (DONE) ⭐

- [x] **SQLite Database with Prisma ORM**

  - [x] Complete schema design (Conversation, Message models)
  - [x] Enums for ConversationStatus, ConversationType, MessageSender
  - [x] Proper relationships with cascade delete
  - [x] Migration system setup

- [x] **Database Operations**

  - [x] Full CRUD operations for conversations
  - [x] Message management with whisper support
  - [x] Search functionality across conversations
  - [x] Conversation status management (ACTIVE, PAUSED, COMPLETED)
  - [x] Automatic timestamps and relationships

- [x] **API Endpoints**

  - [x] `GET/POST /api/conversations` - List and create conversations
  - [x] `GET/PATCH/DELETE /api/conversations/[id]` - Individual conversation management
  - [x] `POST /api/conversations/[id]/messages` - Add messages to conversations
  - [x] Next.js 15 compatibility (async params)

- [x] **Django-Style Commands** ⭐

  - [x] `npm run makemigrations` - Create migration files
  - [x] `npm run migrate` - Apply migrations
  - [x] `npm run showmigrations` - Show migration status
  - [x] `npm run dbshell` - Open Prisma Studio (database GUI)
  - [x] `npm run help` - Comprehensive help system
  - [x] Production migration commands (deploy, reset, status)

- [x] **Testing & Documentation**
  - [x] Complete database test suite (7 operations tested)
  - [x] MIGRATION-TO-POSTGRESQL.md guide
  - [x] DJANGO-COMMANDS.md comparison guide
  - [x] All tests passing with emoji-free output

## 🚧 IN PROGRESS / NEXT PRIORITIES

### Priority 1: Connect Database to UI

- [ ] **Integrate Database with Frontend**
  - [ ] Connect conversation list sidebar to database
  - [ ] Load conversations from database on page load
  - [ ] Save new conversations to database
  - [ ] Persist messages during AI conversations
  - [ ] Update conversation status (active/paused/completed)

### Priority 2: Real AI Integration Testing

- [ ] **Test Current Ollama Integration**
  - [ ] Verify streaming responses work correctly
  - [ ] Test conversation flow with multiple models
  - [ ] Debug any API response formatting issues
  - [ ] Test whisper functionality with real AI responses
  - [ ] Validate conversation starters work end-to-end

### Priority 3: Enhanced Model Management

- [ ] **Ollama Model Management UI**
  - [ ] Local model status indicators (downloaded/available/running)
  - [ ] Model download progress bars and size information
  - [ ] Server connection status indicator in sidebar
  - [ ] Quick setup guide for Ollama installation
  - [ ] Model performance recommendations based on system specs
  - [ ] **Endpoints needed:**
    - [ ] `/api/ollama/status` - Check server connection and health
    - [ ] `/api/ollama/models` - List available/installed models
    - [ ] `/api/ollama/pull` - Download/pull new models
    - [ ] `/api/ollama/delete` - Remove installed models

### Priority 4: Production-Ready API Keys

- [ ] **API Key Configuration UI**
  - [ ] Settings panel for API keys (OpenAI, Anthropic)
  - [ ] Key validation and testing
  - [ ] Secure client-side storage (localStorage with encryption)
  - [ ] Provider availability detection and smart defaults
  - [ ] Fallback logic (env vars → user keys → local models)

### Priority 5: Conversation Enhancement

- [ ] **Completion Detection**
  - [ ] AI self-assessment of conversation completion
  - [ ] Manual completion marking by user
  - [ ] Consensus/resolution detection
  - [ ] Final summary generation with:
    - [ ] Strengths identified
    - [ ] Issues raised and addressed
    - [ ] Recommendations for improvement
    - [ ] Areas of agreement/disagreement

### Priority 6: Advanced Configuration

- [ ] **Model Selection UI**

  - [ ] Dropdown selection for each AI slot
  - [ ] Support for mixing different providers (OpenAI + Ollama, etc.)
  - [ ] Random model selection option
  - [ ] Model capability display (context length, speed, quality)
  - [ ] Role assignment (Defender/Critic) with model selection

- [ ] **AI Personality System**
  - [ ] **Defender Personality Options:**
    - [ ] Optimistic Advocate
    - [ ] Logical Supporter
    - [ ] Creative Champion
    - [ ] Practical Defender
  - [ ] **Critic Personality Options:**
    - [ ] Devil's Advocate
    - [ ] Risk Analyst
    - [ ] Skeptical Realist
    - [ ] Constructive Challenger
  - [ ] Free-text personality descriptions
  - [ ] Default personality selection for ease of use

## 🔮 FUTURE ENHANCEMENTS

### Advanced Features

- [ ] **Conversation Management**

  - [ ] Conversation export with summary
  - [ ] Conversation sharing capabilities
  - [ ] Advanced filtering and search

- [ ] **Performance & Reliability**

  - [ ] WebSocket Setup for real-time updates
  - [ ] Connection stability improvements
  - [ ] Rate limiting and quota management
  - [ ] Error recovery mechanisms

- [ ] **Additional Features**
  - [ ] Usage analytics and insights
  - [ ] Multi-participant conversations (3+ AIs)
  - [ ] Neutral/moderator AI as third participant
  - [ ] Voice input/output integration

## 📊 CURRENT STATUS

### ✅ What's Working:

- **Complete UI**: Dark theme, responsive design, conversation starters
- **Local AI**: Ollama integration with multiple models
- **Conversation Flow**: Turn-based AI discussions with user intervention
- **Multiple Types**: Mixed, same-model, and collaborative conversations
- **Whisper System**: Private @mentions to specific AIs
- **Database Persistence**: SQLite with Prisma ORM, full CRUD operations
- **Django-Style Commands**: makemigrations, migrate, showmigrations, dbshell, help
- **Testing Infrastructure**: Complete database test suite

### 🔧 Immediate Next Steps:

1. **Connect database to UI** - Wire up the frontend to use database persistence
2. **Test real AI conversations** - Verify Ollama responses work with database
3. **Add model management** - Show available models, download status
4. **Production API keys** - Enable OpenAI/Anthropic for users without Ollama

### 🎯 Current Architecture:

- **Frontend**: Next.js 15 with React, Tailwind CSS, Framer Motion
- **Database**: SQLite with Prisma ORM (PostgreSQL migration ready)
- **AI Providers**: OpenAI, Anthropic, Ollama with unified interface
- **Local Models**: phi3:3.8b, qwen3:8b, deepseek-r1, phi4
- **State Management**: React hooks with database persistence
- **Commands**: Django-style database management commands

## 🔍 Recent Achievements:

- ✅ **Database Integration**: Complete SQLite setup with Prisma ORM
- ✅ **Django Commands**: Familiar makemigrations/migrate workflow
- ✅ **Testing Suite**: All 7 database operations tested and passing
- ✅ **Next.js 15**: Fixed async params compatibility
- ✅ **Documentation**: Migration guides and command references
- ✅ **No Emojis**: Clean, professional text output throughout
