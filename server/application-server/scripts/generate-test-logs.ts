import { writeFileSync } from 'fs';
import * as path from 'path';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  source: string;
  service: string;
  message: string;
  stackTrace?: string;
  metadata: Record<string, any>;
}

// 随机生成器辅助函数
const randomFrom = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)];
const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number): number =>
  Math.random() * (max - min) + min;
const randomBool = (): boolean => Math.random() > 0.5;

// 基础数据定义
const logLevels: LogEntry['level'][] = [
  'DEBUG',
  'INFO',
  'WARN',
  'ERROR',
  'FATAL',
];
const sources = [
  'frontend',
  'backend',
  'database',
  'cache',
  'message-queue',
  'scheduler',
  'gateway',
];
const services = [
  'user-service',
  'order-service',
  'payment-gateway',
  'inventory-service',
  'notification-service',
  'auth-service',
  'log-service',
  'file-service',
  'wechat-service',
  'mysql',
  'redis',
  'rabbitmq',
  'nginx',
  'api-gateway',
];

// 业务场景模板
const businessScenarios = {
  ORDER_CREATION: {
    messages: [
      '用户创建订单成功',
      '订单创建失败，库存不足',
      '订单创建超时',
      '订单数据验证失败',
      '创建订单时发生异常'
    ],
    errorCodes: ['ORDER_001', 'ORDER_002', 'ORDER_003', 'ORDER_TIMEOUT'],
    services: ['order-service', 'inventory-service', 'payment-gateway'],
  },
  PAYMENT_PROCESSING: {
    messages: [
      '支付请求处理中',
      '支付成功完成',
      '支付失败，余额不足',
      '第三方支付接口超时',
      '支付网关连接异常',
      '支付验证失败'
    ],
    errorCodes: ['PAY_001', 'PAY_TIMEOUT', 'PAY_INVALID', 'PAY_GATEWAY_ERROR'],
    services: ['payment-gateway', 'wechat-service', 'order-service']
  },
  USER_AUTHENTICATION: {
    messages: [
      '用户登录成功',
      '用户登录失败，密码错误',
      '用户token已过期',
      'JWT验证失败',
      '用户账户被锁定',
      '验证码错误'
    ],
    errorCodes: ['AUTH_001', 'AUTH_002', 'AUTH_TIMEOUT', 'AUTH_LOCKED'],
    services: ['auth-service', 'user-service', 'redis']
  },
  DATABASE_OPERATIONS: {
    messages: [
      '数据库查询完成',
      '数据库连接超时',
      'SQL执行异常',
      '数据库连接池耗尽',
      '事务回滚',
      '索引性能警告'
    ],
    errorCodes: ['DB_001', 'DB_TIMEOUT', 'DB_POOL_FULL', 'DB_TRANSACTION_FAIL'],
    services: ['mysql', 'database', 'order-service']
  },
  SYSTEM_PERFORMANCE: {
    messages: [
      '系统响应时间正常',
      'CPU使用率过高',
      '内存使用量超出阈值',
      '磁盘空间不足警告',
      '网络延迟异常',
      '服务健康检查失败'
    ],
    errorCodes: ['SYS_CPU_HIGH', 'SYS_MEM_HIGH', 'SYS_DISK_FULL', 'SYS_NET_SLOW'],
    services: ['api-gateway', 'nginx', 'scheduler']
  }
};

// 用户ID和会话ID池
const userIds = Array.from({length: 500}, (_, i) => `user-${String(i + 1).padStart(5, '0')}`);
const sessionIds = Array.from({length: 200}, (_, i) => `session-${Math.random().toString(36).substring(2, 15)}`);

// 生成栈跟踪信息
const generateStackTrace = (errorType: string): string => {
  const stackTraces = {
    TypeError: `TypeError: Cannot read property 'amount' of undefined
    at PaymentButton.onClick (payment.js:125:15)
    at HTMLButtonElement.<anonymous> (checkout.js:89:12)
    at HTMLDocument.addEventListener.click (main.js:456:8)`,
    
    NullPointerException: `java.lang.NullPointerException: Cannot invoke method on null object
    at com.order.service.OrderProcessor.processOrder(OrderProcessor.java:234)
    at com.order.controller.OrderController.createOrder(OrderController.java:89)
    at org.springframework.web.method.support.InvocableHandlerMethod.invoke(InvocableHandlerMethod.java:219)`,
    
    DatabaseException: `com.mysql.cj.jdbc.exceptions.CommunicationsException: Communications link failure
    at com.mysql.cj.jdbc.ConnectionImpl.createNewIO(ConnectionImpl.java:836)
    at com.mysql.cj.jdbc.ConnectionImpl.<init>(ConnectionImpl.java:456)
    at com.mysql.cj.jdbc.ConnectionImpl.getInstance(ConnectionImpl.java:246)`,
    
    NetworkException: `java.net.SocketTimeoutException: Read timed out
    at java.net.SocketInputStream.socketRead0(Native Method)
    at java.net.SocketInputStream.socketRead(SocketInputStream.java:116)
    at java.net.SocketInputStream.read(SocketInputStream.java:171)`
  };
  
  return stackTraces[errorType] || stackTraces.TypeError;
};

