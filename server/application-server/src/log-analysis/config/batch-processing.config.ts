export interface BatchProcessingConfig {
  // 基础批次配置
  baseBatchSize: number;
  maxBatchSize: number;
  minBatchSize: number;
  
  // 并发控制
  maxConcurrency: number;
  parallelBatchThreshold: number;
  
  // 大数据量处理
  largeDatasetThreshold: number;
  samplingEnabled: boolean;
  maxSampleSize: number;
  
  // 分层处理
  stratifiedProcessing: boolean;
  tierConfigs: TierConfig[];
}

export interface TierConfig {
  name: string;
  priority: number;
  batchSize: number;
  keywords: string[];
  logLevels: string[];
  maxLogs?: number;
}

export const DEFAULT_BATCH_CONFIG: BatchProcessingConfig = {
  // 🔥 优化批次大小 - 原来是5，现在根据数据量动态调整
  baseBatchSize: 20,      // 基础批次大小提升4倍
  maxBatchSize: 80,       // 最大批次大小（大数据量时）
  minBatchSize: 5,        // 最小批次大小（小数据量时）
  
  // 🔥 并发控制优化
  maxConcurrency: 8,      // 最大并发批次数（原来是1）
  parallelBatchThreshold: 50, // 超过50条日志启用并行处理
  
  // 🔥 大数据量处理策略
  largeDatasetThreshold: 1000, // 超过1000条认为是大数据量
  samplingEnabled: true,       // 启用智能采样
  maxSampleSize: 500,         // 最大采样数量
  
  // 🔥 分层处理配置
  stratifiedProcessing: true,
  tierConfigs: [
    {
      name: '关键错误层',
      priority: 1,
      batchSize: 80,  // 错误日志批次可以更大，因为更重要
      keywords: ['error', 'exception', 'fail', 'crash', 'timeout'],
      logLevels: ['FATAL', 'ERROR', 'CRITICAL'],
      maxLogs: 200,   // 最多处理200条错误日志
    },
    {
      name: '警告和重要信息层',
      priority: 2,
      batchSize: 50,
      keywords: ['warn', 'warning', 'user', 'login', 'payment', 'order'],
      logLevels: ['WARN'],
      maxLogs: 300,
    },
    {
      name: '一般信息层',
      priority: 3,
      batchSize: 30,
      keywords: [],
      logLevels: ['INFO', 'DEBUG', 'TRACE'],
      maxLogs: 500,
    },
  ],
};

// 🔥 根据数据量计算最优批次大小
export function calculateOptimalBatchSize(
  totalLogs: number,
  config: BatchProcessingConfig = DEFAULT_BATCH_CONFIG,
): number {
  if (totalLogs <= 20) {
    return config.minBatchSize;
  } else if (totalLogs <= 100) {
    return config.baseBatchSize;
  } else if (totalLogs <= 500) {
    return Math.floor(config.baseBatchSize * 1.5);
  } else if (totalLogs <= 1000) {
    return Math.floor(config.baseBatchSize * 2);
  } else {
    return config.maxBatchSize;
  }
}

// 🔥 计算最优并发数
export function calculateOptimalConcurrency(
  totalLogs: number,
  batchSize: number,
  config: BatchProcessingConfig = DEFAULT_BATCH_CONFIG,
): number {
  const totalBatches = Math.ceil(totalLogs / batchSize);
  return Math.min(totalBatches, config.maxConcurrency);
}

// 🔥 获取处理策略
export function getProcessingStrategy(
  totalLogs: number,
  config: BatchProcessingConfig = DEFAULT_BATCH_CONFIG,
): 'standard' | 'parallel' | 'stratified' | 'sampled' {
  if (totalLogs >= config.largeDatasetThreshold) {
    return 'stratified';
  } else if (totalLogs >= config.parallelBatchThreshold) {
    return 'parallel';
  } else {
    return 'standard';
  }
}

// 🔥 获取批次处理统计信息
export function getBatchProcessingStats(
  totalLogs: number,
  config: BatchProcessingConfig = DEFAULT_BATCH_CONFIG,
): {
  strategy: string;
  optimalBatchSize: number;
  estimatedBatches: number;
  optimalConcurrency: number;
  estimatedLLMCalls: number;
  estimatedProcessingTime: string;
  willUseSampling: boolean;
} {
  const strategy = getProcessingStrategy(totalLogs, config);
  const optimalBatchSize = calculateOptimalBatchSize(totalLogs, config);
  const estimatedBatches = Math.ceil(totalLogs / optimalBatchSize);
  const optimalConcurrency = calculateOptimalConcurrency(totalLogs, optimalBatchSize, config);
  const willUseSampling = strategy === 'stratified' && config.samplingEnabled;
  
  // 估算处理时间（假设每个LLM调用平均2秒）
  const estimatedSeconds = Math.ceil(estimatedBatches / optimalConcurrency * 2);
  
  return {
    strategy,
    optimalBatchSize,
    estimatedBatches,
    optimalConcurrency,
    estimatedLLMCalls: estimatedBatches,
    estimatedProcessingTime: `${estimatedSeconds}秒`,
    willUseSampling,
  };
} 