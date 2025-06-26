import type { ChatRequest } from '@/app/api/chat/route';
import { ClientOllamaProvider } from '@/lib/ai-providers';
import { useCallback, useState } from 'react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'defender' | 'critic';
  timestamp: Date;
  isWhisper?: boolean;
  targetAI?: string;
}

interface AIConfig {
  provider: string;
  model: string;
  apiKey?: string;
}

interface DebateConfig {
  defender: AIConfig;
  critic: AIConfig;
}

export function useHybridAI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ollamaProvider, setOllamaProvider] = useState<ClientOllamaProvider | null>(null);
  const [isOllamaConnected, setIsOllamaConnected] = useState(false);

  // Initialize Ollama connection
  const initializeOllama = useCallback(async () => {
    const provider = new ClientOllamaProvider();
    const connected = await provider.checkConnection();

    setOllamaProvider(provider);
    setIsOllamaConnected(connected);

    return { provider, connected };
  }, []);

  // Main function that routes to client or server based on provider
  const generateAIResponse = useCallback(
    async (
      messages: Message[],
      currentTurn: 'defender' | 'critic',
      topic: string,
      config: DebateConfig,
      onStreamChunk?: (chunk: string) => void,
    ): Promise<string> => {
      setIsGenerating(true);
      setError(null);

      try {
        const providerConfig = config[currentTurn];

        // Route to client-side Ollama or server-side API
        if (providerConfig.provider === 'ollama') {
          return await handleOllamaRequest(messages, currentTurn, topic, providerConfig, onStreamChunk);
        } else {
          return await handleServerRequest(messages, currentTurn, topic, config, onStreamChunk);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [ollamaProvider, isOllamaConnected],
  );

  // Handle client-side Ollama requests
  const handleOllamaRequest = async (
    messages: Message[],
    currentTurn: 'defender' | 'critic',
    topic: string,
    providerConfig: AIConfig,
    onStreamChunk?: (chunk: string) => void,
  ): Promise<string> => {
    if (!ollamaProvider || !isOllamaConnected) {
      throw new Error('Ollama not connected. Please ensure Ollama is running locally.');
    }

    // Convert messages to Ollama format
    const ollamaMessages = messages
      .filter((msg) => !msg.isWhisper || msg.targetAI === (currentTurn === 'defender' ? 'River' : 'Sage'))
      .map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

    // Add system prompt for the current AI role
    const systemPrompt =
      currentTurn === 'defender'
        ? `You are River, the Defender. Your role is to support and advocate for the topic: "${topic}". Provide thoughtful, enthusiastic arguments in favor of the position. Keep responses to 2-4 paragraphs and maintain an engaging, optimistic tone.`
        : `You are Sage, the Critic. Your role is to challenge and question the topic: "${topic}". Identify potential weaknesses, risks, and counterarguments. Keep responses to 2-4 paragraphs and ask probing questions while remaining constructive.`;

    const fullMessages = [{ role: 'system', content: systemPrompt }, ...ollamaMessages];

    if (onStreamChunk) {
      // Streaming response
      let fullResponse = '';
      try {
        for await (const chunk of ollamaProvider.generateStreamingResponse(fullMessages, providerConfig.model)) {
          fullResponse += chunk;
          onStreamChunk(chunk);
        }
      } catch (error) {
        console.warn('Streaming failed, falling back to non-streaming:', error);
        fullResponse = await ollamaProvider.generateResponse(fullMessages, providerConfig.model);
      }
      return fullResponse;
    } else {
      // Non-streaming response
      return await ollamaProvider.generateResponse(fullMessages, providerConfig.model);
    }
  };

  // Handle server-side API requests (OpenAI, Anthropic)
  const handleServerRequest = async (
    messages: Message[],
    currentTurn: 'defender' | 'critic',
    topic: string,
    config: DebateConfig,
    onStreamChunk?: (chunk: string) => void,
  ): Promise<string> => {
    const requestBody: ChatRequest = {
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp.toISOString(),
        isWhisper: msg.isWhisper,
        targetAI: msg.targetAI,
      })),
      currentTurn,
      topic,
      providers: config,
    };

    const useStreaming = !!onStreamChunk;

    if (useStreaming) {
      // Streaming response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line === 'data: [DONE]') return fullResponse;
            if (!line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.content) {
                fullResponse += data.content;
                onStreamChunk(data.content);
              }
            } catch (e) {
              // Skip malformed JSON
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullResponse;
    } else {
      // Non-streaming response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate response');
      }

      const data = await response.json();
      return data.content;
    }
  };

  return {
    generateAIResponse,
    isGenerating,
    error,
    clearError: () => setError(null),
    initializeOllama,
    isOllamaConnected,
    ollamaProvider,
  };
}
