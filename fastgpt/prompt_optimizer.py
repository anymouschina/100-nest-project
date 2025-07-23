"""
FastGPT提示词优化器
集成模糊需求→精准提示的转换功能
"""

import json
import re
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class ClarifyingQuestion:
    question: str
    category: str
    required: bool = True

class FuzzyToPrecisionConverter:
    """模糊需求到精准提示的转换器"""
    
    def __init__(self):
        self.category_templates = {
            "code": self._get_code_template(),
            "content": self._get_content_template(),
            "analysis": self._get_analysis_template(),
            "general": self._get_general_template()
        }
        
        self.clarifying_questions = {
            "code": [
                ClarifyingQuestion("具体要实现什么功能？", "function"),
                ClarifyingQuestion("使用什么编程语言？", "technology"),
                ClarifyingQuestion("运行在什么平台？", "platform"),
                ClarifyingQuestion("需要哪些输入输出？", "io"),
                ClarifyingQuestion("性能要求是什么？", "performance")
            ],
            "content": [
                ClarifyingQuestion("什么类型的内容？", "type"),
                ClarifyingQuestion("目标受众是谁？", "audience"),
                ClarifyingQuestion("期望的字数或长度？", "length"),
                ClarifyingQuestion("什么风格或语气？", "style"),
                ClarifyingQuestion("需要包含哪些要点？", "points")
            ],
            "analysis": [
                ClarifyingQuestion("分析什么数据？", "data"),
                ClarifyingQuestion("分析目的是什么？", "purpose"),
                ClarifyingQuestion("期望什么输出格式？", "format"),
                ClarifyingQuestion("有什么特殊要求？", "requirements")
            ]
        }
    
    def classify_need(self, fuzzy_input: str) -> str:
        """分类用户需求类型"""
        fuzzy_lower = fuzzy_input.lower()
        
        code_keywords = ["程序", "代码", "开发", "python", "java", "javascript", "函数", "类"]
        content_keywords = ["文章", "文案", "内容", "写作", "博客", "报告", "摘要"]
        analysis_keywords = ["分析", "数据", "报告", "统计", "图表", "预测"]
        
        for keyword in code_keywords:
            if keyword in fuzzy_lower:
                return "code"
        
        for keyword in content_keywords:
            if keyword in fuzzy_lower:
                return "content"
        
        for keyword in analysis_keywords:
            if keyword in fuzzy_lower:
                return "analysis"
        
        return "general"
    
    def generate_clarifying_questions(self, fuzzy_input: str, category: str) -> List[str]:
        """生成澄清问题"""
        questions = self.clarifying_questions.get(category, [])
        return [q.question for q in questions]
    
    def optimize_prompt(self, fuzzy_input: str, user_answers: Dict[str, str] = None) -> str:
        """优化模糊提示为精准提示"""
        category = self.classify_need(fuzzy_input)
        template = self.category_templates[category]
        
        if user_answers:
            return self._fill_template(template, user_answers)
        else:
            return self._get_clarification_prompt(category, fuzzy_input)
    
    def _get_code_template(self) -> str:
        return """
你是一位{programming_language}开发专家。

任务：创建{function_description}

## 技术要求
- 编程语言：{programming_language}
- 运行平台：{platform}
- 性能要求：{performance_requirements}

## 功能需求
- 核心功能：{function_description}
- 输入输出：{input_output}
- 错误处理：完善的异常处理机制

## 代码要求
- 代码结构：模块化设计
- 注释规范：清晰的代码注释
- 测试用例：包含单元测试

请提供完整的、可直接运行的代码实现。
"""
    
    def _get_content_template(self) -> str:
        return """
你是一位专业的{content_type}创作者。

任务：创作关于{topic}的{content_type}

## 内容规格
- 类型：{content_type}
- 目标受众：{target_audience}
- 字数要求：{length_requirement}
- 风格要求：{style_requirement}

## 内容要点
- 核心信息：{key_points}
- 结构要求：{structure_requirement}
- 特殊要求：{special_requirements}

请提供高质量、符合要求的内容。
"""
    
    def _get_analysis_template(self) -> str:
        return """
你是一位数据分析师。

任务：分析{data_description}

## 分析目标
- 数据描述：{data_description}
- 分析目的：{analysis_purpose}
- 输出格式：{output_format}

## 分析方法
- 数据清洗：处理缺失值和异常值
- 统计分析：关键指标计算
- 可视化：适当的图表展示
- 结论建议：基于数据的洞察

## 输出要求
- 分析深度：{analysis_depth}
- 图表类型：{chart_types}
- 建议可行性：{recommendation_practicality}

请提供详细的分析报告。
"""
    
    def _get_general_template(self) -> str:
        return """
你是一位专业的AI助手。

任务：{task_description}

## 任务理解
基于用户需求：{original_input}

## 执行要求
- 准确性：提供准确可靠的信息
- 完整性：全面覆盖相关方面
- 实用性：给出可操作的建议

## 输出规范
- 结构清晰：分点论述
- 语言简洁：避免冗余
- 案例支撑：提供具体例子

请根据上述要求完成任务。
"""
    
    def _get_clarification_prompt(self, category: str, original_input: str) -> str:
        """生成澄清提示"""
        questions = self.generate_clarifying_questions(original_input, category)
        return f"""
你是一位需求澄清专家。

用户需求："{original_input}"

这个需求比较模糊，请帮我澄清以下细节：

{chr(10).join(f"{i+1}. {q}" for i, q in enumerate(questions))}

请用简洁的语言回答这些问题，以便我为你生成精确的解决方案。
"""
    
    def _fill_template(self, template: str, variables: Dict[str, str]) -> str:
        """填充模板变量"""
        result = template
        for key, value in variables.items():
            result = result.replace(f"{{{key}}}", value)
        return result

