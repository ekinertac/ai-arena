import { ConversationDB } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/conversations - Get all conversations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('search');

    const conversations = query ? await ConversationDB.search(query) : await ConversationDB.getAll();

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, topic, defenderModel, defenderProvider, criticModel, criticProvider, conversationType } = body;

    if (!title || !defenderModel || !defenderProvider || !criticModel || !criticProvider) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const conversation = await ConversationDB.create({
      title,
      topic: topic || '',
      defenderModel,
      defenderProvider,
      criticModel,
      criticProvider,
      conversationType,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
