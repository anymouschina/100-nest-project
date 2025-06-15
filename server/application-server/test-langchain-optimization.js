const axios = require('axios');

// 测试LangChain优化功能
async function testLangChainOptimization() {
  console.log('🚀 开始测试LangChain消息优化功能...\n');

  const baseUrl = 'http://localhost:3000';
  
  // 测试数据 - 模拟一天的聊天记录（包含各种需要优化的情况）
  const testRequest = {
    groupName: '测试群聊',
    relativeTime: 'today',
    summaryType: 'daily'
  };

  try {
    console.log('📊 测试1: 普通LangChain总结');
    console.log('请求参数:', JSON.stringify(testRequest, null, 2));
    
    const response1 = await axios.post(`${baseUrl}/wechat-summary/langchain-summary`, testRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2分钟超时
    });

    console.log('✅ LangChain总结成功');
    console.log('响应数据:', JSON.stringify(response1.data, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');

    // 测试流式总结
    console.log('📊 测试2: LangChain流式总结');
    
    const response2 = await axios.post(`${baseUrl}/wechat-summary/langchain-summary-stream`, testRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000,
      responseType: 'stream'
    });

    console.log('✅ 开始接收流式数据...');
    
    let streamData = '';
    response2.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      streamData += chunkStr;
      process.stdout.write(chunkStr);
    });

    response2.data.on('end', () => {
      console.log('\n✅ 流式总结完成');
      console.log('\n' + '='.repeat(50) + '\n');
    });

    // 等待流式响应完成
    await new Promise((resolve) => {
      response2.data.on('end', resolve);
    });

    // 测试不同的分析类型
    console.log('📊 测试3: 情感分析');
    const sentimentRequest = {
      ...testRequest,
      summaryType: 'sentiment_analysis'
    };

    const response3 = await axios.post(`${baseUrl}/wechat-summary/langchain-summary`, sentimentRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });

    console.log('✅ 情感分析成功');
    console.log('响应数据:', JSON.stringify(response3.data, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');

    // 测试主题分析
    console.log('📊 测试4: 主题分析');
    const topicRequest = {
      ...testRequest,
      summaryType: 'topic'
    };

    const response4 = await axios.post(`${baseUrl}/wechat-summary/langchain-summary`, topicRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });

    console.log('✅ 主题分析成功');
    console.log('响应数据:', JSON.stringify(response4.data, null, 2));

    console.log('\n🎉 所有LangChain优化测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
      console.error('状态码:', error.response.status);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 请确保服务器在 http://localhost:3000 运行');
    }
  }
}

// 性能对比测试
async function performanceComparison() {
  console.log('\n⚡ 开始性能对比测试...\n');

  const baseUrl = 'http://localhost:3000';
  const testRequest = {
    groupName: '测试群聊',
    relativeTime: 'today',
    summaryType: 'daily'
  };

  try {
    // 测试原始方法
    console.log('📊 测试原始智能总结方法...');
    const startTime1 = Date.now();
    
    const response1 = await axios.post(`${baseUrl}/wechat-summary/smart-summary`, testRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });
    
    const endTime1 = Date.now();
    const duration1 = endTime1 - startTime1;
    
    console.log(`✅ 原始方法完成，耗时: ${duration1}ms`);
    console.log(`消息数量: ${response1.data.data?.messageCount || '未知'}`);

    // 测试LangChain优化方法
    console.log('\n📊 测试LangChain优化方法...');
    const startTime2 = Date.now();
    
    const response2 = await axios.post(`${baseUrl}/wechat-summary/langchain-summary`, testRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });
    
    const endTime2 = Date.now();
    const duration2 = endTime2 - startTime2;
    
    console.log(`✅ LangChain方法完成，耗时: ${duration2}ms`);
    console.log(`处理消息数量: ${response2.data.data?.messageCount || '未知'}`);

    // 性能对比
    console.log('\n📈 性能对比结果:');
    console.log(`原始方法耗时: ${duration1}ms`);
    console.log(`LangChain方法耗时: ${duration2}ms`);
    
    if (duration2 < duration1) {
      const improvement = ((duration1 - duration2) / duration1 * 100).toFixed(1);
      console.log(`🚀 LangChain方法快了 ${improvement}%`);
    } else {
      const slower = ((duration2 - duration1) / duration1 * 100).toFixed(1);
      console.log(`⚠️ LangChain方法慢了 ${slower}%`);
    }

  } catch (error) {
    console.error('❌ 性能测试失败:', error.message);
  }
}

// 运行测试
async function runAllTests() {
  await testLangChainOptimization();
  await performanceComparison();
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testLangChainOptimization,
  performanceComparison
}; 