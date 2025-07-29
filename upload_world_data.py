#!/usr/bin/env python3
"""
将世界观数据上传到FastGPT知识库
"""

import json
import requests
import time
from typing import Dict, List, Any

class FastGPTUploader:
    def __init__(self, base_url: str, api_key: str, kb_id: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.kb_id = kb_id
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
    def test_connection(self) -> bool:
        """测试API连接"""
        try:
            response = requests.get(
                f'{self.base_url}/api/v1/kb/list',
                headers=self.headers,
                timeout=10
            )
            print(f"测试连接状态码: {response.status_code}")
            if response.status_code == 200:
                print("知识库API连接成功")
                return True
            else:
                print(f"响应: {response.text}")
                return False
        except Exception as e:
            print(f"连接失败: {e}")
            return False
    
    def upload_qa_pair(self, question: str, answer: str, tags: List[str] = None) -> bool:
        """上传单个问答对"""
        if tags is None:
            tags = []
            
        data = {
            "kbId": self.kb_id,
            "data": {
                "q": question,
                "a": answer
            },
            "tags": tags,
            "status": "active"
        }
        
        try:
            response = requests.post(
                f'{self.base_url}/api/v1/kb/data/insertData',
                headers=self.headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                print(f"✓ 上传成功: {question[:50]}...")
                return True
            else:
                print(f"✗ 上传失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"✗ 上传异常: {e}")
            return False
    
    def process_world_setting(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """处理世界设定数据"""
        qa_pairs = []
        
        # 塔空间基本设定
        basic_setting = data["塔空间世界观"]["基本设定"]
        qa_pairs.append({
            "question": "塔空间是什么？",
            "answer": f"塔空间是一个宇宙级筛选装置，每1000年启动一次轮回。从多元宇宙抽取100万个生物进行竞赛，最终存活1人成为新塔主。塔有千层结构，每层都是独立宇宙，塔内1年等于外界100年。",
            "tags": ["塔空间", "基本设定", "世界观"]
        })
        
        qa_pairs.append({
            "question": "塔空间的选拔机制是怎样的？",
            "answer": f"选拔机制：从多元宇宙抽取100万个生物进行竞赛，最终百万人中存活1人成为新塔主，重启轮回。参赛者必须通关千层塔，每层都需要选择一个世界线进行挑战。",
            "tags": ["选拔机制", "塔空间", "竞赛规则"]
        })
        
        # 规则体系
        rules = data["塔空间世界观"]["规则体系"]
        qa_pairs.append({
            "question": "塔空间的核心规则有哪些？",
            "answer": f"核心规则：1)每次穿越前必须从脚下世界线中选择一条；2)命运骰子决定具体穿越世界；3)世界中获得的能力可带出，但需用奖励点兑换；4)死亡即真正死亡，无复活机制；5)不可主动退出竞赛，除非成为最终胜利者。",
            "tags": ["核心规则", "塔空间", "竞赛规则"]
        })
        
        # 竞赛阶段
        stages = data["竞赛阶段"]
        for stage_name, stage_info in stages.items():
            qa_pairs.append({
                "question": f"{stage_name}的特点是什么？",
                "answer": f"{stage_name}：{stage_info['层数']}层，人数从{stage_info['人数']}。特点：{stage_info['特点']}。主要淘汰原因：{stage_info['主要淘汰原因']}。",
                "tags": ["竞赛阶段", stage_name, "淘汰机制"]
            })
        
        return qa_pairs
    
    def process_character_system(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """处理角色系统数据"""
        qa_pairs = []
        
        # 主角信息
        protagonist = data["主角档案"]
        qa_pairs.append({
            "question": "主角林默的基本信息？",
            "answer": f"林默，24岁，来自地球-蓝星2035年。被选原因是在原本世界死亡瞬间被塔选中。初始特质：冷静分析、适应力强、道德底线灵活、隐藏的反社会倾向。",
            "tags": ["主角", "林默", "基本信息"]
        })
        
        # 能力成长
        abilities = protagonist["能力成长轨迹"]
        for phase, ability_list in abilities.items():
            qa_pairs.append({
                "question": f"主角在{phase}有哪些能力？",
                "answer": f"{phase}能力：{', '.join([f'{k}:{v}' for k, v in ability_list.items()])}",
                "tags": ["主角", "能力成长", phase]
            })
        
        # 主要反派
        villains = data["主要反派"]
        for villain_name, villain_info in villains.items():
            qa_pairs.append({
                "question": f"反派{villain_name}的信息？",
                "answer": f"{villain_name}来自{villain_info['来自世界']}，身份是{villain_info['身份']}。能力包括：{', '.join(villain_info['能力'])}。性格：{villain_info['性格']}。",
                "tags": ["反派", villain_name, "角色介绍"]
            })
        
        return qa_pairs
    
    def process_power_system(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """处理战力系统数据"""
        qa_pairs = []
        
        # 战力等级
        power_levels = data["战力等级体系"]["基础等级"]
        for level_name, level_info in power_levels.items():
            qa_pairs.append({
                "question": f"{level_name}的详细信息？",
                "answer": f"{level_name}：{level_info['范围']}级，特征：{level_info['特征']}。主要能力：{', '.join(level_info['主要能力'])}。对应世界：{', '.join(level_info['对应世界'])}。",
                "tags": ["战力等级", level_name, "等级系统"]
            })
        
        # 能力分类
        ability_types = data["能力分类系统"]
        for category, subtypes in ability_types.items():
            qa_pairs.append({
                "question": f"{category}包含哪些类型？",
                "answer": f"{category}包含：{', '.join(list(subtypes.keys()))}",
                "tags": ["能力分类", category]
            })
        
        return qa_pairs
    
    def process_dice_system(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """处理骰子系统数据"""
        qa_pairs = []
        
        # 骰子基础设定
        dice_info = data["命运骰子系统"]
        qa_pairs.append({
            "question": "命运骰子是什么？",
            "answer": "命运骰子是每个参赛者的专属道具，主角的是黑金色二十面骰。它是灵魂绑定，无法丢弃、无法摧毁、无法交易。每次穿越前必须投掷，结果不可更改。",
            "tags": ["命运骰子", "基本设定", "穿越机制"]
        })
        
        # 骰面解析
        dice_faces = dice_info["骰面解析"]
        for face_range, face_info in dice_faces.items():
            qa_pairs.append({
                "question": f"骰子{face_range}代表什么？",
                "answer": f"{face_range}属于{face_info['类型']}，世界特征：{face_info['世界特征']}，出现概率：{face_info['出现概率']}，典型世界：{', '.join(face_info['典型世界']) if isinstance(face_info['典型世界'], list) else face_info['典型世界']}",
                "tags": ["命运骰子", "骰面", face_range]
            })
        
        return qa_pairs
    
    def process_world_database(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """处理世界数据库"""
        qa_pairs = []
        
        # 世界分类
        world_types = data["世界分类系统"]
        for category, worlds in world_types.items():
            qa_pairs.append({
                "question": f"{category}包含哪些世界？",
                "answer": f"{category}包含：{', '.join(list(worlds.keys()))}",
                "tags": ["世界分类", category]
            })
            
            for world_name, world_info in worlds.items():
                qa_pairs.append({
                    "question": f"{world_name}世界的详细信息？",
                    "answer": f"{world_name}：代表作品包括{', '.join(world_info['代表作品'])}，难度等级{world_info['难度等级']}，特色规则：{'; '.join(world_info['特色规则'])}，危险指数{world_info['危险指数']}。",
                    "tags": ["世界类型", world_name, "详细信息"]
                })
        
        return qa_pairs
    
    def upload_all_data(self):
        """上传所有世界观数据"""
        print("开始上传世界观数据到知识库...")
        
        # 加载数据文件
        data_files = [
            ("/Users/libiqiang/Documents/workspace/100-nest-project/knowledge/world_setting.json", self.process_world_setting, "世界设定"),
            ("/Users/libiqiang/Documents/workspace/100-nest-project/knowledge/character_system.json", self.process_character_system, "角色系统"),
            ("/Users/libiqiang/Documents/workspace/100-nest-project/knowledge/power_system.json", self.process_power_system, "战力系统"),
            ("/Users/libiqiang/Documents/workspace/100-nest-project/knowledge/dice_system.json", self.process_dice_system, "骰子系统"),
            ("/Users/libiqiang/Documents/workspace/100-nest-project/knowledge/world_database.json", self.process_world_database, "世界数据库")
        ]
        
        total_uploaded = 0
        
        for file_path, processor, category_name in data_files:
            try:
                print(f"\n处理{category_name}数据...")
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                qa_pairs = processor(data)
                print(f"{category_name}生成{len(qa_pairs)}个问答对")
                
                # 上传数据
                for qa in qa_pairs:
                    if self.upload_qa_pair(qa["question"], qa["answer"], qa["tags"]):
                        total_uploaded += 1
                    time.sleep(0.5)  # 避免请求过快
                    
            except Exception as e:
                print(f"处理{category_name}时出错: {e}")
        
        print(f"\n上传完成！总共上传了{total_uploaded}个问答对")

if __name__ == "__main__":
    # API配置
    BASE_URL = "http://localhost:3000"
    API_KEY = "fastgpt-iDOD4SsyD7lopobsBFP2Bdfa9PpPt6O9s32HuUS0DgbPhl9mqd83KUdMunwte5"
    KB_ID = "6884104d7a974555ab87363c"
    
    uploader = FastGPTUploader(BASE_URL, API_KEY, KB_ID)
    
    # 测试连接
    print("测试API连接...")
    if uploader.test_connection():
        print("API连接成功")
        uploader.upload_all_data()
    else:
        print("API连接失败，请检查服务是否启动")