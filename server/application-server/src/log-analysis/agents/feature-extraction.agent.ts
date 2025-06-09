import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FeatureExtractionAgent {
  private readonly logger = new Logger(FeatureExtractionAgent.name);

  async extractFeatures(logEntry: any): Promise<any> {
    this.logger.debug('提取特征');
    return {};
  }
} 