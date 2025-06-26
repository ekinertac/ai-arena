import { ConversationDB, convertUIMessageToDB } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/conversations/[id]/messages - Add a message to a conversation
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, sender, isWhisper, targetAI } = body;

    if (!content || !sender) {
      return NextResponse.json({ error: 'Missing required fields: content and sender' }, { status: 400 });
    }

    // Convert UI format to database format
    const dbMessage = convertUIMessageToDB({
      content,
      sender,
      isWhisper,
      targetAI,
    });

    await ConversationDB.addMessage({
      conversationId: id,
      ...dbMessage,
    });

    // Return the updated conversation
    const conversation = await ConversationDB.getById(id);
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}
