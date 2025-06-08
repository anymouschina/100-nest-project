import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AiController } from './controllers/ai.controller';
import { MoonshotService } from './services/moonshot.service';
import { PromptOptimizationService } from './services/prompt-optimization.service';
import { ChatService } from './services/chat.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [AiController],
  providers: [MoonshotService, PromptOptimizationService, ChatService, KnowledgeBaseService],
  exports: [MoonshotService, PromptOptimizationService, ChatService, KnowledgeBaseService],
})
export class AiModule {}