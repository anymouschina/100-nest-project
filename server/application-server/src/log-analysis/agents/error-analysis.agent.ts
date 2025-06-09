import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ErrorAnalysisAgent {
  private readonly logger = new Logger(ErrorAnalysisAgent.name);

  async analyzeError(logEntry: any): Promise<any> {
    this.logger.debug('分析错误日志');
    return {};
  }
} 