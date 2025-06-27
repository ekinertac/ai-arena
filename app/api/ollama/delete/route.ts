import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = 'http://localhost:11434';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { model } = body;

    if (!model) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }

    // Delete the model
    const response = await fetch(`${OLLAMA_URL}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: model }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete failed: ${response.status} - ${errorText}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted model: ${model}`,
      model,
    });
  } catch (error) {
    console.error('Ollama delete failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
