import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WechatSummaryController } from './wechat-summary.controller';
import { WechatSummaryService } from './wechat-summary.service';
import { McpService } from './mcp.service';
import { OllamaService } from './ollama.service';
import { LangChainService } from './langchain.service';

@Module({
  imports: [HttpModule],
  controllers: [WechatSummaryController],
  providers: [WechatSummaryService, McpService, OllamaService, LangChainService],
  exports: [WechatSummaryService, McpService, OllamaService, LangChainService],
})
export class WechatSummaryModule {} 