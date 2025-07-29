import json
import random
from typing import Dict, List, Any
import re
from datetime import datetime

class WriterAgent:
    def __init__(self):
        self.name = "主笔作家"
        self.version = "1.0"
        self.knowledge_bases = {
            "world_setting": "knowledge/world_setting.json",
            "character_system": "knowledge/character_system.json",
            "world_database": "knowledge/world_database.json",
            "dice_system": "knowledge/dice_system.json",
            "power_system": "knowledge/power_system.json"
        }
        self.style_guide = {
            "narrative_style": "第一人称视角，内心独白丰富，悬疑紧张氛围",
            "tone": "黑暗、压抑、偶尔黑色幽默",
            "pacing": "快节奏战斗+慢节奏心理描写",
            "language_level": "成人向，复杂句式，文学性强",
            "sensory_detail": "视觉、听觉、触觉全方位描写",
            "character_voice": "主角冷静理智，略带厌世情绪"
        }
        self.current_chapter = 0
        self.current_world = None
        self.character_state = {}
        
    def load_knowledge(self, kb_name: str) -> Dict:
        """加载指定知识库"""
        try:
            with open(self.knowledge_bases[kb_name], 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def generate_chapter_outline(self, chapter_num: int, target_layers: int = 3) -> Dict:
        """生成章节大纲"""
        world_db = self.load_knowledge("world_database")
        dice_system = self.load_knowledge("dice_system")
        
        chapter_outline = {
            "chapter_num": chapter_num,
            "layers": [],
            "overall_theme": self._determine_theme(chapter_num),
            "character_arc": self._plan_character_arc(chapter_num),
            "key_conflicts": [],
            "emotional_beats": []
        }
        
        for layer in range(target_layers):
            layer_info = self._generate_layer_outline(world_db, dice_system, chapter_num, layer)
            chapter_outline["layers"].append(layer_info)
            
        return chapter_outline
    
    def _determine_theme(self, chapter_num: int) -> str:
        """根据章节数确定主题"""
        themes = [
            "生存与适应",
            "信任与背叛", 
            "力量与代价",
            "人性和兽性",
            "命运与反抗",
            "记忆与身份",
            "孤独与羁绊",
            "轮回与解脱"
        ]
        return themes[min(chapter_num // 50, len(themes)-1)]
    
    def _plan_character_arc(self, chapter_num: int) -> Dict:
        """规划角色成长弧线"""
        arcs = {
            "psychological_state": "",
            "moral_alignment": "",
            "power_level": "",
            "relationships": []
        }
        
        if chapter_num <= 50:
            arcs.update({
                "psychological_state": "恐惧→好奇→初步适应",
                "moral_alignment": "守序善良→中立善良",
                "power_level": "凡人级→超凡级初期",
                "relationships": ["建立第一个盟友", "遇到第一个宿敌"]
            })
        elif chapter_num <= 200:
            arcs.update({
                "psychological_state": "谨慎→自信→轻敌受挫",
                "moral_alignment": "中立善良→绝对中立",
                "power_level": "超凡级中期→传奇级初期",
                "relationships": ["盟友背叛", "宿敌变复杂"]
            })
        else:
            arcs.update({
                "psychological_state": "醒悟→冷酷→算计",
                "moral_alignment": "绝对中立→中立邪恶边缘",
                "power_level": "传奇级→神话级",
                "relationships": ["利用他人", "情感封闭"]
            })
            
        return arcs
    
    def _generate_layer_outline(self, world_db: Dict, dice_system: Dict, 
                               chapter_num: int, layer_num: int) -> Dict:
        """生成单层世界大纲"""
        # 选择世界类型
        world_categories = list(world_db["世界分类系统"].keys())
        selected_category = random.choice(world_categories)
        world_types = list(world_db["世界分类系统"][selected_category].keys())
        selected_type = random.choice(world_types)
        
        world_info = world_db["世界分类系统"][selected_category][selected_type]
        
        # 生成骰子结果
        dice_result = self._simulate_dice_roll()
        
        layer_outline = {
            "layer_num": layer_num,
            "world_category": selected_category,
            "world_type": selected_type,
            "world_name": self._generate_world_name(selected_type),
            "difficulty": world_info["难度等级"],
            "dice_result": dice_result,
            "entry_point": self._determine_entry_point(world_info),
            "main_conflict": self._generate_conflict(world_info),
            "key_characters": [],
            "power_up_opportunities": [],
            "emotional_moments": []
        }
        
        return layer_outline
    
    def _simulate_dice_roll(self) -> Dict:
        """模拟骰子投掷"""
        roll = random.randint(1, 20)
        
        dice_ranges = {
            (1, 5): {"type": "安全区", "risk": "低", "reward": "一般"},
            (6, 10): {"type": "挑战区", "risk": "中", "reward": "丰厚"},
            (11, 15): {"type": "危险区", "risk": "高", "reward": "极高"},
            (16, 19): {"type": "地狱区", "risk": "极高", "reward": "SS级"},
            (20, 20): {"type": "混沌面", "risk": "未知", "reward": "隐藏"}
        }
        
        for range_key, result in dice_ranges.items():
            if range_key[0] <= roll <= range_key[1]:
                return {"roll": roll, **result}
    
    def _generate_world_name(self, world_type: str) -> str:
        """生成世界名称"""
        prefixes = ["破碎的", "扭曲的", "重生的", "末日的", "混沌的"]
        suffixes = ["火影世界", "海贼领域", "死神秘境", "巨人国度", "喰种都市"]
        
        return f"{random.choice(prefixes)}{random.choice(suffixes)}"
    
    def _determine_entry_point(self, world_info: Dict) -> str:
        """确定进入世界的时间点"""
        entry_points = [
            "故事开始前1年",
            "剧情高潮期",
            "主角觉醒时刻", 
            "世界毁灭前7天",
            "关键战役前夜"
        ]
        return random.choice(entry_points)
    
    def _generate_conflict(self, world_info: Dict) -> Dict:
        """生成主要冲突"""
        conflict_types = [
            {
                "type": "生存挑战",
                "description": "在世界中生存指定天数",
                "stakes": "死亡即真正死亡",
                "opposition": "世界本身"
            },
            {
                "type": "剧情改变", 
                "description": "必须改变原作悲剧结局",
                "stakes": "失败会被世界同化",
                "opposition": "世界修正力"
            },
            {
                "type": "对抗原主角",
                "description": "击败或超越原作主角",
                "stakes": "失去主角光环",
                "opposition": "世界主角"
            },
            {
                "type": "道德抉择",
                "description": "在生存和道德间选择",
                "stakes": "人性丧失",
                "opposition": "内心恶魔"
            }
        ]
        
        return random.choice(conflict_types)
    
    def write_chapter_content(self, outline: Dict) -> str:
        """根据大纲生成章节内容"""
        chapter_content = []
        
        # 章节标题
        chapter_title = self._generate_chapter_title(outline)
        chapter_content.append(f"# {chapter_title}\n")
        
        # 章节引言
        intro = self._write_intro(outline)
        chapter_content.append(intro)
        
        # 逐层描写
        for layer in outline["layers"]:
            layer_content = self._write_layer_content(layer)
            chapter_content.append(layer_content)
        
        # 章节结尾
        ending = self._write_ending(outline)
        chapter_content.append(ending)
        
        return "\n".join(chapter_content)
    
    def _generate_chapter_title(self, outline: Dict) -> str:
        """生成章节标题"""
        themes = {
            "生存与适应": ["第X章：在绝望中寻找希望", "第X章：适应还是死亡"],
            "信任与背叛": ["第X章：当信任成为奢侈品", "第X章：背叛的代价"],
            "力量与代价": ["第X章：力量背后的代价", "第X章：变强的诅咒"],
            "人性和兽性": ["第X章：人性的最后一道防线", "第X章：兽性觉醒"],
            "命运与反抗": ["第X章：命运骰子下的反抗", "第X章：挣脱命运的枷锁"]
        }
        
        theme_titles = themes.get(outline["overall_theme"], ["第X章：未知的前路"])
        title = random.choice(theme_titles).replace("X", str(outline["chapter_num"]))
        return title
    
    def _write_intro(self, outline: Dict) -> str:
        """写章节引言"""
        intros = [
            f"第{outline['chapter_num']}次投掷命运骰子，我不知道这次会带我去往何方。但我知道，每一次的选择都可能是最后一次。",
            f"塔的第{outline['chapter_num']}层，空气都仿佛凝固了。100万人已经剩下不到原来的十分之一，而我，还在坚持。",
            f"骰子在指尖转动，每一次旋转都像是命运的嘲笑。这一次，它会把我送到天堂还是地狱？"
        ]
        return random.choice(intros) + "\n\n"
    
    def _write_layer_content(self, layer: Dict) -> str:
        """写单层世界内容"""
        content = []
        
        # 世界进入描写
        content.append(f"## 骰子停止了转动")
        content.append(f"数字：{layer['dice_result']['roll']}")
        content.append(f"世界：{layer['world_name']} - {layer['difficulty']}")
        content.append(f"类型：{layer['world_category']} - {layer['world_type']}")
        content.append(f"进入时间：{layer['entry_point']}")
        content.append("")
        
        # 世界描写
        world_desc = self._describe_world(layer)
        content.append(world_desc)
        
        # 冲突设置
        conflict_desc = self._setup_conflict(layer)
        content.append(conflict_desc)
        
        return "\n".join(content)
    
    def _describe_world(self, layer: Dict) -> str:
        """描写世界"""
        world_templates = {
            "动漫类世界": {
                "少年热血": "空气中弥漫着查克拉的味道，远处的火影岩清晰可见，但我知道这个世界的和平只是表象。",
                "黑暗奇幻": "巨人的身影在城墙外徘徊，人类的恐惧几乎凝成实质。这不是我熟悉的那个世界，而是扭曲后的噩梦。",
                "日常番": "阳光温暖，微风和煦，仿佛是最普通的高中生活。但正是这种平凡，才让人感到毛骨悚然。"
            }
        }
        
        template = world_templates.get(layer["world_category"], {}).get(layer["world_type"], "未知的世界在等待着我...")
        return f"这个世界给我的第一感觉是：{template}\n"
    
    def _setup_conflict(self, layer: Dict) -> str:
        """设置冲突"""
        return f"\n**主要冲突：{layer['main_conflict']['description']}**\n"
    
    def _write_ending(self, outline: Dict) -> str:
        """写章节结尾"""
        endings = [
            "骰子再次出现在手中，我知道下一次投掷即将开始。但这一次，我学到了什么？",
            "回望这个刚刚离开的世界，我不知道自己的选择是否正确。但我知道，为了生存，我必须继续前进。",
            "塔还在那里，冷漠地注视着每一个挣扎的灵魂。而我，不过是百万分之一。"
        ]
        return "\n---\n" + random.choice(endings)
    
    def maintain_consistency(self, content: str, chapter_num: int) -> str:
        """检查并维护内容一致性"""
        # 检查战力平衡
        power_check = self._check_power_consistency(content, chapter_num)
        
        # 检查角色一致性
        character_check = self._check_character_consistency(content)
        
        # 检查世界观一致性
        world_check = self._check_world_consistency(content)
        
        corrections = []
        if power_check:
            corrections.extend(power_check)
        if character_check:
            corrections.extend(character_check)
        if world_check:
            corrections.extend(world_check)
            
        if corrections:
            return self._apply_corrections(content, corrections)
        
        return content
    
    def _check_power_consistency(self, content: str, chapter_num: int) -> List[str]:
        """检查战力一致性"""
        power_system = self.load_knowledge("power_system")
        expected_level = chapter_num // 10 + 1
        
        # 检查是否有超出预期的战力表现
        issues = []
        
        return issues
    
    def _check_character_consistency(self, content: str) -> List[str]:
        """检查角色一致性"""
        # 检查角色行为是否符合设定
        issues = []
        return issues
    
    def _check_world_consistency(self, content: str) -> List[str]:
        """检查世界观一致性"""
        # 检查是否符合世界设定
        issues = []
        return issues
    
    def _apply_corrections(self, content: str, corrections: List[str]) -> str:
        """应用修正"""
        corrected_content = content
        for correction in corrections:
            # 这里应该有具体的修正逻辑
            pass
        return corrected_content

# 使用示例
if __name__ == "__main__":
    writer = WriterAgent()
    
    # 生成第1章大纲
    chapter_1_outline = writer.generate_chapter_outline(1)
    
    # 生成章节内容
    chapter_1_content = writer.write_chapter_content(chapter_1_outline)
    
    # 保存章节
    with open("chapters/chapter_001.md", "w", encoding="utf-8") as f:
        f.write(chapter_1_content)
    
    print("第1章已生成完成")