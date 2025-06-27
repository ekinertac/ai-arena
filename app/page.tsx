'use client';

import { ConversationHeader } from '@/components/conversation-header';
import { ConversationSidebar } from '@/components/conversation-sidebar';
import { ConversationStarters } from '@/components/conversation-starters';
import { DebateFlowIndicator } from '@/components/debate-flow-indicator';
import { MessageInput } from '@/components/message-input';
import { MessagesList } from '@/components/messages-list';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useHybridAI } from '@/hooks/use-hybrid-ai';
import { DatabaseAPI, type UIConversation, type UIMessage } from '@/lib/database';
import { getRandomStarters, type ConversationStarter } from '@/lib/starters';
import { createConversationSlug } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';

// Component that handles search params - needs to be wrapped in Suspense
function SearchParamsHandler({
  onConversationChange,
}: {
  onConversationChange: (conversationId: string | null) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const conversationId = searchParams.get('c');
    onConversationChange(conversationId);
  }, [searchParams, onConversationChange]);

  return null;
}

function AIBattleContent({
  currentConversationId,
  setCurrentConversationId,
}: {
  currentConversationId: string | null;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Router for URL management
  const router = useRouter();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [debateFlow, setDebateFlow] = useState<'critic-first' | 'defender-first'>('critic-first');
  const [nextAIRole, setNextAIRole] = useState<'defender' | 'critic' | null>(null);
  const [input, setInput] = useState('');

  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingFrom, setStreamingFrom] = useState<'defender' | 'critic' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Conversation starters state
  const [selectedCategory, setSelectedCategory] = useState('technology');

  // AI Debate hook
  const { generateAIResponse, isGenerating, error: aiError, clearError } = useHybridAI();

  // Get current conversation
  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  // Memoize random starters so they don't change on every render
  const randomStarters = useMemo(() => getRandomStarters(3), []);

  // Load conversations from database on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debateTimeoutRef.current) {
        clearTimeout(debateTimeoutRef.current);
      }
    };
  }, []);

  const loadConversations = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedConversations = await DatabaseAPI.getConversations(search);
      setConversations(fetchedConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async (type: 'mixed' | 'same' | 'collab') => {
    try {
      let defenderModel, defenderProvider, criticModel, criticProvider, conversationType, title;

      switch (type) {
        case 'same':
          defenderModel = 'deepseek-r1:latest';
          defenderProvider = 'ollama';
          criticModel = 'deepseek-r1:latest';
          criticProvider = 'ollama';
          conversationType = 'SAME_MODEL' as const;
          title = 'Same Model Discussion';
          break;
        case 'collab':
          defenderModel = 'phi4:latest';
          defenderProvider = 'ollama';
          criticModel = 'qwen3:8b';
          criticProvider = 'ollama';
          conversationType = 'COLLABORATIVE' as const;
          title = 'Collaborative Session';
          break;
        default: // mixed
          defenderModel = 'phi3:3.8b';
          defenderProvider = 'ollama';
          criticModel = 'qwen3:8b';
          criticProvider = 'ollama';
          conversationType = 'MIXED' as const;
          title = 'New Conversation';
          break;
      }

      const newConversation = await DatabaseAPI.createConversation({
        title,
        topic: '',
        defenderModel,
        defenderProvider,
        criticModel,
        criticProvider,
        conversationType,
      });

      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);

      // Update URL to the new conversation using SEO-friendly slug
      const slug = createConversationSlug(newConversation.title, newConversation.id);
      router.push(`/c/${slug}`, { scroll: false });
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
    }
  };

  const selectConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);

      // Update URL to reflect the selected conversation using SEO-friendly slug
      const slug = createConversationSlug(conversation.title, conversation.id);
      router.push(`/c/${slug}`, { scroll: false });
    }
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await DatabaseAPI.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      // If we deleted the current conversation, clear selection
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        router.push('/', { scroll: false });
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
    }
  };

  const updateConversationTitle = async (conversationId: string, topic: string) => {
    try {
      const updatedConversation = await DatabaseAPI.updateConversation(conversationId, {
        title: topic.substring(0, 100) + (topic.length > 100 ? '...' : ''),
        topic,
      });

      setConversations((prev) =>
        prev.map((conversation) => (conversation.id === conversationId ? updatedConversation : conversation)),
      );
    } catch (err) {
      console.error('Error updating conversation title:', err);
    }
  };

  const addMessageToDatabase = async (conversationId: string, message: Omit<UIMessage, 'id' | 'timestamp'>) => {
    try {
      const addedMessage = await DatabaseAPI.addMessage(conversationId, message);

      // Fetch updated conversation to get all messages
      const updatedConversation = await DatabaseAPI.getConversation(conversationId);
      if (updatedConversation) {
        setConversations((prev) =>
          prev.map((conversation) => (conversation.id === conversationId ? updatedConversation : conversation)),
        );
      }

      return addedMessage;
    } catch (err) {
      console.error('Error adding message to database:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const topic = input.trim();
    setInput('');

    try {
      let conversation = currentConversation;

      // Create new conversation if none exists
      if (!conversation) {
        conversation = await DatabaseAPI.createConversation({
          title: topic.substring(0, 100) + (topic.length > 100 ? '...' : ''),
          topic,
          defenderModel: 'phi3:3.8b',
          defenderProvider: 'ollama',
          criticModel: 'qwen3:8b',
          criticProvider: 'ollama',
          conversationType: 'MIXED',
        });

        setConversations((prev) => [conversation!, ...prev]);
        setCurrentConversationId(conversation.id);

        // Update URL
        const slug = createConversationSlug(conversation.title, conversation.id);
        router.push(`/c/${slug}`, { scroll: false });
      } else {
        // Update conversation title if it's the first message
        if (conversation.messages.length === 0) {
          await updateConversationTitle(conversation.id, topic);
        }
      }

      // Add user message
      await addMessageToDatabase(conversation.id, {
        sender: 'user',
        content: topic,
        isWhisper: false,
        targetAI: undefined,
      });

      // Determine which AI should respond based on natural conversation flow
      let nextRole: 'defender' | 'critic';

      // Get fresh conversation data to determine next responder
      const freshConversation = await DatabaseAPI.getConversation(conversation.id);
      if (!freshConversation) {
        throw new Error('Conversation not found');
      }

      // Filter all messages to find the last AI message
      const allMessages = freshConversation.messages.filter((msg) => msg.sender !== 'user');

      if (allMessages.length === 0) {
        // No AI messages yet, start with the configured debate flow
        nextRole = debateFlow === 'critic-first' ? 'critic' : 'defender';
        console.log('🟢 [SUBMIT] First AI response, using debate flow:', nextRole);
      } else {
        // User is responding to the last AI message, so the OTHER AI should respond
        const lastAIMessage = allMessages[allMessages.length - 1];
        nextRole = lastAIMessage.sender === 'defender' ? 'critic' : 'defender';
        console.log('🟢 [SUBMIT] User responded to:', lastAIMessage.sender, '→ Next AI:', nextRole);
      }

      // Set the next AI role but don't auto-generate - let user control the flow
      setNextAIRole(nextRole);
      console.log('🎯 [SUBMIT] Ready for manual trigger:', nextRole);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('Failed to start conversation');
    }
  };

  const generateAIDebateResponse = async (aiRole: 'defender' | 'critic') => {
    if (!currentConversation || isGenerating) return;

    try {
      clearError();
      setStreamingFrom(aiRole);
      setStreamingMessage('');

      const currentMessages = currentConversation.messages || [];

      // Get fresh conversation data to ensure we have the latest topic
      const freshConversation = await DatabaseAPI.getConversation(currentConversation.id);
      if (!freshConversation) {
        throw new Error('Conversation not found');
      }

      // Use the actual conversation topic, or if empty, use the first user message as the topic
      const actualTopic =
        freshConversation.topic ||
        (freshConversation.messages.length > 0 && freshConversation.messages[0].sender === 'user'
          ? freshConversation.messages[0].content
          : 'General Discussion');

      // Build the debate config for the API
      const debateConfig = {
        defender: {
          provider: freshConversation.defenderProvider,
          model: freshConversation.defenderModel,
        },
        critic: {
          provider: freshConversation.criticProvider,
          model: freshConversation.criticModel,
        },
      };

      // Use the AI debate hook to generate response with streaming
      const response = await generateAIResponse(currentMessages, aiRole, actualTopic, debateConfig, (chunk: string) => {
        setStreamingMessage((prev) => prev + chunk);
      });

      // Add the complete message to database
      if (response.trim()) {
        await addMessageToDatabase(currentConversation.id, {
          sender: aiRole,
          content: response.trim(),
          isWhisper: false,
          targetAI: undefined,
        });
      }

      // Clear streaming state
      setStreamingFrom(null);
      setStreamingMessage('');

      // Set next AI role for manual trigger
      const nextRole = aiRole === 'defender' ? 'critic' : 'defender';
      setNextAIRole(nextRole);
    } catch (err) {
      console.error('Error generating AI response:', err);
      setError(`Failed to generate ${aiRole} response`);
      setStreamingFrom(null);
      setStreamingMessage('');
    }
  };

  const handleStarterClick = async (starter: ConversationStarter) => {
    if (isGenerating) return;
    setInput(starter.text);
  };

  const handleModelChange = async (role: 'defender' | 'critic', provider: string, model: string) => {
    if (!currentConversation) return;

    try {
      const updateData =
        role === 'defender'
          ? { defenderProvider: provider, defenderModel: model }
          : { criticProvider: provider, criticModel: model };

      const updatedConversation = await DatabaseAPI.updateConversation(currentConversation.id, updateData);

      setConversations((prev) =>
        prev.map((conversation) => (conversation.id === currentConversation.id ? updatedConversation : conversation)),
      );
    } catch (err) {
      console.error('Error updating model configuration:', err);
      setError('Failed to update model configuration');
    }
  };

  const copyShareableUrl = async (conversation: UIConversation) => {
    try {
      const slug = createConversationSlug(conversation.title, conversation.id);
      const url = `${window.location.origin}/c/${slug}`;
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDebateFlowChange = () => {
    setDebateFlow(debateFlow === 'critic-first' ? 'defender-first' : 'critic-first');
  };

  const handleStop = async () => {
    if (!currentConversation || !isGenerating) return;

    try {
      // Stop current generation and preserve the streaming message
      // Note: useHybridAI handles cleanup internally

      // Save the current streaming message to database if it exists
      if (streamingMessage.trim() && streamingFrom) {
        await addMessageToDatabase(currentConversation.id, {
          sender: streamingFrom,
          content: streamingMessage.trim(),
          isWhisper: false,
          targetAI: undefined,
        });
      }

      // Clear streaming state
      setStreamingFrom(null);
      setStreamingMessage('');

      // Clear timeout for next AI response
      if (debateTimeoutRef.current) {
        clearTimeout(debateTimeoutRef.current);
        debateTimeoutRef.current = null;
      }

      console.log('🛑 [STOP] AI generation stopped by user');
    } catch (err) {
      console.error('Error stopping generation:', err);
      setError('Failed to stop generation');
    }
  };

  const handleTriggerAI = async (role: 'defender' | 'critic') => {
    if (!currentConversation || isGenerating) return;

    console.log(`🎯 [MANUAL] User triggered ${role} response`);
    setNextAIRole(null); // Clear the next role since we're about to generate
    await generateAIDebateResponse(role);
  };

  return (
    <SidebarProvider>
      <div className='flex h-screen w-full bg-black'>
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNewConversation={createNewConversation}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
        />

        <SidebarInset className='flex-1 flex flex-col h-screen'>
          <div className='flex-1 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative flex flex-col'>
            <div className='flex-1 bg-black/60 flex flex-col min-h-screen relative'>
              <ConversationHeader
                currentConversation={currentConversation}
                isGenerating={isGenerating}
                onModelChange={handleModelChange}
                onShare={() => currentConversation && copyShareableUrl(currentConversation)}
              />

              <div className='flex-1 flex flex-col min-h-0 pb-32'>
                {!currentConversation || currentConversation.messages.length === 0 ? (
                  <ConversationStarters
                    selectedCategory={selectedCategory}
                    onCategorySelect={setSelectedCategory}
                    onStarterClick={handleStarterClick}
                  />
                ) : (
                  <MessagesList
                    messages={currentConversation.messages}
                    streamingFrom={streamingFrom}
                    streamingMessage={streamingMessage}
                    isGenerating={isGenerating}
                  />
                )}

                <div ref={messagesEndRef} />
              </div>

              {currentConversation && (
                <DebateFlowIndicator
                  debateFlow={debateFlow}
                  streamingFrom={streamingFrom}
                  isGenerating={isGenerating}
                  nextAIRole={nextAIRole}
                  onFlowChange={handleDebateFlowChange}
                  onStop={handleStop}
                  onTriggerAI={handleTriggerAI}
                />
              )}

              <MessageInput
                input={input}
                isGenerating={isGenerating}
                currentConversation={currentConversation}
                debateFlow={debateFlow}
                onInputChange={setInput}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default function AIBattle() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const handleConversationChange = (conversationId: string | null) => {
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsHandler onConversationChange={handleConversationChange} />
      <AIBattleContent
        currentConversationId={currentConversationId}
        setCurrentConversationId={setCurrentConversationId}
      />
    </Suspense>
  );
}
