import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LogNormalizationAgent {
  private readonly logger = new Logger(LogNormalizationAgent.name);

  async normalizeLog(logEntry: any): Promise<any> {
    this.logger.debug('归一化日志条目');
    return logEntry;
  }
} 