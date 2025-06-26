export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  name: string;
  models: string[];
  generateResponse(
    messages: AIMessage[],
    model: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    },
  ): Promise<string>;
  generateStreamingResponse(
    messages: AIMessage[],
    model: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): AsyncGenerator<string, void, unknown>;
  validateConnection(): Promise<boolean>;
}

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];

  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateResponse(
    messages: AIMessage[],
    model: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {},
  ): Promise<string> {
    const { temperature = 0.7, maxTokens = 1000, stream = false } = options;

    if (stream) {
      throw new Error('Streaming not implemented yet - use generateStreamingResponse');
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async *generateStreamingResponse(
    messages: AIMessage[],
    model: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {},
  ): AsyncGenerator<string, void, unknown> {
    const { temperature = 0.7, maxTokens = 1000 } = options;

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') continue;
          if (trimmed === 'data: [DONE]') return;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip malformed JSON lines
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export class AnthropicProvider implements AIProvider {
  name = 'Anthropic';
  models = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];

  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL = 'https://api.anthropic.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async validateConnection(): Promise<boolean> {
    // Anthropic doesn't have a simple health check endpoint
    // We'll try a minimal completion to test the connection
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateResponse(
    messages: AIMessage[],
    model: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {},
  ): Promise<string> {
    const { temperature = 0.7, maxTokens = 1000, stream = false } = options;

    if (stream) {
      throw new Error('Streaming not implemented yet - use generateStreamingResponse');
    }

    // Convert system message to Anthropic format
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: userMessages,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  async *generateStreamingResponse(
    messages: AIMessage[],
    model: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {},
  ): AsyncGenerator<string, void, unknown> {
    const { temperature = 0.7, maxTokens = 1000 } = options;

    // Convert system message to Anthropic format
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: userMessages,
      stream: true,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));

            if (json.type === 'content_block_delta' && json.delta?.text) {
              yield json.delta.text;
            }

            if (json.type === 'message_stop') {
              return;
            }
          } catch {
            // Skip malformed JSON lines
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export class OllamaProvider implements AIProvider {
  name = 'Ollama';
  models: string[] = []; // Will be populated dynamically

  private baseURL: string;

  constructor(apiKey = '', baseURL = 'http://localhost:11434') {
    // Ollama doesn't use API keys, but we maintain the interface
    void apiKey; // Used for interface compatibility
    this.baseURL = baseURL;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        this.models = data.models?.map((model: { name: string }) => model.name) || [];
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((model: { name: string }) => model.name) || [];
        this.models = models;
        return models;
      }
      return [];
    } catch {
      return [];
    }
  }

  async generateResponse(
    messages: AIMessage[],
    model: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {},
  ): Promise<string> {
    const { temperature = 0.7, stream = false } = options;

    if (stream) {
      throw new Error('Streaming not implemented yet - use generateStreamingResponse');
    }

    // Convert messages to Ollama format
    const prompt = this.convertMessagesToPrompt(messages);

    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          num_predict: options.maxTokens || 1000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  async *generateStreamingResponse(
    messages: AIMessage[],
    model: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {},
  ): AsyncGenerator<string, void, unknown> {
    const { temperature = 0.7 } = options;

    // Convert messages to Ollama format
    const prompt = this.convertMessagesToPrompt(messages);

    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature,
          num_predict: options.maxTokens || 1000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') continue;

          try {
            const json = JSON.parse(trimmed);

            if (json.response) {
              yield json.response;
            }

            if (json.done) {
              return;
            }
          } catch {
            // Skip malformed JSON lines
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private convertMessagesToPrompt(messages: AIMessage[]): string {
    // Convert OpenAI-style messages to a single prompt for Ollama
    let prompt = '';

    for (const message of messages) {
      switch (message.role) {
        case 'system':
          prompt += `System: ${message.content}\n\n`;
          break;
        case 'user':
          prompt += `Human: ${message.content}\n\n`;
          break;
        case 'assistant':
          prompt += `Assistant: ${message.content}\n\n`;
          break;
      }
    }

    prompt += 'Assistant: ';
    return prompt;
  }
}

// Client-side Ollama provider for direct local connections
export class ClientOllamaProvider {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

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

  async *generateStreamingResponse(messages: any[], model: string): AsyncGenerator<string> {
    const ollamaMessages = this.convertToOllamaFormat(messages);

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

// Utility function to get available providers
export function getAvailableProviders(): { [key: string]: new (apiKey: string) => AIProvider } {
  return {
    openai: OpenAIProvider,
    anthropic: AnthropicProvider,
    ollama: OllamaProvider,
  };
}

// Helper function to create provider instances
export function createProvider(providerName: string, apiKey: string): AIProvider | null {
  const providers = getAvailableProviders();
  const ProviderClass = providers[providerName];

  if (!ProviderClass) {
    return null;
  }

  return new ProviderClass(apiKey);
}
