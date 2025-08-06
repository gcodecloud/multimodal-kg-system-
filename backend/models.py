from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    """用户模型"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    files = relationship("FileRecord", back_populates="user")

class FileRecord(Base):
    """文件记录模型"""
    __tablename__ = "file_records"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # .txt, .pdf, .docx, .jpg, etc.
    file_size = Column(Integer, nullable=False)
    status = Column(String, default="uploaded")  # uploaded, processing, completed, error
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 外键
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 关系
    user = relationship("User", back_populates="files")
    knowledge_graphs = relationship("KnowledgeGraph", back_populates="file")

class KnowledgeGraph(Base):
    """知识图谱模型"""
    __tablename__ = "knowledge_graphs"
    
    id = Column(Integer, primary_key=True, index=True)
    entities = Column(Text)  # JSON格式存储实体数据
    relations = Column(Text)  # JSON格式存储关系数据
    graph_data = Column(Text)  # JSON格式存储图谱可视化数据
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 外键
    file_id = Column(Integer, ForeignKey("file_records.id"), nullable=False)
    
    # 关系
    file = relationship("FileRecord", back_populates="knowledge_graphs")

class EntityType(Base):
    """实体类型模型"""
    __tablename__ = "entity_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # 人名、组织、地点等
    color = Column(String, default="#1f77b4")  # 可视化颜色
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RelationType(Base):
    """关系类型模型"""
    __tablename__ = "relation_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # 工作于、位于等
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())