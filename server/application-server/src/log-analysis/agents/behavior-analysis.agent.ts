import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BehaviorAnalysisAgent {
  private readonly logger = new Logger(BehaviorAnalysisAgent.name);

  async analyzeBehavior(logEntry: any): Promise<any> {
    this.logger.debug('分析用户行为');
    return {};
  }
} 