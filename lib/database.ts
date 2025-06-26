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
    await prisma.message.create({
      data: {
        ...data,
        isWhisper: data.isWhisper || false,
      },
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });
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
