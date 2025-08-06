from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime

# 用户相关Schema
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_admin: bool
    
    class Config:
        from_attributes = True

# 文件相关Schema
class FileBase(BaseModel):
    filename: str
    file_type: str
    file_size: int

class FileResponse(FileBase):
    id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# 知识图谱相关Schema
class EntitySchema(BaseModel):
    text: str
    label: str
    start: int
    end: int
    confidence: Optional[float] = None

class RelationSchema(BaseModel):
    subject: str
    predicate: str
    object: str
    confidence: Optional[float] = None
    context: Optional[str] = None

class GraphNodeSchema(BaseModel):
    id: str
    label: str
    type: str
    properties: Dict[str, Any] = {}

class GraphEdgeSchema(BaseModel):
    source: str
    target: str
    relation: str
    properties: Dict[str, Any] = {}

class GraphResponse(BaseModel):
    id: int
    file_id: int
    entities: List[EntitySchema]
    relations: List[RelationSchema]
    graph_data: Dict[str, Any]
    
    class Config:
        from_attributes = True

# 搜索相关Schema
class SearchRequest(BaseModel):
    query: str
    entity_types: Optional[List[str]] = None
    relation_types: Optional[List[str]] = None
    limit: Optional[int] = 20

class SearchResult(BaseModel):
    type: str  # 'entity' or 'relation'
    data: Dict[str, Any]
    file_id: int
    score: Optional[float] = None

# 图谱分析相关Schema
class PathRequest(BaseModel):
    start_node: str
    end_node: str
    max_depth: Optional[int] = 3

class PathResponse(BaseModel):
    paths: List[List[Dict[str, Any]]]
    total_count: int

# 统计相关Schema
class GraphStats(BaseModel):
    total_entities: int
    total_relations: int
    entity_types: Dict[str, int]
    relation_types: Dict[str, int]
    files_processed: int