/**
 * Client-side Ollama service for direct localhost connections
 * This avoids server-side proxy issues on deployment platforms like Vercel
 */

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  digest: string;
  details?: any;
}

export interface OllamaStatus {
  status: 'online' | 'offline' | 'error' | 'cors-blocked';
  serverUrl: string;
  models: OllamaModel[];
  totalModels: number;
  serverInfo?: {
    version: string;
    uptime: string;
  };
  error?: string;
  corsInstructions?: string;
}

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if we're running in a deployed environment (HTTPS)
   */
  private isDeployedEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.protocol === 'https:' && !window.location.hostname.includes('localhost');
  }

  /**
   * Get CORS setup instructions for users
   */
  private getCorsInstructions(): string {
    return `To use Ollama from this deployed app, you need to enable CORS:

1. Stop Ollama if running: pkill ollama
2. Set CORS environment variable:
   export OLLAMA_ORIGINS="*"
3. Start Ollama: ollama serve
4. Refresh this page

Alternative: Run locally at http://localhost:3000 for seamless Ollama access.`;
  }

  /**
   * Check if Ollama server is running and get status
   */
  async getStatus(): Promise<OllamaStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        return {
          status: 'offline',
          error: `Ollama server not accessible: ${response.status}`,
          models: [],
          totalModels: 0,
          serverUrl: this.baseUrl,
        };
      }

      const data = await response.json();
      const models: OllamaModel[] = data.models || [];

      return {
        status: 'online',
        serverUrl: this.baseUrl,
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
      };
    } catch (error) {
      console.error('Ollama status check failed:', error);

      // Check if this is a CORS error
      const isCorsError = error instanceof TypeError && error.message.includes('Failed to fetch');
      const isDeployed = this.isDeployedEnvironment();

      if (isCorsError && isDeployed) {
        return {
          status: 'cors-blocked',
          error: 'CORS blocked - Ollama needs CORS configuration for deployed apps',
          corsInstructions: this.getCorsInstructions(),
          serverUrl: this.baseUrl,
          models: [],
          totalModels: 0,
        };
      }

      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        serverUrl: this.baseUrl,
        models: [],
        totalModels: 0,
      };
    }
  }

  /**
   * Check if Ollama is connected
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];

      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  /**
   * Pull/download a model
   */
  async pullModel(modelName: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pull failed: ${response.status} - ${errorText}`);
      }

      return {
        success: true,
        message: `Started downloading model: ${modelName}`,
      };
    } catch (error) {
      // Check for CORS error
      const isCorsError = error instanceof TypeError && error.message.includes('Failed to fetch');
      const isDeployed = this.isDeployedEnvironment();

      if (isCorsError && isDeployed) {
        return {
          success: false,
          message: 'CORS blocked - Enable CORS in Ollama settings to download models from deployed apps',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} - ${errorText}`);
      }

      return {
        success: true,
        message: `Successfully deleted model: ${modelName}`,
      };
    } catch (error) {
      // Check for CORS error
      const isCorsError = error instanceof TypeError && error.message.includes('Failed to fetch');
      const isDeployed = this.isDeployedEnvironment();

      if (isCorsError && isDeployed) {
        return {
          success: false,
          message: 'CORS blocked - Enable CORS in Ollama settings to manage models from deployed apps',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate a non-streaming response
   */
  async generateResponse(messages: any[], model: string): Promise<string> {
    const ollamaMessages = this.convertToOllamaFormat(messages);

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: ollamaMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  /**
   * Generate a streaming response
   */
  async *generateStreamingResponse(messages: any[], model: string): AsyncGenerator<string> {
    const ollamaMessages = this.convertToOllamaFormat(messages);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: ollamaMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama streaming request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                yield data.message.content;
              }
              if (data.done) return;
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      // Check for CORS error during streaming
      const isCorsError = error instanceof TypeError && error.message.includes('fetch');
      const isDeployed = this.isDeployedEnvironment();

      if (isCorsError && isDeployed) {
        throw new Error('CORS blocked - Enable CORS in Ollama settings for deployed apps');
      }

      throw error;
    }
  }

  private convertToOllamaFormat(messages: any[]): any[] {
    return messages.map((msg) => {
      if (msg.sender === 'user') {
        return { role: 'user', content: msg.content };
      } else if (msg.sender === 'defender' || msg.sender === 'critic') {
        return { role: 'assistant', content: msg.content };
      } else if (msg.role) {
        return msg; // Already in correct format
      } else {
        return { role: 'user', content: msg.content };
      }
    });
  }
}

// Create a default instance
export const ollamaClient = new OllamaClient();

// Hook for using Ollama client in React components
export function useOllamaClient() {
  return ollamaClient;
}