// 生成单条日志记录
const generateLogEntry = (index: number): LogEntry => {
  const scenario = randomFrom(Object.values(businessScenarios));
  const level = randomFrom(logLevels);
  const source = randomFrom(sources);
  const service = randomFrom(scenario.services);
  const message = randomFrom(scenario.messages);
  
  // 生成时间戳（最近30天内的随机时间）
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const randomTime = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
  
  const logEntry: LogEntry = {
    id: `log-${String(index + 1).padStart(6, '0')}`,
    timestamp: randomTime.toISOString(),
    level,
    source,
    service,
    message,
    metadata: {
      userId: randomFrom(userIds),
      sessionId: randomFrom(sessionIds),
      trace_id: `TRC-${randomTime.toISOString().split('T')[0].replace(/-/g, '')}-${randomInt(100000, 999999)}`,
      apiEndpoint: randomFrom([
        '/api/orders/create', '/api/users/login', '/api/payment/process',
        '/api/products/search', '/api/carts/add', '/api/users/profile',
        '/api/orders/history', '/api/payment/callback', '/api/inventory/check'
      ]),
      responseTime: randomInt(50, 5000),
      retCode: level === 'ERROR' || level === 'FATAL' ? randomInt(40001, 50003) : 
               level === 'WARN' ? randomInt(20001, 30001) : 200,
      httpStatus: level === 'ERROR' || level === 'FATAL' ? randomFrom([400, 401, 403, 404, 500, 502, 503]) : 
                  level === 'WARN' ? randomFrom([200, 201, 202]) : 200
    }
  };

  // 根据不同场景添加特定的元数据
  if (scenario === businessScenarios.ORDER_CREATION) {
    logEntry.metadata = {
      ...logEntry.metadata,
      orderId: `ORDER-${randomTime.toISOString().split('T')[0].replace(/-/g, '')}-${randomInt(1000, 9999)}`,
      productId: `product-${randomInt(1, 500)}`,
      quantity: randomInt(1, 10),
      totalAmount: randomFloat(10, 999),
      error_code: randomFrom(scenario.errorCodes),
      error_type: 'business_logic_error',
      cause: randomFrom(['库存不足', '商品已下架', '价格变动', '优惠券失效'])
    };
  } else if (scenario === businessScenarios.PAYMENT_PROCESSING) {
    logEntry.metadata = {
      ...logEntry.metadata,
      paymentMethod: randomFrom(['wechat_pay', 'alipay', 'credit_card', 'bank_transfer']),
      amount: randomFloat(1, 999),
      orderId: `ORDER-${randomTime.toISOString().split('T')[0].replace(/-/g, '')}-${randomInt(1000, 9999)}`,
      error_code: randomFrom(scenario.errorCodes),
      transactionId: `TXN-${Math.random().toString(36).substring(2, 15).toUpperCase()}`
    };
  } else if (scenario === businessScenarios.USER_AUTHENTICATION) {
    logEntry.metadata = {
      ...logEntry.metadata,
      loginType: randomFrom(['password', 'wechat', 'phone_code', 'fingerprint']),
      deviceId: `device-${Math.random().toString(36).substring(2, 15)}`,
      ipAddress: `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      userAgent: randomFrom([
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Android 12; Mobile; rv:94.0) Gecko/94.0 Firefox/94.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'
      ]),
      error_code: randomFrom(scenario.errorCodes)
    };
  } else if (scenario === businessScenarios.DATABASE_OPERATIONS) {
    logEntry.metadata = {
      ...logEntry.metadata,
      queryType: randomFrom(['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
      tableName: randomFrom(['users', 'orders', 'products', 'payments', 'inventory']),
      executionTime: randomInt(10, 3000),
      rowsAffected: randomInt(0, 1000),
      connectionPool: {
        active: randomInt(5, 50),
        idle: randomInt(0, 20),
        max: 50
      },
      error_code: randomFrom(scenario.errorCodes)
    };
  } else if (scenario === businessScenarios.SYSTEM_PERFORMANCE) {
    logEntry.metadata = {
      ...logEntry.metadata,
      cpuUsage: randomFloat(0, 100),
      memoryUsage: randomFloat(0, 100),
      diskUsage: randomFloat(0, 100),
      networkLatency: randomInt(10, 500),
      activeConnections: randomInt(10, 200),
      queueLength: randomInt(0, 50),
      error_code: randomFrom(scenario.errorCodes)
    };
  }

  // 为错误级别的日志添加栈跟踪
  if (level === 'ERROR' || level === 'FATAL') {
    if (randomBool()) {
      logEntry.stackTrace = generateStackTrace(randomFrom(['TypeError', 'NullPointerException', 'DatabaseException', 'NetworkException']));
    }
  }

  // 添加一些随机的附加字段
  if (randomBool()) {
    logEntry.metadata.region = randomFrom(['cn-north-1', 'cn-east-1', 'cn-south-1']);
  }
  
  if (randomBool()) {
    logEntry.metadata.version = randomFrom(['v1.0.0', 'v1.1.0', 'v1.2.0', 'v2.0.0']);
  }

  if (randomBool()) {
    logEntry.metadata.tags = randomFrom([
      ['payment', 'critical'],
      ['user', 'auth'],
      ['performance', 'monitoring'],
      ['database', 'optimization'],
      ['api', 'gateway']
    ]);
  }

  return logEntry;
};

// 生成1000条日志数据
const generateTestLogs = (): LogEntry[] => {
  console.log('🚀 开始生成1000条半结构化测试日志数据...');
  
  const logs: LogEntry[] = [];
  
  for (let i = 0; i < 1000; i++) {
    logs.push(generateLogEntry(i));
    
    // 显示进度
    if ((i + 1) % 100 === 0) {
      console.log(`📊 已生成 ${i + 1}/1000 条日志数据`);
    }
  }
  
  return logs;
};

// 生成不同格式的测试数据
const generateDifferentFormats = (logs: LogEntry[]) => {
  console.log('📦 生成不同格式的测试数据...');
  
  // 格式1: 完整结构化对象数组
  const structuredLogs = logs;
  
  // 格式2: 字符串数组（半结构化）
  const stringLogs = logs.map(log => {
    const timeStr = log.timestamp.split('T')[1].split('.')[0];
    const basicInfo = `${timeStr} ${log.level} [${log.service}] ${log.message}`;
    
    // 随机决定是否添加额外信息
    if (Math.random() > 0.7) {
      return `${basicInfo} | userId=${log.metadata.userId} | trace=${log.metadata.trace_id}`;
    } else if (Math.random() > 0.5) {
      return `${basicInfo} | endpoint=${log.metadata.apiEndpoint} | responseTime=${log.metadata.responseTime}ms`;
    }
    
    return basicInfo;
  });
  
  // 格式3: 混合格式（部分结构化，部分字符串）
  const mixedLogs = logs.map((log, index) => {
    if (index % 3 === 0) {
      // 返回完整结构化对象
      return log;
    } else if (index % 3 === 1) {
      // 返回简化的结构化对象
      return {
        timestamp: log.timestamp,
        level: log.level,
        source: log.source,
        message: log.message,
        userId: log.metadata.userId,
        responseTime: log.metadata.responseTime
      };
    } else {
      // 返回字符串格式
      return `${log.timestamp} ${log.level} [${log.service}] ${log.message}`;
    }
  });
  
  return {
    structured: structuredLogs,
    strings: stringLogs,
    mixed: mixedLogs
  };
};

// 生成测试用例
const generateTestCases = (logs: LogEntry[]) => {
  console.log('🧪 生成测试用例...');
  
  const testCases = [
    {
      name: '支付系统故障分析',
      userFeedback: '用户反馈支付功能异常，多笔订单支付失败，请帮我分析原因',
      logData: logs.filter(log => 
        log.service.includes('payment') || 
        log.message.includes('支付') ||
        log.metadata.error_code?.includes('PAY')
      ).slice(0, 50)
    },
    {
      name: '数据库性能问题诊断',
      userFeedback: '系统响应变慢，怀疑是数据库性能问题，需要详细分析',
      logData: logs.filter(log => 
        log.source === 'database' || 
        log.service === 'mysql' ||
        log.message.includes('数据库') ||
        log.metadata.responseTime > 2000
      ).slice(0, 60)
    },
    {
      name: '用户认证异常排查',
      userFeedback: '多个用户反馈无法登录，登录成功率下降明显',
      logData: logs.filter(log => 
        log.service === 'auth-service' ||
        log.message.includes('登录') ||
        log.message.includes('验证') ||
        log.metadata.error_code?.includes('AUTH')
      ).slice(0, 40)
    },
    {
      name: '系统整体健康状况评估',
      userFeedback: '需要全面了解系统当前运行状况，识别潜在风险',
      logData: logs.slice(0, 100)
    },
    {
      name: '订单处理流程问题分析',
      userFeedback: '订单创建成功率下降，用户投诉增多，请帮忙排查问题',
      logData: logs.filter(log => 
        log.service === 'order-service' ||
        log.message.includes('订单') ||
        log.metadata.orderId
      ).slice(0, 45)
    }
  ];
  
  return testCases;
};

// 主函数
const main = () => {
  try {
    console.log('🎯 开始生成AI日志分析测试数据');
    console.log('===================================');
    
    // 生成基础日志数据
    const logs = generateTestLogs();
    
    // 生成不同格式的数据
    const formattedData = generateDifferentFormats(logs);
    
    // 生成测试用例
    const testCases = generateTestCases(logs);
    
    // 创建输出目录
    const outputDir = path.join(__dirname, '../test-data');
    
    // 保存数据到文件
    console.log('💾 保存测试数据到文件...');
    
    // 1. 完整的结构化日志数据
    writeFileSync(
      path.join(outputDir, 'structured-logs.json'),
      JSON.stringify(formattedData.structured, null, 2),
      'utf8'
    );
    
    // 2. 字符串格式日志数据
    writeFileSync(
      path.join(outputDir, 'string-logs.json'),
      JSON.stringify(formattedData.strings, null, 2),
      'utf8'
    );
    
    // 3. 混合格式日志数据
    writeFileSync(
      path.join(outputDir, 'mixed-logs.json'),
      JSON.stringify(formattedData.mixed, null, 2),
      'utf8'
    );
    
    // 4. 测试用例
    writeFileSync(
      path.join(outputDir, 'test-cases.json'),
      JSON.stringify(testCases, null, 2),
      'utf8'
    );
    
    // 5. 数据统计报告
    const stats = {
      总日志条数: logs.length,
      日志级别分布: {
        DEBUG: logs.filter(l => l.level === 'DEBUG').length,
        INFO: logs.filter(l => l.level === 'INFO').length,
        WARN: logs.filter(l => l.level === 'WARN').length,
        ERROR: logs.filter(l => l.level === 'ERROR').length,
        FATAL: logs.filter(l => l.level === 'FATAL').length,
      },
      服务分布: services.reduce((acc, service) => {
        acc[service] = logs.filter(l => l.service === service).length;
        return acc;
      }, {} as Record<string, number>),
      时间范围: {
        最早时间: Math.min(...logs.map(l => new Date(l.timestamp).getTime())),
        最晚时间: Math.max(...logs.map(l => new Date(l.timestamp).getTime())),
      },
      测试用例数量: testCases.length,
      生成时间: new Date().toISOString()
    };
    
    writeFileSync(
      path.join(outputDir, 'data-statistics.json'),
      JSON.stringify(stats, null, 2),
      'utf8'
    );
    
    console.log('✅ 测试数据生成完成！');
    console.log('📁 输出文件：');
    console.log(`   - structured-logs.json (${formattedData.structured.length}条结构化日志)`);
    console.log(`   - string-logs.json (${formattedData.strings.length}条字符串日志)`);
    console.log(`   - mixed-logs.json (${formattedData.mixed.length}条混合格式日志)`);
    console.log(`   - test-cases.json (${testCases.length}个测试用例)`);
    console.log(`   - data-statistics.json (数据统计报告)`);
    console.log('\n🚀 现在可以使用这些数据测试AI日志分析功能了！');
    
  } catch (error) {
    console.error('❌ 生成测试数据时发生错误:', error);
    process.exit(1);
  }
};

// 执行脚本
if (require.main === module) {
  main();
}

export { generateTestLogs, generateDifferentFormats, generateTestCases }; 