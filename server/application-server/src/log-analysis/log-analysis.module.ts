import { Module, OnModuleInit } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';

// 控制器
import { LogAnalysisController } from './controllers/log-analysis.controller';
import { AgentOrchestratorController } from './controllers/agent-orchestrator.controller';

// 服务
import { LogAnalysisService } from './services/log-analysis.service';
import { LogAnalysisSimplifiedService } from './services/log-analysis-simplified.service';
import { LogAnalysisImprovedService } from './services/log-analysis-improved.service';
import { LogAnalysisRealAIService } from './services/log-analysis-real-ai.service';
import { AgentOrchestratorService } from './services/agent-orchestrator.service';

// 代理
import { LogNormalizationAgent } from './agents/log-normalization.agent';
import { UserLogIssueAgent } from './agents/user-log-issue.agent';
import { AnomalyDetectionAgent } from './agents/anomaly-detection.agent';
import { FeatureExtractionAgent } from './agents/feature-extraction.agent';
import { ErrorAnalysisAgent } from './agents/error-analysis.agent';
import { BehaviorAnalysisAgent } from './agents/behavior-analysis.agent';
import { ReportGenerationAgent } from './agents/report-generation.agent';
import { LLMFeatureExtractionAgent } from './agents/llm-feature-extraction.agent';

@Module({
  imports: [
    AiModule,
    DatabaseModule,
  ],
  controllers: [
    LogAnalysisController,
    AgentOrchestratorController,
  ],
  providers: [
    // 核心服务
    LogAnalysisService,
    LogAnalysisSimplifiedService,
    LogAnalysisImprovedService,
    LogAnalysisRealAIService,
    AgentOrchestratorService,
    
    // 所有代理
    LogNormalizationAgent,
    UserLogIssueAgent,
    AnomalyDetectionAgent,
    FeatureExtractionAgent,
    LLMFeatureExtractionAgent,
    ErrorAnalysisAgent,
    BehaviorAnalysisAgent,
    ReportGenerationAgent,
  ],
  exports: [
    LogAnalysisService,
    LogAnalysisSimplifiedService,
    LogAnalysisImprovedService,
    LogAnalysisRealAIService,
    AgentOrchestratorService,
  ],
})
export class LogAnalysisModule implements OnModuleInit {
  constructor(
    private readonly agentOrchestrator: AgentOrchestratorService,
    private readonly logNormalizationAgent: LogNormalizationAgent,
    private readonly userLogIssueAgent: UserLogIssueAgent,
    private readonly anomalyDetectionAgent: AnomalyDetectionAgent,
    private readonly featureExtractionAgent: FeatureExtractionAgent,
    private readonly llmFeatureExtractionAgent: LLMFeatureExtractionAgent,
    private readonly errorAnalysisAgent: ErrorAnalysisAgent,
    private readonly behaviorAnalysisAgent: BehaviorAnalysisAgent,
    private readonly reportGenerationAgent: ReportGenerationAgent,
  ) {}

  async onModuleInit() {
    // 注册所有代理到编排器
    await this.agentOrchestrator.registerAgent(this.logNormalizationAgent);
    await this.agentOrchestrator.registerAgent(this.userLogIssueAgent);
    await this.agentOrchestrator.registerAgent(this.anomalyDetectionAgent);
    await this.agentOrchestrator.registerAgent(this.featureExtractionAgent);
    await this.agentOrchestrator.registerAgent(this.llmFeatureExtractionAgent);
    await this.agentOrchestrator.registerAgent(this.errorAnalysisAgent);
    await this.agentOrchestrator.registerAgent(this.behaviorAnalysisAgent);
    await this.agentOrchestrator.registerAgent(this.reportGenerationAgent);

    console.log('✅ 所有AI代理已注册到编排器（包含LLM增强版本）');
  }
}
