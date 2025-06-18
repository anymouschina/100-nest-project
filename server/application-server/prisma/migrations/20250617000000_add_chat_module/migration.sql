-- 创建聊天Agent表
CREATE TABLE "chat_agents" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "system_prompt" TEXT NOT NULL,
  "capabilities" TEXT[],
  "model_config" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "chat_agents_pkey" PRIMARY KEY ("id")
);

-- 创建聊天会话表
CREATE TABLE "chat_sessions" (
  "id" TEXT NOT NULL,
  "user_id" INTEGER NOT NULL,
  "agent_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "end_time" TIMESTAMP(3),
  "title" TEXT,
  "summary" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "chat_sessions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "chat_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 创建会话消息表
CREATE TABLE "chat_session_messages" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" vector(1536),
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,

  CONSTRAINT "chat_session_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_session_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 创建语义意图表
CREATE TABLE "semantic_intents" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "examples" TEXT[],
  "agent_type" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 1,
  "embedding" vector(1536),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "semantic_intents_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX "idx_chat_sessions_user_id_status" ON "chat_sessions"("user_id", "status");
CREATE INDEX "idx_chat_sessions_agent_id_status" ON "chat_sessions"("agent_id", "status");
CREATE INDEX "idx_chat_session_messages_session_id_timestamp" ON "chat_session_messages"("session_id", "timestamp");
CREATE INDEX "idx_chat_session_messages_role_timestamp" ON "chat_session_messages"("role", "timestamp");
CREATE INDEX "idx_semantic_intents_agent_type_active" ON "semantic_intents"("agent_type", "active");
CREATE INDEX "idx_chat_agents_type_active" ON "chat_agents"("type", "active"); 