'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { motion } from 'framer-motion';
import { MessageSquare, Pause, Play, Plus, Search, Send, Shield, Swords, Trash2, User, Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { useAIDebate } from '@/hooks/use-ai-debate';
import { conversationStarters, getRandomStarters, type ConversationStarter } from '@/lib/starters';

interface ConversationSession {
  id: string;
  title: string;
  topic: string;
  status: 'active' | 'paused' | 'completed';
  messages: Message[];
  createdAt: Date;
  participantA: AIParticipant;
  participantB: AIParticipant;
}

interface AIParticipant {
  name: string;
  model: string;
  provider: string;
  role: 'defender' | 'critic' | 'supporter' | 'challenger' | 'collaborator';
  personality?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'defender' | 'critic';
  timestamp: Date;
  isWhisper?: boolean;
  targetAI?: string;
}

export default function AIBattle() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Always dark mode - no light mode needed
  const [searchQuery, setSearchQuery] = useState('');
  const [isDebateActive, setIsDebateActive] = useState(false);
  const [, setCurrentTurn] = useState<'defender' | 'critic'>('defender');
  const [input, setInput] = useState('');

  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingFrom, setStreamingFrom] = useState<'defender' | 'critic' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conversation starters state
  const [selectedCategory, setSelectedCategory] = useState('technology');

  // AI Debate hook
  const { generateAIResponse, isGenerating, error, clearError } = useAIDebate();

  // Get current session
  const currentSession = sessions.find((s) => s.id === currentSessionId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const createNewConversation = (type: 'mixed' | 'same' | 'collab') => {
    let participantA, participantB, title;

    switch (type) {
      case 'same':
        participantA = { name: 'River', model: 'deepseek-r1:latest', provider: 'ollama', role: 'supporter' as const };
        participantB = { name: 'Sage', model: 'deepseek-r1:latest', provider: 'ollama', role: 'challenger' as const };
        title = 'Same Model Discussion';
        break;
      case 'collab':
        participantA = { name: 'River', model: 'phi4:latest', provider: 'ollama', role: 'collaborator' as const };
        participantB = { name: 'Sage', model: 'qwen3:8b', provider: 'ollama', role: 'collaborator' as const };
        title = 'Collaborative Session';
        break;
      default: // mixed
        participantA = { name: 'River', model: 'phi3:3.8b', provider: 'ollama', role: 'defender' as const };
        participantB = { name: 'Sage', model: 'qwen3:8b', provider: 'ollama', role: 'critic' as const };
        title = 'New Conversation';
        break;
    }

    const newSession: ConversationSession = {
      id: Date.now().toString(),
      title,
      topic: '',
      status: 'active',
      messages: [],
      createdAt: new Date(),
      participantA,
      participantB,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsDebateActive(false);
    setCurrentTurn('defender');
  };

  const selectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setIsDebateActive(session.status === 'active');
    }
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter((s) => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        selectSession(remainingSessions[0].id);
      } else {
        setCurrentSessionId(null);
      }
    }
  };

  const updateSessionTitle = (sessionId: string, topic: string) => {
    const title = topic.slice(0, 40) + (topic.length > 40 ? '...' : '');
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId && session.title === 'New Conversation' ? { ...session, title, topic } : session,
      ),
    );
  };

  const toggleDebate = () => {
    if (currentSession) {
      const newStatus = isDebateActive ? 'paused' : 'active';
      setIsDebateActive(!isDebateActive);
      setSessions((prev) =>
        prev.map((session) => (session.id === currentSessionId ? { ...session, status: newStatus } : session)),
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentSessionId) return;

    // Create new conversation if this is the first message
    if (!currentSession && input.trim()) {
      createNewConversation('mixed');
    }

    // Update session title if this is the first message
    if (currentSession?.title === 'New Conversation') {
      updateSessionTitle(currentSessionId!, input);
    }

    // Check if it's a whisper (@mention)
    const whisperMatch = input.match(/^@(River|Sage)\s+(.+)/);
    const isWhisper = !!whisperMatch;
    const targetAI = whisperMatch?.[1];
    const content = isWhisper ? whisperMatch![2] : input;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      isWhisper,
      targetAI,
    };

    // Add message to current session
    if (currentSession) {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId ? { ...session, messages: [...session.messages, newMessage] } : session,
        ),
      );
    }

    setInput('');

    // Start debate if not already active
    if (!isDebateActive) {
      setIsDebateActive(true);
      // Trigger AI response if this is the topic introduction
      if (currentSession?.messages.length === 0) {
        // Defender always goes first
        setTimeout(() => generateAIDebateResponse('defender'), 1000);
      }
    }
  };

  // Generate AI response for debate
  const generateAIDebateResponse = async (aiRole: 'defender' | 'critic') => {
    if (!currentSession || isGenerating) return;

    try {
      setStreamingFrom(aiRole);
      setStreamingMessage('');

      // Build the debate config for the API
      const debateConfig = {
        defender: {
          provider: currentSession.participantA.provider,
          model: currentSession.participantA.model,
        },
        critic: {
          provider: currentSession.participantB.provider,
          model: currentSession.participantB.model,
        },
      };

      // Use the AI debate hook to generate response with streaming
      const response = await generateAIResponse(
        currentSession.messages,
        aiRole,
        currentSession.topic || 'General Discussion',
        debateConfig,
        (chunk: string) => {
          setStreamingMessage((prev) => prev + chunk);
        },
      );

      // Add final message
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: response,
        sender: aiRole,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId ? { ...session, messages: [...session.messages, aiMessage] } : session,
        ),
      );

      // Switch turns and continue debate
      const nextTurn = aiRole === 'defender' ? 'critic' : 'defender';
      setCurrentTurn(nextTurn);

      // Continue debate automatically after a pause (limit to 3 rounds for demo)
      if (isDebateActive && currentSession.messages.length < 6) {
        setTimeout(() => generateAIDebateResponse(nextTurn), 2000);
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setStreamingFrom(null);
      setStreamingMessage('');
    }
  };

  // Group sessions by time
  const groupSessionsByTime = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const filtered = sessions.filter((session) => session.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return {
      today: filtered.filter((s) => s.createdAt >= today),
      yesterday: filtered.filter((s) => s.createdAt >= yesterday && s.createdAt < today),
      lastWeek: filtered.filter((s) => s.createdAt >= lastWeek && s.createdAt < yesterday),
      older: filtered.filter((s) => s.createdAt < lastWeek),
    };
  };

  // Initialize with first conversation if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createNewConversation('mixed');
    }
  }, [sessions.length]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Zap size={12} className='text-green-500' />;
      case 'paused':
        return <Pause size={12} className='text-yellow-500' />;
      case 'completed':
        return <Shield size={12} className='text-blue-500' />;
      default:
        return null;
    }
  };

  const getMessageBubbleColor = (sender: string) => {
    switch (sender) {
      case 'defender':
        return 'bg-blue-600/20 border-blue-500/30';
      case 'critic':
        return 'bg-red-600/20 border-red-500/30';
      case 'user':
        return 'bg-purple-600/20 border-purple-500/30';
      default:
        return 'bg-gray-600/20 border-gray-500/30';
    }
  };

  const groupedSessions = groupSessionsByTime();

  const handleStarterClick = (starter: ConversationStarter) => {
    if (!currentSessionId) {
      createNewConversation('mixed');
    }
    setInput(starter.text);
  };

  return (
    <SidebarProvider>
      <div className='flex h-screen w-full bg-black'>
        {/* Sidebar */}
        <Sidebar className='border-r border-white/10 bg-black/95 backdrop-blur-md [&>*]:bg-transparent'>
          <SidebarHeader className='border-b border-white/10 p-4 bg-transparent'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center'>
                <Swords size={16} className='text-white' />
              </div>
              <h2 className='font-bold text-white'>AI Arena</h2>
            </div>
            <div className='space-y-2 mb-3'>
              <Button
                onClick={() => createNewConversation('mixed')}
                className='w-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white border-0'
              >
                <Plus size={16} className='mr-2' />
                New Conversation
              </Button>

              <div className='grid grid-cols-2 gap-2'>
                <Button
                  onClick={() => createNewConversation('same')}
                  variant='outline'
                  className='text-xs border-white/20 text-white/80 hover:text-white hover:bg-white/10 bg-transparent'
                >
                  Same Model
                </Button>
                <Button
                  onClick={() => createNewConversation('collab')}
                  variant='outline'
                  className='text-xs border-white/20 text-white/80 hover:text-white hover:bg-white/10 bg-transparent'
                >
                  Collaborate
                </Button>
              </div>
            </div>
            <div className='relative'>
              <Search size={16} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50' />
              <Input
                placeholder='Search conversations...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-500'
              />
            </div>
          </SidebarHeader>

          <SidebarContent className='bg-transparent [&>*]:bg-transparent'>
            {Object.entries(groupedSessions).map(([period, periodSessions]) => {
              if (periodSessions.length === 0) return null;

              const periodLabels = {
                today: 'Today',
                yesterday: 'Yesterday',
                lastWeek: 'Last 7 Days',
                older: 'Older',
              };

              return (
                <SidebarGroup key={period}>
                  <SidebarGroupLabel className='text-white/70 px-2'>
                    {periodLabels[period as keyof typeof periodLabels]}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {periodSessions.map((session) => (
                        <SidebarMenuItem key={session.id}>
                          <div className='group relative flex items-center w-full'>
                            <SidebarMenuButton
                              onClick={() => selectSession(session.id)}
                              isActive={currentSessionId === session.id}
                              className='flex-1 text-white/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-blue-600/20 data-[active=true]:text-white pr-8'
                            >
                              <div className='flex items-center gap-2'>
                                <MessageSquare size={16} />
                                {getStatusIcon(session.status)}
                              </div>
                              <span className='truncate'>{session.title}</span>
                            </SidebarMenuButton>
                            <button
                              onClick={(e) => deleteSession(session.id, e)}
                              className='absolute right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded z-10'
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>

          <SidebarFooter className='border-t border-white/10 p-4 bg-transparent'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center'>
                <User size={16} className='text-white' />
              </div>
              <div className='flex-1'>
                <p className='text-white text-sm font-medium'>Moderator</p>
                <p className='text-white/60 text-xs'>Conversation Guide</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Chat Area */}
        <SidebarInset className='flex-1 flex flex-col h-screen'>
          <div className={`flex-1 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative flex flex-col`}>
            <div className='flex-1 bg-black/80 backdrop-blur-md flex flex-col'>
              {/* Header */}
              <div className='border-b border-white/10 p-4 flex items-center justify-between flex-shrink-0'>
                <div className='flex items-center gap-3'>
                  <SidebarTrigger className='text-white hover:bg-white/10' />
                  {currentSession && (
                    <div className='flex items-center gap-4'>
                      <div className='flex items-center gap-2'>
                        <Shield size={20} className='text-blue-400' />
                        <span className='text-sm text-blue-600'>
                          {currentSession.participantA.name} ({currentSession.participantA.role})
                        </span>
                      </div>
                      <div className='text-white/40'>vs</div>
                      <div className='flex items-center gap-2'>
                        <Swords size={20} className='text-red-400' />
                        <span className='text-sm text-red-600'>
                          {currentSession.participantB.name} ({currentSession.participantB.role})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div className='flex-1 flex flex-col min-h-0'>
                {!currentSession || currentSession.messages.length === 0 ? (
                  <div className='flex-1 overflow-y-auto p-4 flex items-center justify-center'>
                    <div className='max-w-4xl mx-auto w-full'>
                      <motion.div
                        className='flex flex-col items-center text-center mb-8'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className='w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center mb-6'>
                          <Swords size={24} className='text-white' />
                        </div>
                        <h2 className='text-2xl font-bold text-white mb-2'>Start a New Conversation</h2>
                        <p className='text-white/60 mb-8 max-w-md'>
                          Present your topic and watch two AI models discuss it. Using local Ollama models for free,
                          private conversations. Choose different roles like Supporter vs Critic, Collaborators, or even
                          the same model with different perspectives.
                        </p>
                      </motion.div>

                      {/* Conversation Starters */}
                      <div className='space-y-6'>
                        <h3 className='text-lg font-semibold text-white text-center'>Pick a conversation starter</h3>

                        {/* Category Tabs */}
                        <div className='flex flex-wrap justify-center gap-2 mb-6'>
                          {conversationStarters.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => setSelectedCategory(category.id)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                selectedCategory === category.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                              }`}
                            >
                              {category.icon} {category.label}
                            </button>
                          ))}
                        </div>

                        {/* Starters Grid */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          {conversationStarters
                            .find((cat) => cat.id === selectedCategory)
                            ?.starters.map((starter, index) => (
                              <motion.button
                                key={starter.id}
                                onClick={() => handleStarterClick(starter)}
                                className='p-4 rounded-lg bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-white/20 transition-all duration-200 group'
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <p className='text-white/90 text-sm leading-relaxed group-hover:text-white transition-colors'>
                                  {starter.text}
                                </p>
                              </motion.button>
                            ))}
                        </div>

                        {/* Random Suggestions */}
                        <div className='border-t border-white/10 pt-6 mt-8'>
                          <h4 className='text-md font-medium text-white/70 text-center mb-4'>
                            Or try these random topics
                          </h4>
                          <div className='grid grid-cols-1 gap-2'>
                            {getRandomStarters(3).map((starter) => (
                              <button
                                key={starter.id}
                                onClick={() => handleStarterClick(starter)}
                                className='p-3 rounded-lg bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm'
                              >
                                <span className='text-white/80'>{starter.text}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='flex-1 overflow-y-auto p-4'>
                    <div className='max-w-4xl mx-auto space-y-4'>
                      {currentSession.messages.map((message) => (
                        <motion.div
                          key={message.id}
                          className={`border rounded-lg p-4 max-w-[80%] ${
                            message.sender === 'user' ? 'ml-auto' : 'mr-auto'
                          } ${getMessageBubbleColor(message.sender)}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='text-sm font-medium text-white'>
                              {message.sender === 'defender' && 'River (Defender)'}
                              {message.sender === 'critic' && 'Sage (Critic)'}
                              {message.sender === 'user' && 'Moderator'}
                            </span>
                            {message.isWhisper && (
                              <span className='text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded'>
                                Whisper to {message.targetAI}
                              </span>
                            )}
                          </div>
                          <p className='text-white/90 text-sm leading-relaxed'>{message.content}</p>
                        </motion.div>
                      ))}

                      {/* Streaming message */}
                      {streamingFrom && streamingMessage && (
                        <motion.div
                          className={`border rounded-lg p-4 max-w-[80%] mr-auto ${getMessageBubbleColor(
                            streamingFrom,
                          )}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='text-sm font-medium text-white'>
                              {streamingFrom === 'defender' && 'River (Defender)'}
                              {streamingFrom === 'critic' && 'Sage (Critic)'}
                            </span>
                            <div className='flex space-x-1'>
                              <div className='w-1 h-1 bg-white/60 rounded-full animate-pulse'></div>
                              <div
                                className='w-1 h-1 bg-white/60 rounded-full animate-pulse'
                                style={{ animationDelay: '0.2s' }}
                              ></div>
                              <div
                                className='w-1 h-1 bg-white/60 rounded-full animate-pulse'
                                style={{ animationDelay: '0.4s' }}
                              ></div>
                            </div>
                          </div>
                          <p className='text-white/90 text-sm leading-relaxed'>
                            {streamingMessage}
                            <span className='animate-pulse'>|</span>
                          </p>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className='border-t border-white/10 p-4 flex-shrink-0'>
                <div className='max-w-4xl mx-auto'>
                  {/* Error Display */}
                  {error && (
                    <div className='mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg'>
                      <p className='text-red-300 text-sm'>{error}</p>
                      <Button
                        onClick={() => clearError()}
                        variant='ghost'
                        size='sm'
                        className='mt-2 text-red-300 hover:text-red-200'
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {/* Debate Controls */}
                  {currentSession && currentSession.messages.length > 0 && (
                    <div className='flex items-center justify-center mb-4 gap-4'>
                      <Button
                        onClick={toggleDebate}
                        variant='outline'
                        className='border-white/20 text-white hover:bg-white/10 bg-transparent hover:border-white/40'
                        disabled={isGenerating}
                      >
                        {isDebateActive ? (
                          <>
                            <Pause size={16} className='mr-2' />
                            Pause Conversation
                          </>
                        ) : (
                          <>
                            <Play size={16} className='mr-2' />
                            Resume Conversation
                          </>
                        )}
                      </Button>

                      {isGenerating && (
                        <div className='flex items-center gap-2 text-white/60 text-sm'>
                          <div className='w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin'></div>
                          {streamingFrom && `${streamingFrom === 'defender' ? 'River' : 'Sage'} is typing...`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input Form */}
                  <form onSubmit={handleSubmit} className='relative'>
                    <div className='relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4'>
                      <textarea
                        className='w-full bg-transparent text-white placeholder-white/50 resize-none focus:outline-none min-h-[60px]'
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                          !currentSession || currentSession.messages.length === 0
                            ? 'Present your topic or idea to discuss...'
                            : 'Add context, ask questions, or whisper to an AI (@River or @Sage)...'
                        }
                        rows={1}
                        style={{
                          height: Math.min(120, Math.max(60, input.split('\n').length * 24)) + 'px',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (input.trim()) {
                              handleSubmit(e as React.FormEvent);
                            }
                          }
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between mt-3'>
                      <div className='text-xs text-white/40'>
                        Tip: Use @River or @Sage to whisper privately to an AI
                      </div>
                      <Button
                        type='submit'
                        className='bg-gradient-to-r from-blue-600 to-red-600 rounded-full text-white disabled:opacity-50'
                        disabled={!input.trim()}
                      >
                        <Send size={18} />
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
