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

  // Limit to last 6 messages to prevent repetition and reduce context size
  const recentMessages = messages.slice(-6);

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

  // Add turn context to help prevent repetition
  const turnCount = Math.floor(messages.length / 2) + 1;
  const contextualPrompt = `${systemPrompt}

## Current Context:
- This is turn ${turnCount} of the debate
- You are responding as ${currentRole === 'defender' ? 'River (The Defender)' : 'Sage (The Critic)'}
- Focus on NEW points - avoid repeating previous arguments
- Build upon the conversation so far with fresh perspectives

${
  recentMessages.length > 0 ? `Recent conversation has covered: ${recentMessages.map((m) => m.sender).join(' → ')}` : ''
}`;

  conversationHistory.push({
    role: 'system',
    content: contextualPrompt,
  });

  // Add the initial topic as the first user message
  conversationHistory.push({
    role: 'user',
    content: `Topic for debate: ${topic}`,
  });

  // Add conversation history, filtering out whispers not meant for this AI
  for (const message of recentMessages) {
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

    console.log('🔵 [CHAT API] Starting chat request for turn:', currentTurn);
    console.log('🔵 [CHAT API] Topic:', topic);
    console.log('🔵 [CHAT API] Messages count:', messages.length);

    // Validate required fields
    if (!currentTurn || !providers || !providers.defender || !providers.critic) {
      console.log('❌ [CHAT API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: currentTurn, providers.defender, or providers.critic' },
        { status: 400 },
      );
    }

    // Validate currentTurn is valid
    if (currentTurn !== 'defender' && currentTurn !== 'critic') {
      console.log('❌ [CHAT API] Invalid currentTurn:', currentTurn);
      return NextResponse.json({ error: 'Invalid currentTurn. Must be "defender" or "critic"' }, { status: 400 });
    }

    // Get API key from environment or request (Ollama doesn't need one)
    const currentProvider = providers[currentTurn];
    if (!currentProvider) {
      console.log('❌ [CHAT API] Provider configuration not found for:', currentTurn);
      return NextResponse.json({ error: `Provider configuration not found for ${currentTurn}` }, { status: 400 });
    }

    console.log('🔵 [CHAT API] Using provider:', currentProvider.provider, 'model:', currentProvider.model);

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
        console.log('❌ [CHAT API] API key not found for provider:', currentProvider.provider);
        return NextResponse.json({ error: `API key not found for ${currentProvider.provider}` }, { status: 400 });
      }
    }

    // Create provider instance
    const provider = createProvider(currentProvider.provider, apiKey);
    if (!provider) {
      console.log('❌ [CHAT API] Unknown provider:', currentProvider.provider);
      return NextResponse.json({ error: `Unknown provider: ${currentProvider.provider}` }, { status: 400 });
    }

    // Build conversation history for current AI
    const conversationHistory = buildConversationHistory(messages, currentTurn, topic);
    console.log('🔵 [CHAT API] Built conversation history with', conversationHistory.length, 'messages');

    // Check if we want streaming response
    const isStreaming = request.headers.get('accept') === 'text/event-stream';
    console.log('🔵 [CHAT API] Streaming mode:', isStreaming);

    if (isStreaming) {
      // Set up streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            console.log('🟡 [CHAT API] Starting AI stream generation...');
            const responseGenerator = provider.generateStreamingResponse(conversationHistory, currentProvider.model, {
              temperature: 0.9,
            });

            let chunkCount = 0;
            let totalContent = '';
            for await (const chunk of responseGenerator) {
              chunkCount++;
              totalContent += chunk;
              console.log(`🟢 [CHAT API] Chunk ${chunkCount}: "${chunk}" (length: ${chunk.length})`);

              // Check if the client is still connected
              if (controller.desiredSize === null) {
                console.log('🟡 [CHAT API] Client disconnected, closing stream.');
                return;
              }

              try {
                const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
                controller.enqueue(encoder.encode(data));
              } catch (e) {
                console.log('🟡 [CHAT API] Controller already closed, could not enqueue chunk.');
                // The controller is already closed, so we can't send more data.
                // We can just break the loop.
                break;
              }
            }

            console.log('🟢 [CHAT API] Stream completed. Total chunks:', chunkCount);
            console.log('🟢 [CHAT API] Full response:', totalContent);
            console.log('🟢 [CHAT API] Full response length:', totalContent.length);

            // Send completion signal and close controller
            try {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              console.log('🟢 [CHAT API] Sent [DONE] signal');
              controller.close();
              console.log('🟢 [CHAT API] Controller closed successfully');
            } catch (e) {
              console.log('🟡 [CHAT API] Controller already closed, could not send [DONE].');
            }
          } catch (error) {
            console.log('❌ [CHAT API] Stream error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            try {
              const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              controller.close();
              console.log('🟢 [CHAT API] Error sent and controller closed');
            } catch (e) {
              console.log('🟡 [CHAT API] Controller already closed, could not send error.');
            }
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
      console.log('🟡 [CHAT API] Starting AI non-streaming generation...');
      const response = await provider.generateResponse(conversationHistory, currentProvider.model, {
        temperature: 0.9,
      });

      console.log('🟢 [CHAT API] Non-streaming response:', response);
      console.log('🟢 [CHAT API] Response length:', response.length);

      return NextResponse.json({ content: response });
    }
  } catch (error) {
    console.error('❌ [CHAT API] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
