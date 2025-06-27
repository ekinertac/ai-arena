import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = 'http://localhost:11434';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model } = body;

    if (!model) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }

    // Start the pull operation
    const response = await fetch(`${OLLAMA_URL}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: model }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pull failed: ${response.status} - ${errorText}`);
    }

    // For now, we'll return success immediately
    // In a full implementation, you'd want to stream the progress
    return NextResponse.json({
      success: true,
      message: `Started downloading model: ${model}`,
      model,
    });
  } catch (error) {
    console.error('Ollama pull failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
