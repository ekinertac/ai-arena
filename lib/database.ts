import { PrismaClient } from './generated/prisma';

// Global Prisma instance (singleton pattern for development)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Types that match our UI components
export type ConversationWithMessages = {
  id: string;
  title: string;
  topic: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
  defenderModel: string;
  defenderProvider: string;
  criticModel: string;
  criticProvider: string;
  conversationType: 'MIXED' | 'SAME_MODEL' | 'COLLABORATIVE';
  messages: {
    id: string;
    content: string;
    sender: 'USER' | 'DEFENDER' | 'CRITIC';
    timestamp: Date;
    isWhisper: boolean;
    targetAI: string | null;
  }[];
};

// Database operations
export class ConversationDB {
  // Create a new conversation
  static async create(data: {
    title: string;
    topic: string;
    defenderModel: string;
    defenderProvider: string;
    criticModel: string;
    criticProvider: string;
    conversationType?: 'MIXED' | 'SAME_MODEL' | 'COLLABORATIVE';
  }): Promise<ConversationWithMessages> {
    const conversation = await prisma.conversation.create({
      data: {
        ...data,
        conversationType: data.conversationType || 'MIXED',
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return conversation as ConversationWithMessages;
  }

  // Get all conversations (ordered by most recent)
  static async getAll(): Promise<ConversationWithMessages[]> {
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations as ConversationWithMessages[];
  }

  // Get a specific conversation by ID
  static async getById(id: string): Promise<ConversationWithMessages | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return conversation as ConversationWithMessages | null;
  }

  // Update conversation status
  static async updateStatus(id: string, status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'): Promise<void> {
    await prisma.conversation.update({
      where: { id },
      data: { status },
    });
  }

  // Update conversation title and topic
  static async updateTitleAndTopic(id: string, title: string, topic: string): Promise<void> {
    await prisma.conversation.update({
      where: { id },
      data: { title, topic },
    });
  }

  // Update conversation model configuration
  static async updateModelConfig(
    id: string,
    updates: Partial<{
      defenderModel: string;
      defenderProvider: string;
      criticModel: string;
      criticProvider: string;
    }>,
  ): Promise<void> {
    await prisma.conversation.update({
      where: { id },
      data: updates,
    });
  }

  // Delete a conversation (and all its messages due to cascade)
  static async delete(id: string): Promise<void> {
    await prisma.conversation.delete({
      where: { id },
    });
  }

  // Add a message to a conversation
  static async addMessage(data: {
    conversationId: string;
    content: string;
    sender: 'USER' | 'DEFENDER' | 'CRITIC';
    isWhisper?: boolean;
    targetAI?: string;
  }): Promise<void> {
    console.log('🔵 [DB] Adding message to database:');
    console.log('🔵 [DB] ConversationId:', data.conversationId);
    console.log('🔵 [DB] Sender:', data.sender);
    console.log('🔵 [DB] Content length:', data.content?.length || 0);
    console.log(
      '🔵 [DB] Content preview:',
      data.content?.substring(0, 100) + (data.content?.length > 100 ? '...' : ''),
    );
    console.log('🔵 [DB] Raw content:', JSON.stringify(data.content));
    console.log('🔵 [DB] IsWhisper:', data.isWhisper);
    console.log('🔵 [DB] TargetAI:', data.targetAI);

    const message = await prisma.message.create({
      data: {
        ...data,
        isWhisper: data.isWhisper || false,
      },
    });

    console.log('🟢 [DB] Message created with ID:', message.id);
    console.log('🟢 [DB] Stored content length:', message.content?.length || 0);
    console.log(
      '🟢 [DB] Stored content preview:',
      message.content?.substring(0, 100) + (message.content?.length > 100 ? '...' : ''),
    );
    console.log('🟢 [DB] Stored raw content:', JSON.stringify(message.content));

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    console.log('🟢 [DB] Conversation timestamp updated');
  }

  // Search conversations by title/topic
  static async search(query: string): Promise<ConversationWithMessages[]> {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ title: { contains: query } }, { topic: { contains: query } }],
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations as ConversationWithMessages[];
  }
}

// Utility function to convert UI types to database types
export function convertUIMessageToDB(message: {
  content: string;
  sender: 'user' | 'defender' | 'critic';
  isWhisper?: boolean;
  targetAI?: string;
}): {
  content: string;
  sender: 'USER' | 'DEFENDER' | 'CRITIC';
  isWhisper: boolean;
  targetAI?: string;
} {
  return {
    content: message.content,
    sender: message.sender.toUpperCase() as 'USER' | 'DEFENDER' | 'CRITIC',
    isWhisper: message.isWhisper || false,
    targetAI: message.targetAI,
  };
}

