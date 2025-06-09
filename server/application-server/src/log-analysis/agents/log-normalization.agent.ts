import { Injectable, Logger } from '@nestjs/common';

interface NormalizedLog {
  normalizedType: string;
  severity: number;
  category: string;
  isProcessed: boolean;
}

@Injectable()
export class LogNormalizationAgent {
  private readonly logger = new Logger(LogNormalizationAgent.name);

  /**
   * 归一化日志条目 - 基于规则的快速分类
   */
  async normalizeLog(logEntry: any): Promise<any> {
    this.logger.debug(`开始归一化日志: ${logEntry.id}`);

    try {
      // 1. 基础归一化
      const normalized = await this.performBasicNormalization(logEntry);

      // 2. 错误类型归一化
      const errorType = this.normalizeErrorType(logEntry);

      // 3. 严重程度归一化
      const severity = this.normalizeSeverity(logEntry, errorType);

      // 4. 分类归一化
      const category = this.normalizeCategory(logEntry, errorType);

      const result = {
        ...logEntry,
        normalizedType: errorType,
        severity,
        category,
        isProcessed: true,
        normalizedAt: new Date(),
      };

      this.logger.debug(`归一化完成: ${logEntry.id} -> ${errorType}`);
      return result;
    } catch (error) {
      this.logger.error(`归一化失败: ${logEntry.id}`, error.stack);
      return {
        ...logEntry,
        normalizedType: 'UNKNOWN',
        severity: 1,
        category: 'UNPROCESSED',
        isProcessed: false,
      };
    }
  }

  /**
   * 基础归一化 - 标准化字段格式
   */
  private async performBasicNormalization(logEntry: any): Promise<any> {
    // 标准化时间戳
    if (typeof logEntry.timestamp === 'string') {
      logEntry.timestamp = new Date(logEntry.timestamp);
    }

    // 标准化日志级别
    if (logEntry.level) {
      logEntry.level = logEntry.level.toUpperCase();
    }

    // 标准化来源
    if (logEntry.source) {
      logEntry.source = logEntry.source.toLowerCase();
    }

    // 清理和标准化元数据
    if (logEntry.metadata) {
      logEntry.metadata = this.normalizeMetadata(logEntry.metadata);
    }

    return logEntry;
  }

  /**
   * 错误类型归一化 - 快速规则匹配
   */
  private normalizeErrorType(logEntry: any): string {
    const { message, level, source, metadata } = logEntry;

    // 1. 后端返回码错误 (最常见，优先检测)
    if (source === 'backend' && metadata?.retCode && metadata.retCode !== 0) {
      if (metadata.retCode >= 500) return 'BACKEND_SERVER_ERROR';
      if (metadata.retCode >= 400) return 'BACKEND_CLIENT_ERROR';
      return 'BACKEND_BUSINESS_ERROR';
    }

    // 2. 前端JS错误
    if (source === 'frontend' && level === 'ERROR') {
      if (message.includes('TypeError')) return 'FRONTEND_TYPE_ERROR';
      if (message.includes('ReferenceError')) return 'FRONTEND_REFERENCE_ERROR';
      if (message.includes('Network Error')) return 'FRONTEND_NETWORK_ERROR';
      return 'FRONTEND_JS_ERROR';
    }

    // 3. 阻塞性错误 (高优先级)
    if (this.isBlockingPattern(message, metadata)) {
      return 'BLOCKING_ERROR';
    }

    // 4. 关键流程错误
    if (this.isKeyFlowPattern(metadata?.apiEndpoint)) {
      return 'KEY_FLOW_ERROR';
    }

    // 5. 业务参数错误
    if (this.isBusinessParamPattern(message, metadata)) {
      return 'BUSINESS_PARAM_ERROR';
    }

    // 6. 车型规格错误
    if (this.isVehicleSpecPattern(metadata)) {
      return 'VEHICLE_SPEC_ERROR';
    }

    // 7. 页面卸载错误 (小程序特性)
    if (this.isPageUnloadPattern(message, source)) {
      return 'PAGE_UNLOAD_ERROR';
    }

    // 8. 默认分类
    if (level === 'ERROR') return 'GENERIC_ERROR';
    if (level === 'WARN') return 'GENERIC_WARNING';

    return 'INFO_LOG';
  }

