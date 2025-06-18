import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SemanticService } from './services/semantic.service';
import { AgentService } from './services/agent.service';
import { EmbeddingService } from './services/embedding.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [ChatController],
  providers: [ChatService, SemanticService, AgentService, EmbeddingService],
  exports: [ChatService],
})
export class ChatModule {} 