import { AIMessage, createProvider } from '@/lib/ai-providers';
import { getCriticSystemPrompt, getDefenderSystemPrompt } from '@/lib/system-prompts';
import { NextRequest, NextResponse } from 'next/server';

export interface ChatRequest {
  messages: {
    id: string;
    content: string;
    sender: 'user' | 'defender' | 'critic';
    timestamp: string;
    isWhisper?: boolean;
    targetAI?: string;
  }[];
  currentTurn: 'defender' | 'critic';
  topic: string;
  providers: {
    defender: {
      provider: string;
      model: string;
      apiKey?: string;
    };
    critic: {
      provider: string;
      model: string;
      apiKey?: string;
    };
  };
  personalities?: {
    defender?: string;
    critic?: string;
  };
}

function buildConversationHistory(
  messages: ChatRequest['messages'],
  currentRole: 'defender' | 'critic',
  topic: string,
): AIMessage[] {
  const conversationHistory: AIMessage[] = [];

  // Add system prompt for current AI
  const systemPrompt =
    currentRole === 'defender'
      ? getDefenderSystemPrompt({
          role: 'defender',
          name: 'River',
          personality: undefined, // We'll add personality support later
        })
      : getCriticSystemPrompt({
          role: 'critic',
          name: 'Sage',
          personality: undefined,
        });

  conversationHistory.push({
    role: 'system',
    content: systemPrompt,
  });

  // Add the initial topic as the first user message
  conversationHistory.push({
    role: 'user',
    content: `Topic for debate: ${topic}`,
  });

  // Add conversation history, filtering out whispers not meant for this AI
  for (const message of messages) {
    // Skip whispers not meant for this AI
    if (message.isWhisper && message.targetAI !== (currentRole === 'defender' ? 'River' : 'Sage')) {
      continue;
    }

    if (message.sender === 'user') {
      conversationHistory.push({
        role: 'user',
        content: message.content,
      });
    } else if (message.sender === currentRole) {
      conversationHistory.push({
        role: 'assistant',
        content: message.content,
      });
    } else {
      // Other AI's message
      const otherAIName = message.sender === 'defender' ? 'River (Defender)' : 'Sage (Critic)';
      conversationHistory.push({
        role: 'user',
        content: `${otherAIName}: ${message.content}`,
      });
    }
  }

  return conversationHistory;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, currentTurn, topic, providers } = body;

    // Get API key from environment or request (Ollama doesn't need one)
    const currentProvider = providers[currentTurn];
    let apiKey = '';

    if (currentProvider.provider !== 'ollama') {
      apiKey =
        currentProvider.apiKey ||
        (currentProvider.provider === 'openai'
          ? process.env.OPENAI_API_KEY || ''
          : currentProvider.provider === 'anthropic'
          ? process.env.ANTHROPIC_API_KEY || ''
          : '');

      if (!apiKey) {
        return NextResponse.json({ error: `API key not found for ${currentProvider.provider}` }, { status: 400 });
      }
    }

    // Create provider instance
    const provider = createProvider(currentProvider.provider, apiKey);
    if (!provider) {
      return NextResponse.json({ error: `Unknown provider: ${currentProvider.provider}` }, { status: 400 });
    }

    // Build conversation history for current AI
    const conversationHistory = buildConversationHistory(messages, currentTurn, topic);

    // Check if we want streaming response
    const isStreaming = request.headers.get('accept') === 'text/event-stream';

    if (isStreaming) {
      // Set up streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const responseGenerator = provider.generateStreamingResponse(conversationHistory, currentProvider.model, {
              temperature: 0.7,
              maxTokens: 1000,
            });

            for await (const chunk of responseGenerator) {
              const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }

            // Send completion signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await provider.generateResponse(conversationHistory, currentProvider.model, {
        temperature: 0.7,
        maxTokens: 1000,
      });

      return NextResponse.json({ content: response });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
