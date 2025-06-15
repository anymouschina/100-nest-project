const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testWechatSummaryAPI() {
  console.log('🧪 开始测试微信聊天总结API...\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await axios.get(`${BASE_URL}/wechat-summary/health`);
    console.log('✅ 健康检查成功:', healthResponse.data);
    console.log('');

    // 2. 测试获取群聊列表（默认JSON格式）
    console.log('2. 测试获取群聊列表（默认JSON格式）...');
    try {
      const groupsResponse = await axios.get(`${BASE_URL}/wechat-summary/groups`);
      console.log('✅ 群聊列表获取成功:', groupsResponse.data);
    } catch (error) {
      console.log('⚠️  群聊列表获取失败 (可能Chatlog服务未运行):', error.response?.data || error.message);
    }
    console.log('');

    // 2.1 测试获取群聊列表（指定JSON格式和关键词）
    console.log('2.1 测试获取群聊列表（指定JSON格式和关键词）...');
    try {
      const groupsWithKeywordResponse = await axios.get(`${BASE_URL}/wechat-summary/groups?keyword=+&format=json`);
      console.log('✅ 带关键词的群聊列表获取成功:', groupsWithKeywordResponse.data);
    } catch (error) {
      console.log('⚠️  带关键词的群聊列表获取失败:', error.response?.data || error.message);
    }
    console.log('');

    // 3. 测试智能总结
    console.log('3. 测试智能总结...');
    try {
      const smartSummaryResponse = await axios.post(`${BASE_URL}/wechat-summary/smart-summary`, {
        groupName: '测试群',
        relativeTime: 'today',
        summaryType: 'daily'
      });
      console.log('✅ 智能总结成功:', smartSummaryResponse.data);
    } catch (error) {
      console.log('⚠️  智能总结失败 (可能服务未配置):', error.response?.data || error.message);
    }
    console.log('');

    // 4. 测试普通总结
    console.log('4. 测试普通总结...');
    try {
      const summaryResponse = await axios.post(`${BASE_URL}/wechat-summary/summarize`, {
        groupName: '测试群',
        timeRange: '2024-01-15',
        summaryType: 'daily'
      });
      console.log('✅ 普通总结成功:', summaryResponse.data);
    } catch (error) {
      console.log('⚠️  普通总结失败 (可能服务未配置):', error.response?.data || error.message);
    }
    console.log('');

    // 5. 测试批量分析
    console.log('5. 测试批量分析...');
    try {
      const batchResponse = await axios.post(`${BASE_URL}/wechat-summary/batch-analysis`, {
        groupNames: ['测试群1', '测试群2'],
        timeRange: '2024-01-15',
        analysisType: 'daily'
      });
      console.log('✅ 批量分析成功:', batchResponse.data);
    } catch (error) {
      console.log('⚠️  批量分析失败 (可能服务未配置):', error.response?.data || error.message);
    }
    console.log('');

    // 6. 测试对比分析
    console.log('6. 测试对比分析...');
    try {
      const comparisonResponse = await axios.post(`${BASE_URL}/wechat-summary/comparison-analysis`, {
        groupA: '测试群A',
        groupB: '测试群B',
        timeRange: '2024-01-15',
        comparisonDimension: 'activity'
      });
      console.log('✅ 对比分析成功:', comparisonResponse.data);
    } catch (error) {
      console.log('⚠️  对比分析失败 (可能服务未配置):', error.response?.data || error.message);
    }
    console.log('');

    console.log('🎉 API测试完成！');
    console.log('\n📝 注意事项:');
    console.log('1. 确保Chatlog HTTP服务正在运行 (http://localhost:5030)');
    console.log('2. 确保Ollama服务正在运行并已下载模型');
    console.log('3. 确保已正确配置环境变量:');
    console.log('   - CHATLOG_BASE_URL=http://localhost:5030');
    console.log('   - OLLAMA_BASE_URL=http://localhost:11434');
    console.log('   - OLLAMA_MODEL=qwen3');
    console.log('4. 群聊列表查询现在默认使用JSON格式，支持keyword="+"获取所有群聊');
    console.log('5. 如果测试失败，请检查服务状态和配置');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testWechatSummaryAPI(); 