import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WechatSummaryController } from './wechat-summary.controller';
import { WechatSummaryService } from './wechat-summary.service';
import { McpService } from './mcp.service';
import { OllamaService } from './ollama.service';
import { LangChainService } from './langchain.service';
import { EnhancedLangChainService } from './enhanced-langchain.service';
import { VectorService } from './vector.service';
import { DatabaseService } from '../database/database.service';
import { NicknameService } from './nickname.service';
import { SummaryCacheService } from './summary-cache.service';

@Module({
  imports: [HttpModule],
  controllers: [WechatSummaryController],
  providers: [
    WechatSummaryService,
    McpService,
    OllamaService,
    LangChainService,
    EnhancedLangChainService,
    VectorService,
    DatabaseService,
    NicknameService,
    SummaryCacheService,
  ],
  exports: [
    WechatSummaryService,
    McpService,
    OllamaService,
    LangChainService,
    EnhancedLangChainService,
    VectorService,
    NicknameService,
    SummaryCacheService,
  ],
})
export class WechatSummaryModule {} 