import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { AiController } from './controllers/ai.controller';
import { UniversalAIController } from './controllers/universal-ai.controller';

import { MoonshotService } from './services/moonshot.service';
import { OllamaService } from './services/ollama.service';
import { OllamaEmbeddingService } from './services/ollama-embedding.service';
import { OllamaUniversalEmbeddingService } from './services/ollama-universal-embedding.service';
import { AIProviderService } from './services/ai-provider.service';
import { UniversalAIService } from './services/universal-ai.service';
import { LangChainAIProviderService } from './services/langchain-ai-provider.service';
import { PromptOptimizationService } from './services/prompt-optimization.service';
import { ChatService } from './services/chat.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { QdrantService } from './services/qdrant.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorKnowledgeService } from './services/vector-knowledge.service';

@Module({
  imports: [ConfigModule, DatabaseModule, ScheduleModule.forRoot()],
  controllers: [AiController, UniversalAIController],
  providers: [
          // Ollama本地AI服务 (主要)
      OllamaService,
      OllamaEmbeddingService,
      OllamaUniversalEmbeddingService,
    // 外部AI服务 (备用)
    MoonshotService,
    EmbeddingService,
    // AI服务提供商管理器
    AIProviderService,
    UniversalAIService,
    LangChainAIProviderService,
    // 业务服务
    PromptOptimizationService,
    ChatService,
    KnowledgeBaseService,
    QdrantService,
    VectorKnowledgeService,
  ],
  exports: [
    OllamaService,
    OllamaEmbeddingService,
    OllamaUniversalEmbeddingService,
    MoonshotService,
    EmbeddingService,
    AIProviderService,
    UniversalAIService,
    LangChainAIProviderService,
    PromptOptimizationService,
    ChatService,
    KnowledgeBaseService,
    QdrantService,
    VectorKnowledgeService,
  ],
})
export class AiModule {}
