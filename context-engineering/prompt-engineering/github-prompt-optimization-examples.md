# GitHub优秀提示词优化示例大全

## 🎯 模糊需求→精准提示的转换神器

### 1. Google官方提示优化策略

#### **Chain-of-Thought + ReAct模板**
```python
# 原始模糊需求："帮我写个程序"
# 优化后提示词：

SYSTEM_PROMPT = """你是一位专业的Python开发专家。

任务：根据用户需求创建完整的Python应用程序

思考框架（请按以下步骤执行）：
1. 需求分析：明确用户的核心需求
2. 技术方案：选择合适的技术栈
3. 架构设计：设计代码结构
4. 逐步实现：分步骤实现功能
5. 测试验证：提供测试用例

输出格式：
## 需求分析
- 核心功能：{extracted_function}
- 技术约束：{constraints}

## 技术方案
- 语言：Python 3.9+
- 框架：{framework}
- 依赖：{dependencies}

## 代码实现
```python
{complete_code}
```

## 使用说明
{usage_guide}

## 测试用例
{test_cases}
"""

USER_PROMPT = """
用户需求：{user_abstract_need}

请按上述框架提供完整解决方案。
"""
```

### 2. LangChain的Prompt优化实例

#### **从模糊到精准的转换示例**

**原始模糊需求**："写个AI助手"

**优化过程**：
```python
# Step 1: 需求澄清模板
CLARIFICATION_PROMPT = """
用户说："{模糊需求}"

请帮我澄清以下细节：
1. 具体应用场景：______
2. 目标用户群体：______  
3. 核心功能需求：______
4. 技术约束条件：______
5. 预期输出格式：______

请用具体问题引导用户澄清需求。
"""

# Step 2: 结构化需求模板
STRUCTURED_PROMPT = """
基于澄清的需求，生成结构化提示词：

## 角色定义
你是一位{角色描述}专家

## 任务目标
{specific_goal}

## 输入规范
- 用户输入：{input_format}
- 上下文：{context_requirement}

## 处理流程
1. {step1}
2. {step2}
3. {step3}

## 输出格式
{output_specification}

## 质量检查
- [ ] 符合{quality_standard1}
- [ ] 包含{quality_standard2}
- [ ] 避免{common_pitfall}
"""
```

### 3. DSPy提示词自动优化

#### **自动模板优化示例**
```python
# 原始提示："分类这段文本的情感"
# DSPy优化后的提示：

OPTIMIZED_PROMPT = """
你是一位情感分析专家。

任务：对给定文本进行精确的情感分类

## 情感类别定义
- **积极**：表达正面情绪、满意、推荐
- **消极**：表达负面情绪、抱怨、批评  
- **中性**：客观描述、无明显情感倾向

## 分析步骤
1. **关键词识别**：找出情感关键词和短语
2. **上下文分析**：考虑语境和表达方式
3. **强度评估**：判断情感表达的强烈程度
4. **分类决策**：基于整体印象确定类别

## 输入文本
{text_to_analyze}

## 输出格式
```json
{
  "情感类别": "积极/消极/中性",
  "置信度": 0.0-1.0,
  "关键证据": ["关键词1", "关键词2"],
  "情感强度": "强烈/中等/轻微",
  "解释": "简要分析理由"
}
```

## 边界情况处理
- 如果文本包含混合情感，选择主导情感
- 如果情感极不明显，标记为"中性"
- 如果文本过短或模糊，降低置信度
"""
```

## 🛠️ 模糊需求处理框架

### **需求澄清矩阵**

| 模糊需求类型 | 澄清问题模板 | 示例转换 |
|-------------|-------------|----------|
| **功能描述模糊** | "具体要实现什么功能？" | "写个程序" → "创建一个Python爬虫，抓取新闻标题" |
| **目标用户不明确** | "谁会使用这个？" | "做个网站" → "为小型咖啡店设计的在线订餐网站" |
| **技术约束缺失** | "有什么技术限制？" | "开发App" → "使用Flutter开发iOS/Android跨平台App" |
| **输出格式模糊** | "期望什么形式的输出？" | "分析报告" → "生成包含图表的PDF格式数据分析报告" |

### **自动需求解析器**
```python
class FuzzyToPrecisionConverter:
    def __init__(self):
        self.question_bank = {
            "what": "具体要实现什么功能？",
            "who": "目标用户是谁？",
            "where": "在什么场景下使用？",
            "when": "有什么时间要求？",
            "how": "期望的实现方式？",
            "why": "解决什么具体问题？"
        }
    
    def convert(self, fuzzy_need: str) -> dict:
        """将模糊需求转换为结构化提示词"""
        
        # 1. 需求分类
        category = self.classify_need(fuzzy_need)
        
        # 2. 生成澄清问题
        questions = self.generate_clarifying_questions(fuzzy_need, category)
        
        # 3. 构建基础模板
        base_template = self.get_base_template(category)
        
        # 4. 填充模板
        structured_prompt = self.fill_template(base_template, questions)
        
        return {
            "category": category,
            "clarifying_questions": questions,
            "structured_prompt": structured_prompt,
            "variables": self.extract_variables(structured_prompt)
        }
```

