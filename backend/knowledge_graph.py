from neo4j import GraphDatabase
from typing import List, Dict, Any, Tuple
import json
import uuid
from database import get_neo4j_driver

class KnowledgeGraphBuilder:
    """知识图谱构建器"""
    
    def __init__(self):
        self.driver = None
        self._connect()
    
    def _connect(self):
        """连接Neo4j数据库"""
        try:
            self.driver = get_neo4j_driver()
            # 测试连接
            with self.driver.session() as session:
                session.run("RETURN 1")
            print("Neo4j连接成功")
        except Exception as e:
            print(f"Neo4j连接失败: {e}")
            self.driver = None
    
    def build_graph(self, entities: List[Dict], relations: List[Dict], file_id: int) -> Dict[str, Any]:
        """构建知识图谱"""
        if not self.driver:
            # 如果Neo4j不可用，返回简化的图谱数据
            return self._build_simple_graph(entities, relations, file_id)
        
        try:
            with self.driver.session() as session:
                # 创建实体节点
                node_mapping = {}
                for entity in entities:
                    node_id = self._create_entity_node(session, entity, file_id)
                    node_mapping[entity['text']] = node_id
                
                # 创建关系边
                for relation in relations:
                    self._create_relation_edge(session, relation, node_mapping, file_id)
                
                # 获取图谱数据用于可视化
                graph_data = self._get_graph_visualization_data(session, file_id)
                
                return graph_data
        
        except Exception as e:
            print(f"Neo4j图谱构建失败: {e}")
            return self._build_simple_graph(entities, relations, file_id)
    
    def _create_entity_node(self, session, entity: Dict, file_id: int) -> str:
        """创建实体节点"""
        node_id = str(uuid.uuid4())
        
        query = """
        MERGE (n:Entity {text: $text, file_id: $file_id})
        ON CREATE SET n.id = $node_id, n.label = $label, n.confidence = $confidence,
                     n.start = $start, n.end = $end, n.created_at = datetime()
        ON MATCH SET n.confidence = CASE WHEN n.confidence < $confidence THEN $confidence ELSE n.confidence END
        RETURN n.id as id
        """
        
        result = session.run(query, {
            'text': entity['text'],
            'file_id': file_id,
            'node_id': node_id,
            'label': entity['label'],
            'confidence': entity.get('confidence', 0.0),
            'start': entity.get('start', 0),
            'end': entity.get('end', 0)
        })
        
        record = result.single()
        return record['id'] if record else node_id
    
    def _create_relation_edge(self, session, relation: Dict, node_mapping: Dict, file_id: int):
        """创建关系边"""
        subject_id = node_mapping.get(relation['subject'])
        object_id = node_mapping.get(relation['object'])
        
        if not subject_id or not object_id:
            return
        
        query = """
        MATCH (s:Entity {id: $subject_id}), (o:Entity {id: $object_id})
        MERGE (s)-[r:RELATION {type: $relation_type, file_id: $file_id}]->(o)
        ON CREATE SET r.confidence = $confidence, r.context = $context, 
                     r.created_at = datetime()
        ON MATCH SET r.confidence = CASE WHEN r.confidence < $confidence THEN $confidence ELSE r.confidence END
        """
        
        session.run(query, {
            'subject_id': subject_id,
            'object_id': object_id,
            'relation_type': relation['predicate'],
            'file_id': file_id,
            'confidence': relation.get('confidence', 0.0),
            'context': relation.get('context', '')
        })
    
    def _get_graph_visualization_data(self, session, file_id: int) -> Dict[str, Any]:
        """获取图谱可视化数据"""
        # 获取节点
        nodes_query = """
        MATCH (n:Entity {file_id: $file_id})
        RETURN n.id as id, n.text as text, n.label as label, 
               n.confidence as confidence
        """
        
        nodes_result = session.run(nodes_query, {'file_id': file_id})
        nodes = []
        for record in nodes_result:
            nodes.append({
                'id': record['id'],
                'label': record['text'],
                'type': record['label'],
                'confidence': record['confidence'],
                'size': min(max(record['confidence'] * 20, 10), 30)  # 节点大小
            })
        
        # 获取边
        edges_query = """
        MATCH (s:Entity {file_id: $file_id})-[r:RELATION {file_id: $file_id}]->(o:Entity {file_id: $file_id})
        RETURN s.id as source, o.id as target, r.type as relation, 
               r.confidence as confidence, r.context as context
        """
        
        edges_result = session.run(edges_query, {'file_id': file_id})
        edges = []
        for record in edges_result:
            edges.append({
                'source': record['source'],
                'target': record['target'],
                'relation': record['relation'],
                'confidence': record['confidence'],
                'context': record['context'],
                'width': max(record['confidence'] * 3, 1)  # 边宽度
            })
        
        return {
            'nodes': nodes,
            'edges': edges,
            'stats': {
                'total_nodes': len(nodes),
                'total_edges': len(edges)
            }
        }
    
    def _build_simple_graph(self, entities: List[Dict], relations: List[Dict], file_id: int) -> Dict[str, Any]:
        """构建简化的图谱数据（不使用Neo4j）"""
        # 创建节点
        nodes = []
        node_mapping = {}
        
        for i, entity in enumerate(entities):
            node_id = f"node_{i}"
            node_mapping[entity['text']] = node_id
            nodes.append({
                'id': node_id,
                'label': entity['text'],
                'type': entity['label'],
                'confidence': entity.get('confidence', 0.0),
                'size': min(max(entity.get('confidence', 0.5) * 20, 10), 30)
            })
        
        # 创建边
        edges = []
        for i, relation in enumerate(relations):
            source_id = node_mapping.get(relation['subject'])
            target_id = node_mapping.get(relation['object'])
            
            if source_id and target_id:
                edges.append({
                    'id': f"edge_{i}",
                    'source': source_id,
                    'target': target_id,
                    'relation': relation['predicate'],
                    'confidence': relation.get('confidence', 0.0),
                    'context': relation.get('context', ''),
                    'width': max(relation.get('confidence', 0.5) * 3, 1)
                })
        
        return {
            'nodes': nodes,
            'edges': edges,
            'stats': {
                'total_nodes': len(nodes),
                'total_edges': len(edges)
            }
        }
    
    def search_entities(self, query: str, limit: int = 20) -> List[Dict]:
        """搜索实体"""
        if not self.driver:
            return []
        
        try:
            with self.driver.session() as session:
                search_query = """
                MATCH (n:Entity)
                WHERE toLower(n.text) CONTAINS toLower($query)
                RETURN n.id as id, n.text as text, n.label as label, 
                       n.confidence as confidence, n.file_id as file_id
                ORDER BY n.confidence DESC
                LIMIT $limit
                """
                
                result = session.run(search_query, {'query': query, 'limit': limit})
                entities = []
                for record in result:
                    entities.append({
                        'id': record['id'],
                        'text': record['text'],
                        'label': record['label'],
                        'confidence': record['confidence'],
                        'file_id': record['file_id']
                    })
                
                return entities
        
        except Exception as e:
            print(f"实体搜索失败: {e}")
            return []
    
    def find_paths(self, start_entity: str, end_entity: str, max_depth: int = 3) -> List[List[Dict]]:
        """查找两个实体之间的路径"""
        if not self.driver:
            return []
        
        try:
            with self.driver.session() as session:
                path_query = """
                MATCH path = shortestPath((start:Entity {text: $start})-[*1..$max_depth]-(end:Entity {text: $end}))
                RETURN path
                LIMIT 10
                """
                
                result = session.run(path_query, {
                    'start': start_entity,
                    'end': end_entity,
                    'max_depth': max_depth
                })
                
                paths = []
                for record in result:
                    path = record['path']
                    path_data = []
                    
                    for i in range(len(path.nodes)):
                        node = path.nodes[i]
                        path_data.append({
                            'type': 'node',
                            'id': node['id'],
                            'text': node['text'],
                            'label': node['label']
                        })
                        
                        if i < len(path.relationships):
                            rel = path.relationships[i]
                            path_data.append({
                                'type': 'relationship',
                                'relation': rel['type'],
                                'confidence': rel.get('confidence', 0.0)
                            })
                    
                    paths.append(path_data)
                
                return paths
        
        except Exception as e:
            print(f"路径查找失败: {e}")
            return []
    
    def get_graph_stats(self, file_id: int = None) -> Dict[str, Any]:
        """获取图谱统计信息"""
        if not self.driver:
            return {'total_entities': 0, 'total_relations': 0}
        
        try:
            with self.driver.session() as session:
                if file_id:
                    # 特定文件的统计
                    stats_query = """
                    MATCH (n:Entity {file_id: $file_id})
                    OPTIONAL MATCH (n)-[r:RELATION {file_id: $file_id}]->(m)
                    RETURN count(DISTINCT n) as entities, count(r) as relations,
                           collect(DISTINCT n.label) as entity_types,
                           collect(DISTINCT r.type) as relation_types
                    """
                    result = session.run(stats_query, {'file_id': file_id})
                else:
                    # 全局统计
                    stats_query = """
                    MATCH (n:Entity)
                    OPTIONAL MATCH (n)-[r:RELATION]->(m)
                    RETURN count(DISTINCT n) as entities, count(r) as relations,
                           collect(DISTINCT n.label) as entity_types,
                           collect(DISTINCT r.type) as relation_types
                    """
                    result = session.run(stats_query)
                
                record = result.single()
                if record:
                    return {
                        'total_entities': record['entities'],
                        'total_relations': record['relations'],
                        'entity_types': record['entity_types'],
                        'relation_types': record['relation_types']
                    }
                
                return {'total_entities': 0, 'total_relations': 0}
        
        except Exception as e:
            print(f"统计信息获取失败: {e}")
            return {'total_entities': 0, 'total_relations': 0}
    
    def close(self):
        """关闭连接"""
        if self.driver:
            self.driver.close()