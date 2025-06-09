import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AnomalyDetectionAgent {
  private readonly logger = new Logger(AnomalyDetectionAgent.name);

  async detectAnomalies(logEntry: any): Promise<any> {
    this.logger.debug('检测异常');
    return {};
  }
}
