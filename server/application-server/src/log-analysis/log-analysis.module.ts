import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AiModule } from '../ai/ai.module';
import { LogAnalysisController } from './controllers/log-analysis.controller';
import { LogAnalysisService } from './services/log-analysis.service';
import { LogAnalysisSimplifiedService } from './services/log-analysis-simplified.service';
import { LogAnalysisImprovedService } from './services/log-analysis-improved.service';

// 只导入实际存在的Agent
import { UserLogIssueAgent } from './agents/user-log-issue.agent';

@Module({
  imports: [DatabaseModule, AiModule],
  controllers: [LogAnalysisController],
  providers: [
    // Core Services
    LogAnalysisService,
    LogAnalysisSimplifiedService,
    LogAnalysisImprovedService,

    // Agents
    UserLogIssueAgent,
  ],
  exports: [LogAnalysisService, LogAnalysisSimplifiedService, LogAnalysisImprovedService],
})
export class LogAnalysisModule {}
