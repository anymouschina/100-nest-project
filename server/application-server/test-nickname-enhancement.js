#!/usr/bin/env node

/**
 * 测试昵称增强功能
 * 验证微信聊天记录分析中的昵称显示功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 测试配置
const TEST_CONFIG = {
  groupName: 'VIP#独开+副业+自媒体| 陈随易',
  specificDate: '2025-06-15',
  summaryType: 'daily'
};

/**
 * 测试基础聊天数据获取（带昵称）
 */
async function testGetChatDataWithNicknames() {
  console.log('\n🧪 测试1: 获取聊天数据（带昵称信息）');
  console.log('=' .repeat(50));
  
  try {
    const response = await axios.post(`${BASE_URL}/wechat-summary/chat-data`, {
      groupName: TEST_CONFIG.groupName,
      specificDate: TEST_CONFIG.specificDate
    });

    if (response.data.success && response.data.data) {
      const messages = response.data.data;
      console.log(`✅ 成功获取 ${messages.length} 条消息`);
      
      // 显示前3条消息的昵称信息
      console.log('\n📝 消息示例（前3条）:');
      messages.slice(0, 3).forEach((msg, index) => {
        console.log(`${index + 1}. 时间: ${msg.time}`);
        console.log(`   发送者: ${msg.sender}`);
        console.log(`   微信ID: ${msg.senderId}`);
        console.log(`   昵称: ${msg.nickname}`);
        console.log(`   内容: ${msg.content.substring(0, 50)}...`);
        console.log('');
      });

      // 统计昵称映射情况
      const nicknameStats = analyzeNicknameMapping(messages);
      console.log('📊 昵称映射统计:');
      console.log(`   总消息数: ${nicknameStats.totalMessages}`);
      console.log(`   唯一发送者: ${nicknameStats.uniqueSenders}`);
      console.log(`   有昵称映射: ${nicknameStats.withNicknames}`);
      console.log(`   仅微信ID: ${nicknameStats.onlyWxid}`);
      console.log(`   映射成功率: ${(nicknameStats.withNicknames / nicknameStats.uniqueSenders * 100).toFixed(1)}%`);

    } else {
      console.log('❌ 获取聊天数据失败:', response.data.error);
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }
}

/**
 * 测试流式总结（带昵称）
 */
async function testStreamSummaryWithNicknames() {
  console.log('\n🧪 测试2: 流式总结（带昵称显示）');
  console.log('=' .repeat(50));
  
  try {
    const response = await axios.post(
      `${BASE_URL}/wechat-summary/langchain-summary-stream`,
      TEST_CONFIG,
      {
        responseType: 'stream',
        timeout: 60000
      }
    );

    console.log('🔄 开始接收流式数据...\n');
    
    let fullContent = '';
    let summaryResult = null;

    response.data.on('data', (chunk) => {
      const content = chunk.toString();
      fullContent += content;
      process.stdout.write(content);
    });

    response.data.on('end', () => {
      console.log('\n\n✅ 流式总结完成');
      
      // 尝试解析最终的JSON结果
      try {
        const jsonMatch = fullContent.match(/\{[\s\S]*\}$/);
        if (jsonMatch) {
          summaryResult = JSON.parse(jsonMatch[0]);
          console.log('\n📊 总结结果分析:');
          console.log(`   参与者数量: ${summaryResult.participants?.length || 0}`);
          console.log(`   主要参与者: ${summaryResult.participants?.slice(0, 5).join(', ') || '无'}`);
          console.log(`   话题数量: ${summaryResult.topics?.length || 0}`);
          
          // 检查参与者是否显示为昵称而非微信ID
          if (summaryResult.participants) {
            const wxidPattern = /^wxid_[a-zA-Z0-9]+$/;
            const wxidCount = summaryResult.participants.filter(p => wxidPattern.test(p)).length;
            const nicknameCount = summaryResult.participants.length - wxidCount;
            
            console.log(`   昵称显示: ${nicknameCount}/${summaryResult.participants.length} (${(nicknameCount/summaryResult.participants.length*100).toFixed(1)}%)`);
            console.log(`   微信ID显示: ${wxidCount}/${summaryResult.participants.length} (${(wxidCount/summaryResult.participants.length*100).toFixed(1)}%)`);
          }
        }
      } catch (parseError) {
        console.log('⚠️  无法解析最终JSON结果');
      }
    });

    response.data.on('error', (error) => {
      console.log('\n❌ 流式数据接收错误:', error.message);
    });

    // 等待流式传输完成
    await new Promise((resolve, reject) => {
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });

  } catch (error) {
    console.log('❌ 流式总结请求失败:', error.message);
  }
}

/**
 * 测试昵称缓存统计
 */
async function testNicknameCacheStats() {
  console.log('\n🧪 测试3: 昵称缓存统计');
  console.log('=' .repeat(50));
  
  try {
    // 这里需要添加一个API端点来获取昵称缓存统计
    // 暂时跳过，因为还没有实现这个端点
    console.log('⚠️  昵称缓存统计API尚未实现');
    console.log('   建议添加 GET /wechat-summary/nickname-stats 端点');
  } catch (error) {
    console.log('❌ 获取昵称缓存统计失败:', error.message);
  }
}

/**
 * 分析昵称映射情况
 */
function analyzeNicknameMapping(messages) {
  const senderMap = new Map();
  
  messages.forEach(msg => {
    if (!senderMap.has(msg.senderId)) {
      senderMap.set(msg.senderId, {
        sender: msg.sender,
        nickname: msg.nickname,
        senderId: msg.senderId,
        messageCount: 0
      });
    }
    senderMap.get(msg.senderId).messageCount++;
  });

  const senders = Array.from(senderMap.values());
  const wxidPattern = /^wxid_[a-zA-Z0-9]+$/;
  
  return {
    totalMessages: messages.length,
    uniqueSenders: senders.length,
    withNicknames: senders.filter(s => s.nickname !== s.senderId && !wxidPattern.test(s.nickname)).length,
    onlyWxid: senders.filter(s => s.nickname === s.senderId || wxidPattern.test(s.nickname)).length,
    senderDetails: senders.sort((a, b) => b.messageCount - a.messageCount)
  };
}

/**
 * 显示发送者详情
 */
function displaySenderDetails(senderDetails) {
  console.log('\n👥 发送者详情（按消息数量排序）:');
  senderDetails.slice(0, 10).forEach((sender, index) => {
    const isNickname = sender.nickname !== sender.senderId;
    const status = isNickname ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${sender.nickname} (${sender.senderId}) - ${sender.messageCount}条消息`);
  });
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始测试昵称增强功能');
  console.log(`📍 服务器地址: ${BASE_URL}`);
  console.log(`📅 测试群聊: ${TEST_CONFIG.groupName}`);
  console.log(`📅 测试日期: ${TEST_CONFIG.specificDate}`);
  
  try {
    // 测试1: 获取聊天数据（带昵称）
    await testGetChatDataWithNicknames();
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试2: 流式总结（带昵称）
    await testStreamSummaryWithNicknames();
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试3: 昵称缓存统计
    await testNicknameCacheStats();
    
    console.log('\n🎉 所有测试完成！');
    console.log('\n💡 改进建议:');
    console.log('1. 如果昵称映射成功率较低，检查Chatlog API返回的联系人数据');
    console.log('2. 考虑添加手动昵称映射功能');
    console.log('3. 实现昵称缓存统计API端点');
    console.log('4. 添加昵称更新和管理功能');
    
  } catch (error) {
    console.log('\n❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testGetChatDataWithNicknames,
  testStreamSummaryWithNicknames,
  analyzeNicknameMapping
}; 