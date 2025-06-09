import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AiModule } from '../ai/ai.module';
import { LogAnalysisController } from './controllers/log-analysis.controller';
import { LogAnalysisService } from './services/log-analysis.service';
import { AgentOrchestratorService } from './services/agent-orchestrator.service';
import { WhitelistService } from './services/whitelist.service';
import { FeatureExtractionService } from './services/feature-extraction.service';

// Agents
import { LogNormalizationAgent } from './agents/log-normalization.agent';
import { ErrorAnalysisAgent } from './agents/error-analysis.agent';
import { UserLogIssueAgent } from './agents/user-log-issue.agent';
import { FeatureExtractionAgent } from './agents/feature-extraction.agent';
import { AnomalyDetectionAgent } from './agents/anomaly-detection.agent';
import { BehaviorAnalysisAgent } from './agents/behavior-analysis.agent';
import { ReportGenerationAgent } from './agents/report-generation.agent';

@Module({
  imports: [DatabaseModule, AiModule],
  controllers: [LogAnalysisController],
  providers: [
    // Core Services
    LogAnalysisService,
    AgentOrchestratorService,
    WhitelistService,
    FeatureExtractionService,
    
    // Agents
    LogNormalizationAgent,
    ErrorAnalysisAgent,
    UserLogIssueAgent,
    FeatureExtractionAgent,
    AnomalyDetectionAgent,
    BehaviorAnalysisAgent,
    ReportGenerationAgent,
  ],
  exports: [LogAnalysisService, WhitelistService, FeatureExtractionService],
})
export class LogAnalysisModule {} 