## 🎨 实用模板库

### **1. 万能需求澄清器**
```
你是一个需求分析师。

用户说："{模糊需求}"

请帮我澄清以下细节：

**功能维度：**
- 核心功能：具体要实现什么？
- 辅助功能：还需要哪些额外功能？
- 优先级：哪些功能最重要？

**技术维度：**
- 技术栈：使用什么技术实现？
- 性能要求：响应时间、并发量？
- 兼容性：支持哪些平台/设备？

**用户体验：**
- 目标用户：谁会使用？技术水平？
- 使用场景：在什么情况下使用？
- 交互方式：命令行/图形界面/语音？

**输出要求：**
- 交付形式：代码/文档/可执行程序？
- 质量标准：如何验证成功？
- 时间期望：什么时候需要？

请用具体问题引导用户澄清需求，然后基于澄清后的信息生成精确的提示词。
```

### **2. 技术方案生成器**
```
你是一位系统架构师。

用户需求：{用户描述}

请将其转换为技术实现方案：

## 需求分析
- **核心需求**：{extracted_core_need}
- **隐含需求**：{implicit_requirements}
- **约束条件**：{constraints}

## 技术方案
- **架构选择**：{architecture_pattern}
- **技术栈**：{technology_stack}
- **实现复杂度**：{complexity_level}

## 实现步骤
1. **环境准备**：{setup_steps}
2. **核心实现**：{implementation_steps}
3. **测试验证**：{testing_strategy}
4. **部署方案**：{deployment_plan}

## 代码框架
```
{code_skeleton}
```

## 注意事项
- {caveat1}
- {caveat2}
```

### **3. 内容创作优化器**
```
你是一位内容策略专家。

用户想要：{模糊内容需求}

请转换为具体的创作指导：

## 内容定位
- **内容类型**：{content_type}
- **目标受众**：{target_audience}
- **核心信息**：{key_message}

## 创作框架
- **文章结构**：{structure_outline}
- **写作风格**：{writing_style}
- **关键要点**：{key_points}

## SEO优化
- **关键词**：{keywords}
- **标题优化**：{optimized_title}
- **元描述**：{meta_description}

## 内容大纲
{detailed_outline}
```

## 📊 实际案例演示

### **案例1：从"写个爬虫"到精确提示**

**原始需求**："写个爬虫"

**澄清过程**：
```
用户：写个爬虫
AI：请澄清以下细节：
- 要爬取什么网站？
- 需要哪些数据字段？
- 数据如何存储？
- 爬取频率？
- 是否需要处理反爬？

用户明确后：
- 爬取豆瓣电影TOP250
- 需要电影名称、评分、简介
- 存储到CSV文件
- 一次性爬取
- 基础反反爬

**最终提示词**：
"创建一个Python爬虫，爬取豆瓣电影TOP250的电影信息，包括电影名称、评分、简介，保存为CSV格式文件。要求：
1. 使用requests+BeautifulSoup
2. 添加User-Agent伪装
3. 处理分页
4. 异常处理
5. 保存为UTF-8编码的CSV文件
"
```

### **案例2：商业计划书生成**

**模糊需求**："做个商业计划"

**结构化转换**：
```
# 自动生成的精确提示
"创建一份针对{行业}领域的商业计划书：

## 项目概述
- 产品/服务：{product_description}
- 目标市场：{target_market}
- 商业模式：{business_model}

## 市场分析
- 市场规模：{market_size}
- 竞争格局：{competition}
- 目标用户：{user_persona}

## 产品策略
- 核心功能：{core_features}
- 技术实现：{tech_approach}
- 开发计划：{development_roadmap}

## 商业模式
- 收入来源：{revenue_streams}
- 定价策略：{pricing_strategy}
- 获客渠道：{acquisition_channels}

## 财务预测
- 成本结构：{cost_structure}
- 收入预测：{revenue_projection}
- 融资需求：{funding_requirement}

请提供具体数据和可执行的行动计划。"
```

## 🔧 工具集成示例

### **VSCode插件集成**
```json
{
  "promptTemplates": [
    {
      "name": "需求澄清器",
      "prefix": "clarify",
      "body": [
        "你是一位需求分析师。",
        "用户说：\"$1\"",
        "请帮我澄清..."
      ]
    },
    {
      "name": "技术方案生成器", 
      "prefix": "techplan",
      "body": [
        "你是一位系统架构师。",
        "用户需求：$1",
        "请转换为技术实现方案..."
      ]
    }
  ]
}
```

### **命令行工具**
```bash
# 使用示例
$ prompt-optimizer "写个程序"

# 输出澄清问题
1. 要实现什么具体功能？
2. 使用什么编程语言？
3. 运行在什么平台？
4. 需要哪些输入输出？
5. 性能要求是什么？

# 生成优化后的提示词
"创建一个{语言}程序，实现{功能描述}..."
```

这套框架可以将任何模糊需求转化为精确的、可执行的AI提示词！