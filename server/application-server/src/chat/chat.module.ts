import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OllamaService } from './services/ollama.service';
import { AgentFactoryService } from './services/agent-factory.service';
import { ToolRegistryService } from './services/tool-registry.service';
import { ContextManagerService } from './services/context-manager.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    OllamaService,
    AgentFactoryService,
    ToolRegistryService,
    ContextManagerService,
  ],
  exports: [ChatService],
})
export class ChatModule {} 