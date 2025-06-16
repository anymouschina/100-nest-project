const axios = require('axios');

// 测试增强版LangChain功能
async function testEnhancedLangChain() {
  console.log('🚀 开始测试增强版LangChain功能...\n');

  const baseUrl = 'http://localhost:3001';
  
  // 测试数据
  const testRequest = {
    groupName: 'VIP#独开+副业+自媒体| 陈随易',
    specificDate: '2025-01-15',
    summaryType: 'daily',
    useInfiniteContext: true,
    contextWindowType: 'hybrid',
    maxContextTokens: 16000,
    useKnowledgeBase: true,
    knowledgeNamespaces: ['summaries', 'chat_history', 'topics']
  };

  try {
    console.log('📊 测试1: 增强版智能总结');
    console.log('请求参数:', JSON.stringify(testRequest, null, 2));
    
    const response1 = await axios.post(`${baseUrl}/wechat-summary/enhanced-summary`, testRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 180000 // 3分钟超时
    });

    console.log('✅ 增强版总结成功');
    console.log('响应数据:', JSON.stringify(response1.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // 测试流式总结
    console.log('📊 测试2: 增强版流式总结');
    
    const response2 = await axios.post(`${baseUrl}/wechat-summary/enhanced-summary-stream`, testRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 180000,
      responseType: 'stream'
    });

    console.log('✅ 开始接收增强版流式数据...');
    
    let streamData = '';
    response2.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      streamData += chunkStr;
      process.stdout.write(chunkStr);
    });

    response2.data.on('end', () => {
      console.log('\n✅ 增强版流式总结完成');
      console.log('\n' + '='.repeat(80) + '\n');
    });

    // 等待流式响应完成
    await new Promise((resolve) => {
      response2.data.on('end', resolve);
    });

    // 测试向量搜索
    console.log('📊 测试3: 向量语义搜索');
    const vectorSearchRequest = {
      query: '今天讨论了什么重要话题',
      groupName: 'VIP#独开+副业+自媒体| 陈随易',
      limit: 5,
      threshold: 0.7
    };

    const response3 = await axios.post(`${baseUrl}/wechat-summary/vector-search`, vectorSearchRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    console.log('✅ 向量搜索成功');
    console.log('搜索结果:', JSON.stringify(response3.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // 测试知识库搜索
    console.log('📊 测试4: 知识库搜索');
    const knowledgeSearchRequest = {
      query: '群聊分析 总结',
      namespace: 'summaries',
      limit: 3,
      threshold: 0.75
    };

    const response4 = await axios.post(`${baseUrl}/wechat-summary/knowledge-search`, knowledgeSearchRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    console.log('✅ 知识库搜索成功');
    console.log('搜索结果:', JSON.stringify(response4.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // 测试上下文窗口构建
    console.log('📊 测试5: 构建无限上下文窗口');
    const contextRequest = {
      query: '今天的主要讨论内容',
      groupName: 'VIP#独开+副业+自媒体| 陈随易',
      maxTokens: 8000,
      windowType: 'hybrid'
    };

    const response5 = await axios.post(`${baseUrl}/wechat-summary/build-context`, contextRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    console.log('✅ 上下文窗口构建成功');
    console.log('上下文信息:', {
      messageCount: response5.data.data.messages.length,
      tokenCount: response5.data.data.tokenCount,
      relevanceScore: response5.data.data.relevanceScore,
      contentPreview: response5.data.data.content.substring(0, 200) + '...'
    });
    console.log('\n' + '='.repeat(80) + '\n');

    // 测试不同的分析类型
    console.log('📊 测试6: 情感分析（增强版）');
    const sentimentRequest = {
      ...testRequest,
      summaryType: 'sentiment_analysis',
      customPrompt: '重点分析群聊中的情感倾向和氛围变化'
    };

    const response6 = await axios.post(`${baseUrl}/wechat-summary/enhanced-summary`, sentimentRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 180000
    });

    console.log('✅ 情感分析成功');
    console.log('分析结果:', JSON.stringify(response6.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // 测试时间线分析
    console.log('📊 测试7: 时间线分析（增强版）');
    const timelineRequest = {
      ...testRequest,
      summaryType: 'timeline',
      customPrompt: '按时间线分析今日群聊，展示话题演进过程'
    };

    const response7 = await axios.post(`${baseUrl}/wechat-summary/enhanced-summary`, timelineRequest, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 180000
    });

    console.log('✅ 时间线分析成功');
    console.log('分析结果:', JSON.stringify(response7.data, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    console.log('🎉 所有增强版LangChain测试完成！');
    
    // 性能统计
    console.log('\n📈 功能特性总结:');
    console.log('• ✅ pgvector向量数据库集成');
    console.log('• ✅ 无限上下文窗口 (最大16K tokens)');
    console.log('• ✅ 语义搜索和相似性匹配');
    console.log('• ✅ 向量知识库存储和检索');
    console.log('• ✅ 混合上下文窗口 (语义+时间)');
    console.log('• ✅ 流式处理和实时反馈');
    console.log('• ✅ 多维度分析支持');
    console.log('• ✅ 历史知识整合');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 请确保服务器正在运行在端口3001');
    }
  }
}

// 运行测试
testEnhancedLangChain(); 