from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import uvicorn
import os
from typing import List, Optional
import json

from database import SessionLocal, engine, Base
from models import User, FileRecord, KnowledgeGraph
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from schemas import UserCreate, UserLogin, UserResponse, FileResponse, GraphResponse
from file_handler import FileProcessor
from knowledge_graph import KnowledgeGraphBuilder
from nlp_processor import NLPProcessor

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="多模态知识图谱系统",
    description="一个支持文本、图像、视频的知识图谱构建和可视化系统",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

security = HTTPBearer()

# 依赖注入
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 初始化处理器
file_processor = FileProcessor()
nlp_processor = NLPProcessor()
kg_builder = KnowledgeGraphBuilder()

@app.on_event("startup")
async def startup_event():
    """启动时初始化"""
    # 创建默认管理员用户
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                is_admin=True
            )
            db.add(admin_user)
            db.commit()
            print("Created default admin user: admin/admin123")
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "多模态知识图谱系统 API", "version": "1.0.0"}

# 用户认证相关接口
@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="邮箱已存在")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        is_admin=db_user.is_admin
    )

@app.post("/auth/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    access_token = create_access_token(data={"sub": db_user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            is_admin=db_user.is_admin
        )
    }

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_admin=current_user.is_admin
    )

# 文件管理接口
@app.post("/files/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """上传文件"""
    # 检查文件类型
    allowed_extensions = ['.txt', '.pdf', '.docx', '.jpg', '.png', '.jpeg']
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="不支持的文件类型")
    
    # 保存文件
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{current_user.id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # 记录到数据库
    file_record = FileRecord(
        filename=file.filename,
        file_path=file_path,
        file_type=file_extension,
        file_size=len(content),
        user_id=current_user.id,
        status="uploaded"
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    
    # 异步处理文件（这里简化为同步）
    try:
        await process_file_async(file_record.id, db)
    except Exception as e:
        file_record.status = "error"
        file_record.error_message = str(e)
        db.commit()
    
    return FileResponse(
        id=file_record.id,
        filename=file_record.filename,
        file_type=file_record.file_type,
        file_size=file_record.file_size,
        status=file_record.status,
        created_at=file_record.created_at
    )

async def process_file_async(file_id: int, db: Session):
    """异步处理文件"""
    file_record = db.query(FileRecord).filter(FileRecord.id == file_id).first()
    if not file_record:
        return
    
    try:
        file_record.status = "processing"
        db.commit()
        
        # 处理文件内容
        content = file_processor.extract_text(file_record.file_path, file_record.file_type)
        
        # NLP处理
        entities, relations = nlp_processor.extract_knowledge(content)
        
        # 构建知识图谱
        graph_data = kg_builder.build_graph(entities, relations, file_record.id)
        
        # 保存图谱数据
        kg_record = KnowledgeGraph(
            file_id=file_record.id,
            entities=json.dumps(entities, ensure_ascii=False),
            relations=json.dumps(relations, ensure_ascii=False),
            graph_data=json.dumps(graph_data, ensure_ascii=False)
        )
        db.add(kg_record)
        
        file_record.status = "completed"
        db.commit()
        
    except Exception as e:
        file_record.status = "error"
        file_record.error_message = str(e)
        db.commit()
        raise

@app.get("/files", response_model=List[FileResponse])
async def get_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取文件列表"""
    files = db.query(FileRecord).filter(FileRecord.user_id == current_user.id).all()
    return [
        FileResponse(
            id=file.id,
            filename=file.filename,
            file_type=file.file_type,
            file_size=file.file_size,
            status=file.status,
            created_at=file.created_at
        )
        for file in files
    ]

@app.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除文件"""
    file_record = db.query(FileRecord).filter(
        FileRecord.id == file_id,
        FileRecord.user_id == current_user.id
    ).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="文件不存在")
    
    # 删除物理文件
    if os.path.exists(file_record.file_path):
        os.remove(file_record.file_path)
    
    # 删除数据库记录
    db.delete(file_record)
    db.commit()
    
    return {"message": "文件删除成功"}

# 知识图谱接口
@app.get("/graph/{file_id}", response_model=GraphResponse)
async def get_graph(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取文件的知识图谱"""
    file_record = db.query(FileRecord).filter(
        FileRecord.id == file_id,
        FileRecord.user_id == current_user.id
    ).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="文件不存在")
    
    kg_record = db.query(KnowledgeGraph).filter(
        KnowledgeGraph.file_id == file_id
    ).first()
    
    if not kg_record:
        raise HTTPException(status_code=404, detail="知识图谱不存在")
    
    return GraphResponse(
        id=kg_record.id,
        file_id=kg_record.file_id,
        entities=json.loads(kg_record.entities),
        relations=json.loads(kg_record.relations),
        graph_data=json.loads(kg_record.graph_data)
    )

@app.get("/graph/search")
async def search_graph(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """搜索知识图谱"""
    # 获取用户的所有图谱数据
    user_files = db.query(FileRecord).filter(FileRecord.user_id == current_user.id).all()
    file_ids = [f.id for f in user_files]
    
    kg_records = db.query(KnowledgeGraph).filter(
        KnowledgeGraph.file_id.in_(file_ids)
    ).all()
    
    results = []
    for kg in kg_records:
        entities = json.loads(kg.entities)
        relations = json.loads(kg.relations)
        
        # 简单的关键词匹配
        for entity in entities:
            if query.lower() in entity.get('text', '').lower():
                results.append({
                    'type': 'entity',
                    'data': entity,
                    'file_id': kg.file_id
                })
        
        for relation in relations:
            if query.lower() in relation.get('relation', '').lower():
                results.append({
                    'type': 'relation',
                    'data': relation,
                    'file_id': kg.file_id
                })
    
    return {"results": results[:20]}  # 限制返回结果数量

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)