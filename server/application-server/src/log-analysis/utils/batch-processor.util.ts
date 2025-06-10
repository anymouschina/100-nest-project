import { Logger } from '@nestjs/common';

export interface BatchConfig {
  baseBatchSize: number;
  maxBatchSize: number;
  maxConcurrency: number;
  largeDataThreshold: number;
}

export const DEFAULT_CONFIG: BatchConfig = {
  baseBatchSize: 25, // 提升批次大小从5到25
  maxBatchSize: 100, // 大数据量时最大批次
  maxConcurrency: 6, // 最大并发数
  largeDataThreshold: 500, // 大数据量阈值
};

export class BatchProcessor {
  private readonly logger = new Logger(BatchProcessor.name);

  constructor(private readonly config: BatchConfig = DEFAULT_CONFIG) {}

  // 🔥 智能批次切片
  createBatches<T>(data: T[]): T[][] {
    if (data.length === 0) return [];

    const batchSize = this.calculateBatchSize(data.length);
    const batches: T[][] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    this.logger.debug(
      `创建批次: ${data.length}条数据 -> ${batches.length}个批次 (每批${batchSize}条)`,
    );

    return batches;
  }

  // 🔥 并行批次处理
  async processInParallel<T, R>(
    batches: T[][],
    processor: (batch: T[], index: number) => Promise<R[]>,
  ): Promise<R[]> {
    const results: R[] = [];
    const concurrency = Math.min(batches.length, this.config.maxConcurrency);

    this.logger.debug(
      `并行处理${batches.length}个批次，并发数：${concurrency}`,
    );

    // 分组并行处理
    for (let i = 0; i < batches.length; i += concurrency) {
      const batchGroup = batches.slice(i, i + concurrency);

      const groupPromises = batchGroup.map((batch, index) =>
        processor(batch, i + index),
      );

      const groupResults = await Promise.all(groupPromises);
      results.push(...groupResults.flat());

      this.logger.debug(
        `完成批次组 ${Math.floor(i / concurrency) + 1}/${Math.ceil(batches.length / concurrency)}`,
      );
    }

    return results;
  }

  // 🔥 智能日志分层
  stratifyLogs(logs: any[]): { tier1: any[]; tier2: any[]; tier3: any[] } {
    const tier1: any[] = []; // 错误和异常
    const tier2: any[] = []; // 警告和重要信息
    const tier3: any[] = []; // 一般信息

    logs.forEach((log) => {
      const logStr = typeof log === 'string' ? log.toLowerCase() : JSON.stringify(log).toLowerCase();

      if (
        logStr.includes('error') ||
        logStr.includes('exception') ||
        logStr.includes('fail') ||
        logStr.includes('crash')
      ) {
        tier1.push(log);
      } else if (
        logStr.includes('warn') ||
        logStr.includes('user') ||
        logStr.includes('login') ||
        logStr.includes('payment')
      ) {
        tier2.push(log);
      } else {
        tier3.push(log);
      }
    });

    // 智能采样第三层级
    if (tier3.length > 300) {
      tier3.splice(300); // 保留前300条
    }

    return { tier1, tier2, tier3 };
  }

  // 🔥 获取处理统计
  getProcessingStats(totalLogs: number): {
    strategy: string;
    batchSize: number;
    batches: number;
    concurrency: number;
    estimatedTime: string;
  } {
    const batchSize = this.calculateBatchSize(totalLogs);
    const batches = Math.ceil(totalLogs / batchSize);
    const concurrency = Math.min(batches, this.config.maxConcurrency);
    const estimatedSeconds = Math.ceil(batches / concurrency * 2);

    return {
      strategy: totalLogs >= this.config.largeDataThreshold ? 'stratified' : 'parallel',
      batchSize,
      batches,
      concurrency,
      estimatedTime: `${estimatedSeconds}秒`,
    };
  }

  private calculateBatchSize(totalLogs: number): number {
    if (totalLogs <= 50) {
      return Math.max(5, Math.floor(totalLogs / 2));
    } else if (totalLogs <= 200) {
      return this.config.baseBatchSize;
    } else if (totalLogs >= this.config.largeDataThreshold) {
      return this.config.maxBatchSize;
    } else {
      return Math.floor(this.config.baseBatchSize * 1.5);
    }
  }
} 