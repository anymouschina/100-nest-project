-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "messageHash" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_chunks" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "tokenCount" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_summaries" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "summaryType" TEXT NOT NULL,
    "timeRange" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keyPoints" TEXT[],
    "participants" TEXT[],
    "topics" TEXT[],
    "embedding" vector(1536),
    "messageCount" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vector_knowledge" (
    "id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "tags" TEXT[],
    "source" TEXT,
    "sourceId" TEXT,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vector_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "context_windows" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "windowType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "tokenCount" INTEGER NOT NULL,
    "messageIds" TEXT[],
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "context_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embedding_cache" (
    "id" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "tokenCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "useCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "embedding_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChatMessageToChatSummary" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_messageHash_key" ON "chat_messages"("messageHash");

-- CreateIndex
CREATE INDEX "chat_messages_groupName_timestamp_idx" ON "chat_messages"("groupName", "timestamp");

-- CreateIndex
CREATE INDEX "chat_messages_sender_timestamp_idx" ON "chat_messages"("sender", "timestamp");

-- CreateIndex
CREATE INDEX "chat_messages_messageHash_idx" ON "chat_messages"("messageHash");

-- CreateIndex
CREATE UNIQUE INDEX "message_chunks_messageId_chunkIndex_key" ON "message_chunks"("messageId", "chunkIndex");

-- CreateIndex
CREATE INDEX "chat_summaries_groupName_summaryType_timeRange_idx" ON "chat_summaries"("groupName", "summaryType", "timeRange");

-- CreateIndex
CREATE INDEX "chat_summaries_startTime_endTime_idx" ON "chat_summaries"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "vector_knowledge_namespace_importance_idx" ON "vector_knowledge"("namespace", "importance");

-- CreateIndex
CREATE INDEX "vector_knowledge_tags_idx" ON "vector_knowledge"("tags");

-- CreateIndex
CREATE INDEX "vector_knowledge_sourceId_idx" ON "vector_knowledge"("sourceId");

-- CreateIndex
CREATE INDEX "context_windows_sessionId_groupName_idx" ON "context_windows"("sessionId", "groupName");

-- CreateIndex
CREATE INDEX "context_windows_windowType_relevanceScore_idx" ON "context_windows"("windowType", "relevanceScore");

-- CreateIndex
CREATE UNIQUE INDEX "embedding_cache_contentHash_key" ON "embedding_cache"("contentHash");

-- CreateIndex
CREATE INDEX "embedding_cache_contentHash_idx" ON "embedding_cache"("contentHash");

-- CreateIndex
CREATE INDEX "embedding_cache_model_idx" ON "embedding_cache"("model");

-- CreateIndex
CREATE UNIQUE INDEX "_ChatMessageToChatSummary_AB_unique" ON "_ChatMessageToChatSummary"("A", "B");

-- CreateIndex
CREATE INDEX "_ChatMessageToChatSummary_B_index" ON "_ChatMessageToChatSummary"("B");

-- AddForeignKey
ALTER TABLE "message_chunks" ADD CONSTRAINT "message_chunks_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatMessageToChatSummary" ADD CONSTRAINT "_ChatMessageToChatSummary_A_fkey" FOREIGN KEY ("A") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatMessageToChatSummary" ADD CONSTRAINT "_ChatMessageToChatSummary_B_fkey" FOREIGN KEY ("B") REFERENCES "chat_summaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
