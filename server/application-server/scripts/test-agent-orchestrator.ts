#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { LogAnalysisModule } from '../src/log-analysis/log-analysis.module';
import { AgentOrchestratorService } from '../src/log-analysis/services/agent-orchestrator.service';

async function testAgentOrchestrator() {
  console.log('🚀 开始测试Agent编排器...\n');

  try {
    // 创建应用上下文
    const app = await NestFactory.createApplicationContext(LogAnalysisModule);
    const orchestrator = app.get(AgentOrchestratorService);

    // 准备测试数据
    const testLogData = [
      {
        id: 'log-1',
        timestamp: new Date(),
        level: 'ERROR',
        source: 'backend',
        message: 'Database connection timeout',
        metadata: {
          userId: 'user-123',
          sessionId: 'session-456',
          endpoint: '/api/user/profile',
          responseTime: 5000,
          retCode: 500,
        },
      },
      {
        id: 'log-2',
        timestamp: new Date(),
        level: 'WARN',
        source: 'frontend',
        message: 'Network request failed',
        metadata: {
          userId: 'user-123',
          sessionId: 'session-456',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
        },
      },
      {
        id: 'log-3',
        timestamp: new Date(),
        level: 'INFO',
        source: 'backend',
        message: 'User login successful',
        metadata: {
          userId: 'user-456',
          sessionId: 'session-789',
          endpoint: '/api/auth/login',
          responseTime: 200,
          retCode: 0,
        },
      },
    ];

    console.log('📋 测试数据准备完成，包含 3 条日志记录\n');

    // 测试1: 检查代理注册状态
    console.log('🔍 测试1: 检查代理注册状态');
    const registeredAgents = orchestrator.getRegisteredAgents();
    console.log(`✅ 已注册代理数量: ${registeredAgents.length}`);
    registeredAgents.forEach(agent => {
      console.log(`   - ${agent.name} v${agent.version} (${agent.capabilities.join(', ')})`);
    });
    console.log('');

    // 测试2: 健康检查
    console.log('🏥 测试2: 代理健康检查');
    for (const agent of registeredAgents) {
      const isHealthy = await orchestrator.checkAgentHealth(agent.name);
      console.log(`   ${isHealthy ? '✅' : '❌'} ${agent.name}: ${isHealthy ? '健康' : '异常'}`);
    }
    console.log('');

    // 测试3: 顺序执行管道
    console.log('🔄 测试3: 顺序执行管道');
    const sequentialTask = {
      id: 'task-sequential-' + Date.now(),
      type: 'COMPREHENSIVE_ANALYSIS',
      priority: 'HIGH',
      logData: testLogData,
      userContext: { userId: 'test-user', source: 'test' },
    };

    const sequentialResult = await orchestrator.orchestrateAnalysis(
      sequentialTask,
      'SEQUENTIAL'
    );

    console.log(`✅ 顺序执行完成: ${sequentialResult.success ? '成功' : '失败'}`);
    console.log(`   处理时间: ${sequentialResult.totalProcessingTime}ms`);
    console.log(`   参与代理: ${sequentialResult.agentResults?.length || 0} 个`);
    console.log('   代理执行结果:');
    sequentialResult.agentResults?.forEach(result => {
      console.log(`     - ${result.agentName}: ${result.success ? '✅' : '❌'} (${result.processingTime}ms, 置信度: ${result.confidence})`);
    });
    console.log('');

    // 测试4: 并行执行管道
    console.log('⚡ 测试4: 并行执行管道');
    const parallelTask = {
      id: 'task-parallel-' + Date.now(),
      type: 'COMPREHENSIVE_ANALYSIS',
      priority: 'MEDIUM',
      logData: testLogData,
      userContext: { userId: 'test-user', source: 'test' },
    };

    const parallelResult = await orchestrator.orchestrateAnalysis(
      parallelTask,
      'PARALLEL'
    );

    console.log(`✅ 并行执行完成: ${parallelResult.success ? '成功' : '失败'}`);
    console.log(`   处理时间: ${parallelResult.totalProcessingTime}ms`);
    console.log(`   参与代理: ${parallelResult.agentResults?.length || 0} 个`);
    console.log('   代理执行结果:');
    parallelResult.agentResults?.forEach(result => {
      console.log(`     - ${result.agentName}: ${result.success ? '✅' : '❌'} (${result.processingTime}ms, 置信度: ${result.confidence})`);
    });
    console.log('');

    // 测试5: 条件执行管道
    console.log('🎯 测试5: 条件执行管道');
    const conditionalTask = {
      id: 'task-conditional-' + Date.now(),
      type: 'ERROR_FOCUSED_ANALYSIS',
      priority: 'HIGH',
      logData: testLogData.filter(log => log.level === 'ERROR'), // 只处理错误日志
      userContext: { userId: 'test-user', source: 'test' },
    };

    const conditionalResult = await orchestrator.orchestrateAnalysis(
      conditionalTask,
      'CONDITIONAL'
    );

    console.log(`✅ 条件执行完成: ${conditionalResult.success ? '成功' : '失败'}`);
    console.log(`   处理时间: ${conditionalResult.totalProcessingTime}ms`);
    console.log(`   参与代理: ${conditionalResult.agentResults?.length || 0} 个`);
    console.log('   代理执行结果:');
    conditionalResult.agentResults?.forEach(result => {
      console.log(`     - ${result.agentName}: ${result.success ? '✅' : '❌'} (${result.processingTime}ms, 置信度: ${result.confidence})`);
    });
    console.log('');

    // 测试6: 任务状态查询
    console.log('📊 测试6: 任务状态查询');
    const taskStatus = orchestrator.getTaskStatus(sequentialTask.id);
    if (taskStatus) {
      console.log(`✅ 任务状态: ${taskStatus.status}`);
      console.log(`   开始时间: ${taskStatus.startTime}`);
      console.log(`   结束时间: ${taskStatus.endTime || '进行中'}`);
      console.log(`   进度: ${taskStatus.progress}%`);
    } else {
      console.log('❌ 未找到任务状态');
    }
    console.log('');

    // 测试7: 性能统计
    console.log('📈 测试7: 性能统计');
    const stats = orchestrator.getPerformanceStats();
    console.log(`✅ 性能统计:`);
    console.log(`   总任务数: ${stats.totalTasks}`);
    console.log(`   成功任务: ${stats.successfulTasks}`);
    console.log(`   失败任务: ${stats.failedTasks}`);
    console.log(`   成功率: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`   平均处理时间: ${stats.averageProcessingTime}ms`);
    console.log('');

    console.log('🎉 所有测试完成！Agent编排器功能正常。\n');

    // 关闭应用
    await app.close();

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testAgentOrchestrator().catch(console.error);
}

export { testAgentOrchestrator }; 