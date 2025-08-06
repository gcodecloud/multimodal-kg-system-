import spacy
import jieba
import re
from typing import List, Tuple, Dict, Any
import json

class NLPProcessor:
    """NLP处理器"""
    
    def __init__(self):
        # 尝试加载spaCy中文模型
        try:
            self.nlp = spacy.load("zh_core_web_sm")
        except OSError:
            print("警告: 未找到spaCy中文模型，使用简化的NLP处理")
            self.nlp = None
        
        # 预定义的实体类型和关系类型
        self.entity_types = {
            'PERSON': '人名',
            'ORG': '组织',
            'GPE': '地点',
            'PRODUCT': '产品',
            'EVENT': '事件',
            'TIME': '时间',
            'MONEY': '金额'
        }
        
        self.relation_patterns = [
            (r'(.+?)(?:是|为)(.+?)(?:的)?(.+)', 'is_a'),
            (r'(.+?)(?:工作于|任职于|在)(.+)', 'works_at'),
            (r'(.+?)(?:位于|在)(.+)', 'located_in'),
            (r'(.+?)(?:拥有|持有)(.+)', 'owns'),
            (r'(.+?)(?:创建|建立|创办)(?:了)?(.+)', 'founded'),
            (r'(.+?)(?:参与|参加)(?:了)?(.+)', 'participates_in')
        ]
    
    def extract_knowledge(self, text: str) -> Tuple[List[Dict], List[Dict]]:
        """从文本中提取知识（实体和关系）"""
        # 清理文本
        text = self._clean_text(text)
        
        # 提取实体
        entities = self._extract_entities(text)
        
        # 提取关系
        relations = self._extract_relations(text, entities)
        
        return entities, relations
    
    def _clean_text(self, text: str) -> str:
        """清理文本"""
        # 移除多余的空白字符
        text = re.sub(r'\s+', ' ', text)
        # 移除特殊字符
        text = re.sub(r'[^\w\s\u4e00-\u9fff.,!?;:]', '', text)
        return text.strip()
    
    def _extract_entities(self, text: str) -> List[Dict]:
        """提取实体"""
        entities = []
        
        if self.nlp:
            # 使用spaCy提取实体
            doc = self.nlp(text)
            for ent in doc.ents:
                entity = {
                    'text': ent.text,
                    'label': ent.label_,
                    'start': ent.start_char,
                    'end': ent.end_char,
                    'confidence': 0.8
                }
                entities.append(entity)
        else:
            # 简化的实体提取（基于规则）
            entities = self._extract_entities_by_rules(text)
        
        # 去重并合并相似实体
        entities = self._merge_similar_entities(entities)
        
        return entities
    
    def _extract_entities_by_rules(self, text: str) -> List[Dict]:
        """基于规则的实体提取"""
        entities = []
        
        # 使用jieba分词
        words = jieba.cut(text)
        word_list = list(words)
        
        # 简单的人名识别（包含姓氏的词）
        chinese_surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜', '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史', '顾', '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤', '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文']
        
        current_pos = 0
        for word in word_list:
            if len(word) >= 2 and word[0] in chinese_surnames:
                start_pos = text.find(word, current_pos)
                if start_pos != -1:
                    entities.append({
                        'text': word,
                        'label': 'PERSON',
                        'start': start_pos,
                        'end': start_pos + len(word),
                        'confidence': 0.6
                    })
                    current_pos = start_pos + len(word)
        
        # 简单的组织识别（包含公司、大学等关键词）
        org_keywords = ['公司', '大学', '学院', '研究院', '集团', '企业', '机构', '部门', '政府', '银行']
        for keyword in org_keywords:
            for match in re.finditer(r'[\u4e00-\u9fff]+' + keyword, text):
                entities.append({
                    'text': match.group(),
                    'label': 'ORG',
                    'start': match.start(),
                    'end': match.end(),
                    'confidence': 0.7
                })
        
        # 地点识别
        location_keywords = ['市', '省', '县', '区', '街', '路', '国', '州']
        for keyword in location_keywords:
            for match in re.finditer(r'[\u4e00-\u9fff]+' + keyword, text):
                entities.append({
                    'text': match.group(),
                    'label': 'GPE',
                    'start': match.start(),
                    'end': match.end(),
                    'confidence': 0.6
                })
        
        return entities
    
    def _extract_relations(self, text: str, entities: List[Dict]) -> List[Dict]:
        """提取关系"""
        relations = []
        
        # 基于模式的关系提取
        for pattern, relation_type in self.relation_patterns:
            for match in re.finditer(pattern, text):
                groups = match.groups()
                if len(groups) >= 2:
                    subject = groups[0].strip()
                    obj = groups[1].strip() if len(groups) > 1 else ""
                    
                    # 检查是否为有效的实体
                    if self._is_valid_entity(subject) and self._is_valid_entity(obj):
                        relations.append({
                            'subject': subject,
                            'predicate': relation_type,
                            'object': obj,
                            'confidence': 0.7,
                            'context': match.group()
                        })
        
        # 基于实体的关系提取
        entity_texts = [e['text'] for e in entities]
        for i, ent1 in enumerate(entity_texts):
            for j, ent2 in enumerate(entity_texts):
                if i != j:
                    # 查找两个实体在文本中的共现
                    relation = self._find_relation_between_entities(text, ent1, ent2)
                    if relation:
                        relations.append(relation)
        
        return self._deduplicate_relations(relations)
    
    def _is_valid_entity(self, text: str) -> bool:
        """检查是否为有效实体"""
        return len(text.strip()) > 1 and len(text.strip()) < 20
    
    def _find_relation_between_entities(self, text: str, ent1: str, ent2: str) -> Dict:
        """查找两个实体之间的关系"""
        # 查找包含两个实体的句子
        sentences = re.split(r'[。！？.!?]', text)
        
        for sentence in sentences:
            if ent1 in sentence and ent2 in sentence:
                # 简单的关系推断
                if '工作' in sentence or '任职' in sentence:
                    return {
                        'subject': ent1,
                        'predicate': 'works_at',
                        'object': ent2,
                        'confidence': 0.6,
                        'context': sentence.strip()
                    }
                elif '位于' in sentence or '在' in sentence:
                    return {
                        'subject': ent1,
                        'predicate': 'located_in',
                        'object': ent2,
                        'confidence': 0.6,
                        'context': sentence.strip()
                    }
        
        return None
    
    def _merge_similar_entities(self, entities: List[Dict]) -> List[Dict]:
        """合并相似实体"""
        merged = []
        for entity in entities:
            # 检查是否有相似的实体已经存在
            similar_found = False
            for merged_entity in merged:
                if self._is_similar_entity(entity['text'], merged_entity['text']):
                    # 合并实体，保留置信度更高的
                    if entity['confidence'] > merged_entity['confidence']:
                        merged_entity.update(entity)
                    similar_found = True
                    break
            
            if not similar_found:
                merged.append(entity)
        
        return merged
    
    def _is_similar_entity(self, text1: str, text2: str) -> bool:
        """判断两个实体是否相似"""
        # 简单的相似度判断
        return text1.lower() == text2.lower() or text1 in text2 or text2 in text1
    
    def _deduplicate_relations(self, relations: List[Dict]) -> List[Dict]:
        """去重关系"""
        seen = set()
        unique_relations = []
        
        for relation in relations:
            key = (relation['subject'], relation['predicate'], relation['object'])
            if key not in seen:
                seen.add(key)
                unique_relations.append(relation)
        
        return unique_relations