// Utility function to convert database types to UI types
export function convertDBMessageToUI(message: {
  id: string;
  content: string;
  sender: 'USER' | 'DEFENDER' | 'CRITIC';
  timestamp: Date;
  isWhisper: boolean;
  targetAI: string | null;
}): {
  id: string;
  content: string;
  sender: 'user' | 'defender' | 'critic';
  timestamp: Date;
  isWhisper?: boolean;
  targetAI?: string;
} {
  return {
    id: message.id,
    content: message.content,
    sender: message.sender.toLowerCase() as 'user' | 'defender' | 'critic',
    timestamp: message.timestamp,
    isWhisper: message.isWhisper || undefined,
    targetAI: message.targetAI || undefined,
  };
}

/**
 * Frontend database utilities for connecting UI to database API endpoints
 */

export interface UIConversation {
  id: string;
  title: string;
  topic: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  messages: UIMessage[];
  createdAt: Date;
  updatedAt: Date;
  defenderModel: string;
  defenderProvider: string;
  criticModel: string;
  criticProvider: string;
  conversationType: 'MIXED' | 'SAME_MODEL' | 'COLLABORATIVE';
}

export interface UIMessage {
  id: string;
  content: string;
  sender: 'user' | 'defender' | 'critic';
  timestamp: Date;
  isWhisper?: boolean;
  targetAI?: string;
}

export interface CreateConversationRequest {
  title: string;
  topic: string;
  defenderModel: string;
  defenderProvider: string;
  criticModel: string;
  criticProvider: string;
  conversationType: 'MIXED' | 'SAME_MODEL' | 'COLLABORATIVE';
}

export interface AddMessageRequest {
  content: string;
  sender: 'user' | 'defender' | 'critic';
  isWhisper?: boolean;
  targetAI?: string;
}

/**
 * Frontend Database API Client
 */
export class DatabaseAPI {
  private static baseUrl = '/api/conversations';

  // Get all conversations
  static async getConversations(search?: string): Promise<UIConversation[]> {
    try {
      const url = search ? `${this.baseUrl}?search=${encodeURIComponent(search)}` : this.baseUrl;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      return data.conversations.map((conv: any) => this.convertToUIConversation(conv));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get a specific conversation
  static async getConversation(id: string): Promise<UIConversation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status}`);
      }

      const data = await response.json();
      return this.convertToUIConversation(data.conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  // Create a new conversation
  static async createConversation(request: CreateConversationRequest): Promise<UIConversation> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`);
      }

      const data = await response.json();
      return this.convertToUIConversation(data.conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Add a message to a conversation
  static async addMessage(conversationId: string, message: AddMessageRequest): Promise<UIConversation> {
    try {
      const response = await fetch(`${this.baseUrl}/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Failed to add message: ${response.status}`);
      }

      const data = await response.json();
      return this.convertToUIConversation(data.conversation);
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Update conversation status
  static async updateConversationStatus(
    id: string,
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED',
  ): Promise<UIConversation> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update conversation status: ${response.status}`);
      }

      const data = await response.json();
      return this.convertToUIConversation(data.conversation);
    } catch (error) {
      console.error('Error updating conversation status:', error);
      throw error;
    }
  }

  // Update conversation title and topic
  static async updateConversationTitleAndTopic(id: string, title: string, topic: string): Promise<UIConversation> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, topic }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update conversation: ${response.status}`);
      }

      const data = await response.json();
      return this.convertToUIConversation(data.conversation);
    } catch (error) {
      console.error('Error updating conversation title and topic:', error);
      throw error;
    }
  }

  static async updateConversation(
    id: string,
    updates: Partial<{
      title: string;
      topic: string;
      defenderModel: string;
      defenderProvider: string;
      criticModel: string;
      criticProvider: string;
      status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    }>,
  ): Promise<UIConversation> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update conversation: ${response.status}`);
      }

      const data = await response.json();
      return this.convertToUIConversation(data.conversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  // Delete a conversation
  static async deleteConversation(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // Convert database format to UI format
  private static convertToUIConversation(dbConv: any): UIConversation {
    if (!dbConv) {
      throw new Error('Conversation data is missing or undefined');
    }

    if (!dbConv.id) {
      throw new Error('Conversation ID is missing');
    }

    return {
      id: dbConv.id,
      title: dbConv.title || 'Untitled',
      topic: dbConv.topic || '',
      status: dbConv.status || 'PAUSED',
      createdAt: new Date(dbConv.createdAt),
      updatedAt: new Date(dbConv.updatedAt),
      defenderModel: dbConv.defenderModel || '',
      defenderProvider: dbConv.defenderProvider || '',
      criticModel: dbConv.criticModel || '',
      criticProvider: dbConv.criticProvider || '',
      conversationType: dbConv.conversationType || 'MIXED',
      messages: (dbConv.messages || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender.toLowerCase() as 'user' | 'defender' | 'critic',
        timestamp: new Date(msg.timestamp),
        isWhisper: msg.isWhisper,
        targetAI: msg.targetAI,
      })),
    };
  }
}
