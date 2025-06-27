import { ConversationDB, convertUIMessageToDB } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/conversations/[id]/messages - Add a message to a conversation
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, sender, isWhisper, targetAI } = body;

    console.log('🔵 [MESSAGE API] Adding message to conversation:', id);
    console.log('🔵 [MESSAGE API] Sender:', sender);
    console.log('🔵 [MESSAGE API] IsWhisper:', isWhisper);
    console.log('🔵 [MESSAGE API] TargetAI:', targetAI);
    console.log('🔵 [MESSAGE API] Content length:', content?.length || 0);
    console.log('🔵 [MESSAGE API] Content preview:', content?.substring(0, 100) + (content?.length > 100 ? '...' : ''));
    console.log('🔵 [MESSAGE API] Raw content:', JSON.stringify(content));

    if (!content || !sender) {
      console.log('❌ [MESSAGE API] Missing required fields: content and sender');
      return NextResponse.json({ error: 'Missing required fields: content and sender' }, { status: 400 });
    }

    // Convert UI format to database format
    const dbMessage = convertUIMessageToDB({
      content,
      sender,
      isWhisper,
      targetAI,
    });

    console.log('🔵 [MESSAGE API] Converted message for DB:');
    console.log('🔵 [MESSAGE API] DB Sender:', dbMessage.sender);
    console.log('🔵 [MESSAGE API] DB Content length:', dbMessage.content?.length || 0);
    console.log(
      '🔵 [MESSAGE API] DB Content preview:',
      dbMessage.content?.substring(0, 100) + (dbMessage.content?.length > 100 ? '...' : ''),
    );
    console.log('🔵 [MESSAGE API] DB Raw content:', JSON.stringify(dbMessage.content));

    await ConversationDB.addMessage({
      conversationId: id,
      ...dbMessage,
    });

    console.log('🟢 [MESSAGE API] Message saved to database successfully');

    // Return the updated conversation
    const conversation = await ConversationDB.getById(id);
    console.log(
      '🟢 [MESSAGE API] Retrieved updated conversation with',
      conversation?.messages?.length || 0,
      'messages',
    );

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('❌ [MESSAGE API] Error adding message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}