  /**
   * 严重程度归一化 (1-5级)
   */
  private normalizeSeverity(logEntry: any, errorType: string): number {
    // 基于错误类型的基础严重程度
    const baseSeverity: Record<string, number> = {
      BLOCKING_ERROR: 5, // 最高优先级
      BACKEND_SERVER_ERROR: 4, // 服务器错误
      KEY_FLOW_ERROR: 4, // 关键流程
      BACKEND_CLIENT_ERROR: 3, // 客户端错误
      BACKEND_BUSINESS_ERROR: 3, // 业务错误
      BUSINESS_PARAM_ERROR: 3, // 业务参数
      VEHICLE_SPEC_ERROR: 3, // 车型规格
      FRONTEND_NETWORK_ERROR: 3, // 网络错误
      FRONTEND_TYPE_ERROR: 2, // 类型错误
      FRONTEND_REFERENCE_ERROR: 2, // 引用错误
      FRONTEND_JS_ERROR: 2, // JS错误
      PAGE_UNLOAD_ERROR: 1, // 页面卸载
      GENERIC_ERROR: 2, // 通用错误
      GENERIC_WARNING: 1, // 警告
      INFO_LOG: 1, // 信息日志
    };

    let severity = baseSeverity[errorType] || 1;

    // 调整因子
    const { metadata } = logEntry;

    // 支付相关 +2
    if (
      metadata?.affectsPayment ||
      metadata?.apiEndpoint?.includes('payment')
    ) {
      severity = Math.min(5, severity + 2);
    }

    // 用户影响范围调整
    if (metadata?.affectedUsers && metadata.affectedUsers > 100) {
      severity = Math.min(5, severity + 1);
    }

    return severity;
  }

  /**
   * 分类归一化
   */
  private normalizeCategory(logEntry: any, errorType: string): string {
    // 基于错误类型的分类映射
    const categoryMap: Record<string, string> = {
      BLOCKING_ERROR: 'SYSTEM',
      BACKEND_SERVER_ERROR: 'BACKEND',
      BACKEND_CLIENT_ERROR: 'BACKEND',
      BACKEND_BUSINESS_ERROR: 'BUSINESS',
      KEY_FLOW_ERROR: 'BUSINESS',
      BUSINESS_PARAM_ERROR: 'BUSINESS',
      VEHICLE_SPEC_ERROR: 'BUSINESS',
      FRONTEND_NETWORK_ERROR: 'NETWORK',
      FRONTEND_TYPE_ERROR: 'FRONTEND',
      FRONTEND_REFERENCE_ERROR: 'FRONTEND',
      FRONTEND_JS_ERROR: 'FRONTEND',
      PAGE_UNLOAD_ERROR: 'FRONTEND',
      GENERIC_ERROR: 'SYSTEM',
      GENERIC_WARNING: 'SYSTEM',
      INFO_LOG: 'INFO',
    };

    return categoryMap[errorType] || 'UNKNOWN';
  }

  /**
   * 元数据归一化
   */
  private normalizeMetadata(metadata: any): any {
    const normalized = { ...metadata };

    // 标准化API端点
    if (normalized.apiEndpoint || normalized.endpoint || normalized.api) {
      normalized.apiEndpoint =
        normalized.apiEndpoint || normalized.endpoint || normalized.api;
      delete normalized.endpoint;
      delete normalized.api;
    }

    // 标准化返回码
    if (normalized.retCode || normalized.returnCode || normalized.code) {
      normalized.retCode =
        normalized.retCode || normalized.returnCode || normalized.code;
      delete normalized.returnCode;
      delete normalized.code;
    }

    // 标准化用户ID
    if (normalized.userId || normalized.uid || normalized.user_id) {
      normalized.userId =
        normalized.userId || normalized.uid || normalized.user_id;
      delete normalized.uid;
      delete normalized.user_id;
    }

    return normalized;
  }

  // ==================== 快速模式匹配方法 ====================

  private isBlockingPattern(message: string, metadata: any): boolean {
    const blockingKeywords = [
      'timeout',
      'connection failed',
      'service unavailable',
      'database error',
      'memory error',
      'disk full',
    ];

    return (
      blockingKeywords.some((keyword) =>
        message.toLowerCase().includes(keyword),
      ) || metadata?.retCode >= 500
    );
  }

  private isKeyFlowPattern(apiEndpoint?: string): boolean {
    if (!apiEndpoint) return false;

    const keyFlowApis = [
      '/api/orders',
      '/api/payment',
      '/api/cart',
      '/api/auth/login',
      '/api/user/register',
    ];

    return keyFlowApis.some((api) => apiEndpoint.includes(api));
  }

  private isBusinessParamPattern(message: string, metadata: any): boolean {
    return (
      message.includes('Invalid parameter') ||
      message.includes('Parameter validation') ||
      metadata?.inputParams !== undefined
    );
  }

  private isVehicleSpecPattern(metadata: any): boolean {
    return (
      metadata?.vehicleModel !== undefined ||
      metadata?.specifications !== undefined
    );
  }

  private isPageUnloadPattern(message: string, source: string): boolean {
    const unloadKeywords = ['unload', 'unmount', 'route change', 'navigation'];
    return (
      source === 'frontend' &&
      unloadKeywords.some((keyword) => message.toLowerCase().includes(keyword))
    );
  }

  /**
   * 批量归一化 - 优化性能
   */
  async normalizeBatch(logEntries: any[]): Promise<any[]> {
    this.logger.log(`开始批量归一化: ${logEntries.length} 条日志`);

    const startTime = Date.now();
    const results = await Promise.all(
      logEntries.map((entry) => this.normalizeLog(entry)),
    );

    const duration = Date.now() - startTime;
    this.logger.log(
      `批量归一化完成: 耗时 ${duration}ms, 平均 ${(duration / logEntries.length).toFixed(2)}ms/条`,
    );

    return results;
  }
}
