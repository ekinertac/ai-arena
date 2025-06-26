-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "defenderModel" TEXT NOT NULL,
    "defenderProvider" TEXT NOT NULL,
    "criticModel" TEXT NOT NULL,
    "criticProvider" TEXT NOT NULL,
    "conversationType" TEXT NOT NULL DEFAULT 'MIXED'
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isWhisper" BOOLEAN NOT NULL DEFAULT false,
    "targetAI" TEXT,
    "conversationId" TEXT NOT NULL,
    CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