class FastGPTPromptOptimizer:
    """FastGPT专用提示词优化器"""
    
    def __init__(self):
        self.converter = FuzzyToPrecisionConverter()
        self.clarification_sessions = {}
    
    def optimize_user_input(self, user_input: str, session_id: str = None) -> Dict:
        """优化用户输入"""
        if session_id and session_id in self.clarification_sessions:
            # 处理澄清后的回答
            return self._process_clarification(session_id, user_input)
        
        # 检测是否需要澄清
        category = self.converter.classify_need(user_input)
        
        # 如果是模糊需求，返回澄清问题
        if self._is_fuzzy(user_input):
            questions = self.converter.generate_clarifying_questions(user_input, category)
            session_id = session_id or str(hash(user_input))
            
            self.clarification_sessions[session_id] = {
                "original_input": user_input,
                "category": category,
                "questions": questions
            }
            
            return {
                "type": "clarification_needed",
                "questions": questions,
                "session_id": session_id,
                "category": category
            }
        
        # 直接优化为精准提示
        optimized = self.converter.optimize_prompt(user_input)
        return {
            "type": "optimized",
            "optimized_prompt": optimized,
            "category": category
        }
    
    def _is_fuzzy(self, user_input: str) -> bool:
        """判断是否为模糊需求"""
        fuzzy_indicators = [
            "写个", "做个", "弄一个", "搞个",
            "帮我", "给我", "做一个",
            "程序", "东西", "玩意",
            "简单", "基础", "随便"
        ]
        
        input_lower = user_input.lower()
        return any(indicator in input_lower for indicator in fuzzy_indicators)
    
    def _process_clarification(self, session_id: str, answers: str) -> Dict:
        """处理澄清回答"""
        session = self.clarification_sessions.get(session_id)
        if not session:
            return {"type": "error", "message": "会话不存在"}
        
        # 解析回答（这里简化处理，实际应该解析为结构化数据）
        variables = self._parse_answers(answers)
        optimized = self.converter.optimize_prompt(
            session["original_input"], 
            variables
        )
        
        # 清理会话
        del self.clarification_sessions[session_id]
        
        return {
            "type": "optimized",
            "optimized_prompt": optimized,
            "original_input": session["original_input"]
        }
    
    def _parse_answers(self, answers: str) -> Dict[str, str]:
        """解析用户回答"""
        # 简化实现，实际应该更智能地解析
        lines = answers.strip().split('\n')
        variables = {}
        
        for line in lines:
            if ':' in line or '：' in line:
                key_value = re.split(r'[:：]', line, 1)
                if len(key_value) == 2:
                    key = key_value[0].strip()
                    value = key_value[1].strip()
                    # 映射中文关键词到英文变量名
                    key_mapping = {
                        '功能': 'function_description',
                        '语言': 'programming_language',
                        '平台': 'platform',
                        '输入': 'input_output',
                        '性能': 'performance_requirements'
                    }
                    
                    for cn_key, en_key in key_mapping.items():
                        if cn_key in key:
                            variables[en_key] = value
                            break
        
        return variables

# 全局优化器实例
prompt_optimizer = FastGPTPromptOptimizer()

# FastGPT集成函数
def fastgpt_optimize_prompt(user_input: str, session_id: str = None) -> Dict:
    """FastGPT专用优化函数"""
    return prompt_optimizer.optimize_user_input(user_input, session_id)

if __name__ == "__main__":
    # 测试示例
    test_cases = [
        "写个程序",
        "帮我分析数据",
        "做个网站",
        "写篇文章"
    ]
    
    for case in test_cases:
        result = fastgpt_optimize_prompt(case)
        print(f"输入：{case}")
        print(f"结果：{result}")
        print("-" * 50)