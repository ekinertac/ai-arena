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

export function useAIDebate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ollamaProvider, setOllamaProvider] = useState<ClientOllamaProvider | null>(null);
  const [isOllamaConnected, setIsOllamaConnected] = useState(false);

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

        // Determine if we want streaming
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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  // Initialize Ollama connection
  const initializeOllama = useCallback(async () => {
    const provider = new ClientOllamaProvider();
    const connected = await provider.checkConnection();

    setOllamaProvider(provider);
    setIsOllamaConnected(connected);

    return { provider, connected };
  }, []);

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
