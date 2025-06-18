-- AlterTable
ALTER TABLE "chat_agents" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "chat_sessions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "semantic_intents" ALTER COLUMN "updated_at" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "idx_chat_agents_type_active" RENAME TO "chat_agents_type_active_idx";

-- RenameIndex
ALTER INDEX "idx_chat_session_messages_role_timestamp" RENAME TO "chat_session_messages_role_timestamp_idx";

-- RenameIndex
ALTER INDEX "idx_chat_session_messages_session_id_timestamp" RENAME TO "chat_session_messages_session_id_timestamp_idx";

-- RenameIndex
ALTER INDEX "idx_chat_sessions_agent_id_status" RENAME TO "chat_sessions_agent_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_chat_sessions_user_id_status" RENAME TO "chat_sessions_user_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_semantic_intents_agent_type_active" RENAME TO "semantic_intents_agent_type_active_idx";
