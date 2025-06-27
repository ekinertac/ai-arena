import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = 'http://localhost:11434';

export async function GET(request: NextRequest) {
  try {
    // Check if Ollama server is running
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      return NextResponse.json({
        status: 'offline',
        error: `Ollama server not accessible: ${response.status}`,
        models: [],
        serverUrl: OLLAMA_URL,
      });
    }

    const data = await response.json();
    const models = data.models || [];

    return NextResponse.json({
      status: 'online',
      serverUrl: OLLAMA_URL,
      models: models.map((model: any) => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at,
        digest: model.digest,
        details: model.details || null,
      })),
      totalModels: models.length,
      serverInfo: {
        version: data.version || 'unknown',
        uptime: data.uptime || 'unknown',
      },
    });
  } catch (error) {
    console.error('Ollama status check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        serverUrl: OLLAMA_URL,
        models: [],
      },
      { status: 500 },
    );
  }
}
