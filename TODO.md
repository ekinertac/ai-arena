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

- [x] **Frontend Database Integration** ⭐

  - [x] DatabaseAPI client for all CRUD operations
  - [x] Real-time message persistence during AI conversations
  - [x] Conversation list loaded from database
  - [x] Search functionality connected to database
  - [x] Status management (play/pause) persisted
  - [x] Error handling for all database operations

- [x] **SEO-Friendly URLs** ⭐

  - [x] Conversation slugs: `/c/universal-basic-income-debate-cmccmle7j`
  - [x] URL routing with Next.js App Router
  - [x] Shareable links with copy-to-clipboard functionality
  - [x] Automatic URL updates when switching conversations
  - [x] Fallback handling for invalid/missing conversations

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

### 🔥 Priority 1: Critical Bug Fixes (URGENT)

- [ ] **Streaming Response Issues**

  - [ ] Fix "Controller already closed" errors during streaming
  - [ ] Improve stream abort handling when users click stop
  - [ ] Add proper stream timeout and cleanup
  - [ ] Fix AI responses getting cut off mid-stream

- [ ] **AI Response Filtering**

  - [ ] Filter out `<think>` and `</think>` tags from Ollama responses
  - [ ] Add thinking detection to prevent internal AI reasoning from showing
  - [ ] Clean up AI response formatting before display

- [ ] **React Fast Refresh Errors**
  - [ ] Fix runtime errors causing full page reloads
  - [ ] Investigate component state management issues
  - [ ] Ensure proper cleanup in useEffect hooks

### ✅ Priority 2: Real AI Integration Testing (COMPLETE)

- [x] **Test Current Ollama Integration**
  - [x] Verify streaming responses work correctly
  - [x] Test conversation flow with multiple models
  - [x] Debug any API response formatting issues
  - [x] Test whisper functionality with real AI responses
  - [x] Validate conversation starters work end-to-end
  - [x] Fix API validation and error handling

### ✅ Priority 3: Enhanced Model Management (COMPLETE)

- [x] **Ollama Model Management UI**
  - [x] Local model status indicators (downloaded/available/running)
  - [x] Model download progress bars and size information
  - [x] Server connection status indicator in sidebar
  - [x] Quick setup guide for Ollama installation
  - [x] Model performance recommendations based on system specs
  - [x] **Endpoints needed:**
    - [x] `/api/ollama/status` - Check server connection and health
    - [x] `/api/ollama/models` - List available/installed models
    - [x] `/api/ollama/pull` - Download/pull new models
    - [x] `/api/ollama/delete` - Remove installed models

### ✅ Priority 4: Manual AI Control System (COMPLETE)

- [x] **Manual AI Response Triggers**
  - [x] Disabled automatic 2-second AI response delays
  - [x] Added manual "Play" buttons for each AI (River/Sage)
  - [x] Smart conversation flow - when user responds, the OTHER AI is suggested
  - [x] Visual indicators showing which AI should respond to user's message
  - [x] Allow users to choose any AI to respond at any time
  - [x] Better reading pace - users control conversation flow completely

### Priority 5: Production-Ready API Keys (NEXT)

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
- **Real-time Persistence**: All messages and conversations saved automatically
- **SEO-Friendly URLs**: Shareable conversation links with readable slugs
- **Django-Style Commands**: makemigrations, migrate, showmigrations, dbshell, help
- **Testing Infrastructure**: Complete database test suite

### 🔧 Immediate Next Steps:

1. **Fix streaming bugs** - Resolve "Controller already closed" errors and response cutoffs
2. **Filter AI thinking** - Remove `<think>` tags from Ollama model responses
3. **Fix React errors** - Eliminate Fast Refresh runtime errors for smoother development
4. **Production API keys** - Enable OpenAI/Anthropic for users without Ollama
5. **Conversation completion** - Detect when debates reach resolution

### 🎯 Current Architecture:

- **Frontend**: Next.js 15 with React, Tailwind CSS, Framer Motion
- **Database**: SQLite with Prisma ORM (PostgreSQL migration ready)
- **URLs**: SEO-friendly conversation slugs with Next.js App Router
- **AI Providers**: OpenAI, Anthropic, Ollama with unified interface
- **Local Models**: phi3:3.8b, qwen3:8b, deepseek-r1, phi4
- **State Management**: React hooks with database persistence
- **Commands**: Django-style database management commands

## 🔍 Recent Achievements:

- ✅ **Manual AI Control**: Disabled automatic responses, added manual trigger buttons with natural conversation flow
- ✅ **Clean URL Structure**: Fixed URLs from `/?c=id` to `/c/conversation-slug-id` format
- ✅ **Component Architecture**: Refactored 1000+ line main page into 6 clean components
- ✅ **Model Selector**: Always visible in header center, no longer hidden
- ✅ **Simplified Stop System**: Single stop button + natural resume by typing
- ✅ **Stable UI**: Fixed random conversation starters re-rendering issue
- ✅ **Better UX**: Preserved partial AI responses when stopping generation
- ✅ **Database Integration**: Complete SQLite setup with Prisma ORM
- ✅ **Frontend Integration**: Real-time persistence of all conversations and messages
- ✅ **SEO-Friendly URLs**: Conversation slugs like `/c/ai-regulation-debate-cmccmle7j`
- ✅ **Share Functionality**: Copy-to-clipboard for conversation links
- ✅ **URL Routing**: Automatic URL updates when switching conversations
- ✅ **Django Commands**: Familiar makemigrations/migrate workflow
- ✅ **Testing Suite**: All 7 database operations tested and passing
- ✅ **Next.js 15**: Fixed async params compatibility
- ✅ **Documentation**: Migration guides and command references
- ✅ **No Emojis**: Clean, professional text output throughout
