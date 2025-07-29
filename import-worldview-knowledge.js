const fs = require('fs');
const path = require('path');
const axios = require('axios');

// FastGPT配置 - 使用新的知识库ID
const FASTGPT_API_URL = 'http://localhost:3000';
const KNOWLEDGE_BASE_ID = '6884104d7a974555ab87363c'; // 刚创建的世界观知识库
const API_KEY = 'fastgpt-iDOD4SsyD7lopobsBFP2Bdfa9PpPt6O9s32HuUS0DgbPhl9mqd83KUdMunwte5';

// 世界观数据目录
const KNOWLEDGE_DIR = '/Users/libiqiang/Documents/workspace/100-nest-project/knowledge';

class WorldviewKnowledgeImporter {
  constructor() {
    this.imported = 0;
    this.failed = 0;
    this.total = 0;
  }

  async startImport() {
    console.log('🚀 开始导入世界观数据到知识库...');
    console.log(`📁 数据目录: ${KNOWLEDGE_DIR}`);
    console.log(`📚 知识库ID: ${KNOWLEDGE_BASE_ID}`);

    try {
      // 获取所有世界观数据文件
      const knowledgeFiles = this.getKnowledgeFiles(KNOWLEDGE_DIR);
      this.total = knowledgeFiles.length;
      console.log(`📊 发现 ${this.total} 个数据文件`);

      if (this.total === 0) {
        console.log('❌ 没有找到数据文件');
        return;
      }

      // 按批次导入
      const batchSize = 5;
      for (let i = 0; i < knowledgeFiles.length; i += batchSize) {
        const batch = knowledgeFiles.slice(i, i + batchSize);
        await this.importBatch(batch);
        
        // 进度显示
        const progress = ((i + batch.length) / this.total * 100).toFixed(1);
        console.log(`⏳ 进度: ${progress}% (${i + batch.length}/${this.total})`);
        
        // 短暂延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      console.log('✅ 导入完成！');
      console.log(`📈 成功: ${this.imported}, 失败: ${this.failed}`);

    } catch (error) {
      console.error('❌ 导入失败:', error.message);
      if (error.response) {
        console.error('响应数据:', error.response.data);
      }
    }
  }

  getKnowledgeFiles(dir) {
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
        await this.importSingleFile(filePath);
        this.imported++;
      } catch (error) {
        console.error(`❌ 导入失败 ${path.basename(filePath)}:`, error.message);
        this.failed++;
      }
    }
  }

  async importSingleFile(filePath) {
    const fileName = path.basename(filePath, '.json');
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    console.log(`📖 处理文件: ${fileName}`);

    // 将每个数据文件转换为多个知识库条目
    const entries = this.convertToEntries(fileData, fileName);
    
    // 分批上传到知识库
    for (const entry of entries) {
      await this.uploadToKnowledgeBase(entry);
    }
  }

  convertToEntries(data, sourceFile) {
    const entries = [];
    
    // 根据文件类型生成不同的条目
    switch (sourceFile) {
      case 'world_setting':
        entries.push(...this.processWorldSetting(data));
        break;
      case 'character_system':
        entries.push(...this.processCharacterSystem(data));
        break;
      case 'power_system':
        entries.push(...this.processPowerSystem(data));
        break;
      case 'dice_system':
        entries.push(...this.processDiceSystem(data));
        break;
      case 'world_database':
        entries.push(...this.processWorldDatabase(data));
        break;
      default:
        console.warn(`⚠️ 未知文件类型: ${sourceFile}`);
    }
    
    return entries;
  }

  processWorldSetting(data) {
    const entries = [];
    
    // 塔空间世界观基础设定
    entries.push({
      q: "塔空间世界观的基本设定是什么？",
      a: JSON.stringify(data["塔空间世界观"]["基本设定"], null, 2),
      indexes: ["世界观", "塔空间", "基本设定", "宇宙筛选装置"]
    });

    // 规则体系
    entries.push({
      q: "塔空间的竞赛规则有哪些？",
      a: JSON.stringify({
        "核心规则": data["塔空间世界观"]["规则体系"]["核心规则"],
        "世界选择规则": data["塔空间世界观"]["规则体系"]["世界选择规则"],
        "奖励系统": data["塔空间世界观"]["规则体系"]["奖励系统"]
      }, null, 2),
      indexes: ["竞赛规则", "核心规则", "世界选择", "奖励系统"]
    });

    // 竞赛阶段
    Object.entries(data["竞赛阶段"]).forEach(([stage, details]) => {
      entries.push({
        q: `${stage}的详细规则是什么？`,
        a: JSON.stringify(details, null, 2),
        indexes: ["竞赛阶段", stage, "生存规则", "淘汰机制"]
      });
    });

    // 塔主权限
    entries.push({
      q: "塔主拥有哪些权限和限制？",
      a: JSON.stringify(data["塔主权限"], null, 2),
      indexes: ["塔主权限", "绝对权限", "限制条件", "传承仪式"]
    });

    return entries;
  }

  processCharacterSystem(data) {
    const entries = [];
    
    // 主角档案
    entries.push({
      q: "主角林默的详细档案和能力成长轨迹？",
      a: JSON.stringify(data["主角档案"], null, 2),
      indexes: ["主角档案", "林默", "能力成长", "心理变化", "关键关系"]
    });

    // 主要反派
    Object.entries(data["主要反派"]).forEach(([villain, details]) => {
      entries.push({
        q: `反派${villain}的详细信息和能力特点？`,
        a: JSON.stringify(details, null, 2),
        indexes: ["反派", villain, "能力特点", "威胁等级"]
      });
    });

    // 角色互动系统
    entries.push({
      q: "角色间的信任度和背叛机制是如何运作的？",
      a: JSON.stringify(data["角色互动系统"], null, 2),
      indexes: ["角色互动", "信任度", "背叛机制", "情感羁绊"]
    });

    return entries;
  }

  processPowerSystem(data) {
    const entries = [];
    
    // 战力等级
    Object.entries(data["战力等级体系"]["基础等级"]).forEach(([level, details]) => {
      entries.push({
        q: `${level}的详细描述和能力范围？`,
        a: JSON.stringify(details, null, 2),
        indexes: ["战力等级", level, "能力范围", "对应世界"]
      });
    });

    // 能力分类
    entries.push({
      q: "能力系统是如何分类的？",
      a: JSON.stringify({
        "主动能力": data["能力分类系统"]["主动能力"],
        "被动能力": data["能力分类系统"]["被动能力"],
        "专属能力": data["能力分类系统"]["专属能力"]
      }, null, 2),
      indexes: ["能力分类", "主动能力", "被动能力", "专属能力"]
    });

    // 道具系统
    entries.push({
      q: "道具系统的等级和获取方式？",
      a: JSON.stringify(data["道具系统"], null, 2),
      indexes: ["道具系统", "道具等级", "道具获取", "特殊道具"]
    });

    return entries;
  }

  processDiceSystem(data) {
    const entries = [];
    
    // 骰子基础设定
    entries.push({
      q: "命运骰子系统的基础设定和机制？",
      a: JSON.stringify(data["命运骰子系统"]["骰子基础设定"], null, 2),
      indexes: ["命运骰子", "骰子设定", "世界选择", "骰子机制"]
    });

    // 骰面解析
    Object.entries(data["命运骰子系统"]["骰面解析"]).forEach(([face, details]) => {
      entries.push({
        q: `骰子${face}对应的世界类型和特征？`,
        a: JSON.stringify(details, null, 2),
        indexes: ["骰面解析", face, "世界类型", "难度等级"]
      });
    });

    // 骰子进化
    entries.push({
      q: "骰子如何进化和异变？",
      a: JSON.stringify({
        "进化系统": data["命运骰子系统"]["骰子进化系统"],
        "特殊事件": data["命运骰子系统"]["特殊骰子事件"]
      }, null, 2),
      indexes: ["骰子进化", "异变系统", "特殊事件", "骰子战争"]
    });

    return entries;
  }

  processWorldDatabase(data) {
    const entries = [];
    
    // 世界分类
    Object.entries(data["世界分类系统"]).forEach(([category, worlds]) => {
      Object.entries(worlds).forEach(([worldType, details]) => {
        entries.push({
          q: `${category}中的${worldType}世界有什么特点？`,
          a: JSON.stringify(details, null, 2),
          indexes: ["世界分类", category, worldType, "难度等级", "特色规则"]
        });
      });
    });

    // 世界生成规则
    entries.push({
      q: "世界是如何生成和调整的？",
      a: JSON.stringify({
        "生成规则": data["世界生成规则"],
        "特殊事件": data["特殊世界事件"],
        "奖励机制": data["世界奖励机制"]
      }, null, 2),
      indexes: ["世界生成", "难度调整", "特殊事件", "奖励机制"]
    });

    return entries;
  }

  async uploadToKnowledgeBase(data) {
    const response = await axios.post(
      `${FASTGPT_API_URL}/api/core/dataset/data/pushData`,
      {
        collectionId: KNOWLEDGE_BASE_ID,
        trainingType: "qa",
        data: [{
          q: data.q,
          a: data.a
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.message || '上传失败');
    }
    
    console.log(`✅ 上传成功: ${data.q.substring(0, 50)}...`);
    return response.data;
  }
}

// 启动导入
const importer = new WorldviewKnowledgeImporter();

// 如果直接运行
if (require.main === module) {
  importer.startImport().catch(console.error);
}

module.exports = WorldviewKnowledgeImporter;