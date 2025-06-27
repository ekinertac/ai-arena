import { ConversationDB } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/conversations/[id] - Get a specific conversation
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conversation = await ConversationDB.getById(id);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

// PATCH /api/conversations/[id] - Update a conversation
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, title, topic, defenderModel, defenderProvider, criticModel, criticProvider } = body;

    if (status) {
      await ConversationDB.updateStatus(id, status);
    }

    if (title !== undefined || topic !== undefined) {
      await ConversationDB.updateTitleAndTopic(id, title || '', topic || '');
    }

    // Handle model configuration updates
    const modelUpdates: any = {};
    if (defenderModel !== undefined) modelUpdates.defenderModel = defenderModel;
    if (defenderProvider !== undefined) modelUpdates.defenderProvider = defenderProvider;
    if (criticModel !== undefined) modelUpdates.criticModel = criticModel;
    if (criticProvider !== undefined) modelUpdates.criticProvider = criticProvider;

    if (Object.keys(modelUpdates).length > 0) {
      await ConversationDB.updateModelConfig(id, modelUpdates);
    }

    const conversation = await ConversationDB.getById(id);
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ConversationDB.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
