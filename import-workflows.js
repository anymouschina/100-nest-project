const fs = require('fs');
const path = require('path');
const axios = require('axios');

// FastGPT配置
const FASTGPT_API_URL = 'http://localhost:3000';
const KNOWLEDGE_BASE_ID = '6883a2777a974555ab861fe5';
const API_KEY = 'fastgpt-iDOD4SsyD7lopobsBFP2Bdfa9PpPt6O9s32HuUS0DgbPhl9mqd83KUdMunwte5';

// 工作流目录
const WORKFLOWS_DIR = '/Users/libiqiang/Documents/workspace/100-nest-project/server/workflows';

class WorkflowImporter {
  constructor() {
    this.imported = 0;
    this.failed = 0;
    this.total = 0;
  }

  async startImport() {
    console.log('🚀 开始导入工作流到知识库...');
    console.log(`📁 工作流目录: ${WORKFLOWS_DIR}`);
    console.log(`📚 知识库ID: ${KNOWLEDGE_BASE_ID}`);

    try {
      // 获取所有工作流文件
      const workflowFiles = this.getWorkflowFiles(WORKFLOWS_DIR);
      this.total = workflowFiles.length;
      console.log(`📊 发现 ${this.total} 个工作流文件`);

      if (this.total === 0) {
        console.log('❌ 没有找到工作流文件');
        return;
      }

      // 按批次导入
      const batchSize = 10;
      for (let i = 0; i < workflowFiles.length; i += batchSize) {
        const batch = workflowFiles.slice(i, i + batchSize);
        await this.importBatch(batch);
        
        // 进度显示
        const progress = ((i + batch.length) / this.total * 100).toFixed(1);
        console.log(`⏳ 进度: ${progress}% (${i + batch.length}/${this.total})`);
        
        // 短暂延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('✅ 导入完成！');
      console.log(`📈 成功: ${this.imported}, 失败: ${this.failed}`);

    } catch (error) {
      console.error('❌ 导入失败:', error.message);
    }
  }

  getWorkflowFiles(dir) {
    try {
      const files = fs.readdirSync(dir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(dir, file));
    } catch (error) {
      console.error('❌ 读取目录失败:', error.message);
      return [];
    }
  }

  async importBatch(filePaths) {
    for (const filePath of filePaths) {
      try {
        await this.importSingleWorkflow(filePath);
        this.imported++;
      } catch (error) {
        console.error(`❌ 导入失败 ${path.basename(filePath)}:`, error.message);
        this.failed++;
      }
    }
  }

  async importSingleWorkflow(filePath) {
    const fileName = path.basename(filePath, '.json');
    const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // 提取工作流信息
    const workflowInfo = this.extractWorkflowInfo(workflowData, fileName);

    // 上传到FastGPT知识库
    await this.uploadToKnowledgeBase(workflowInfo);
  }

  extractWorkflowInfo(workflowData, fileName) {
    const nodes = workflowData.nodes || [];
    const connections = workflowData.connections || {};

    // 提取节点类型
    const nodeTypes = [...new Set(nodes.map(node => node.type))];
    const triggerTypes = nodes.filter(node => node.type?.includes('trigger')).map(node => node.type);
    
    // 生成描述
    const description = this.generateDescription(nodes, triggerTypes);
    return {
      q: fileName,
      a: JSON.stringify({
        name: fileName,
        description: description,
        nodes_count: nodes.length,
        node_types: nodeTypes,
        trigger_types: triggerTypes,
        connections_count: Object.keys(connections).length,
        full_workflow: workflowData
      })
      // indexes: [
      //   {
      //     text: fileName + ' ' + nodeTypes.join(' ') + ' ' + triggerTypes.join(' '),
      //     type: 'text'
      //   }
      // ]
    };
  }

  generateDescription(nodes, triggerTypes) {
    const nodeCount = nodes.length;
    const mainTriggers = triggerTypes.slice(0, 3).join(', ');
    
    return `工作流包含 ${nodeCount} 个节点，主要触发器: ${mainTriggers || '无触发器'}, 适用于自动化业务流程`;
  }

  async uploadToKnowledgeBase(data) {
    const response = await axios.post(
      `${FASTGPT_API_URL}/api/core/dataset/data/pushData`,
      {
        collectionId: KNOWLEDGE_BASE_ID,
        "trainingType": "chunk",
        "prompt": "可选。qa 拆分引导词，chunk 模式下忽略",  
        data: [data]
      },
      // {
      //   collectionId: KNOWLEDGE_BASE_ID,
      // "trainingType": "chunk",
      // "prompt": "可选。qa 拆分引导词，chunk 模式下忽略",
      // "billId": "可选。如果有这个值，本次的数据会被聚合到一个订单中，这个值可以重复使用。可以参考 [创建训练订单] 获取该值。",
      // "data": [
      //     {
      //         "q": "你是谁？",
      //         "a": "我是FastGPT助手"
      //     },
      //     {
      //         "q": "你会什么？",
      //         "a": "我什么都会",
      //         "indexes": [
      //             {
      //                 "text":"自定义索引1"
      //             },
      //             {
      //                 "text":"自定义索引2"
      //             }
      //         ]
      //     }
      // ],
    // },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(response.data,data,'response');

    if (response.data.code !== 200) {
      throw new Error(response.data.message || '上传失败');
    }
    return response.data;
  }
}

// 启动导入
const importer = new WorkflowImporter();

// 如果直接运行
if (require.main === module) {
  importer.startImport().catch(console.error);
}

module.exports = WorkflowImporter;