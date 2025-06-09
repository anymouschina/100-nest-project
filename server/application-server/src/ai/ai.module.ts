import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { AiController } from './controllers/ai.controller';
import { MoonshotService } from './services/moonshot.service';
import { PromptOptimizationService } from './services/prompt-optimization.service';
import { ChatService } from './services/chat.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { QdrantService } from './services/qdrant.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorKnowledgeService } from './services/vector-knowledge.service';

@Module({
  imports: [ConfigModule, DatabaseModule, ScheduleModule.forRoot()],
  controllers: [AiController],
  providers: [
    MoonshotService,
    PromptOptimizationService,
    ChatService,
    KnowledgeBaseService,
    QdrantService,
    EmbeddingService,
    VectorKnowledgeService,
  ],
  exports: [
    MoonshotService,
    PromptOptimizationService,
    ChatService,
    KnowledgeBaseService,
    QdrantService,
    EmbeddingService,
    VectorKnowledgeService,
  ],
})
export class AiModule {}
