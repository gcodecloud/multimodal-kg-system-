# 多模态知识图谱系统 Demo

一个功能完整的多模态知识图谱构建和可视化演示系统。

## 功能特性

- 🔧 **文本处理**: NER 实体识别、关系抽取、知识图谱构建
- 📊 **可视化**: 交互式图谱可视化界面
- 📁 **文件管理**: 支持多格式文件上传和处理
- 👥 **用户管理**: 基于角色的权限控制
- 🐳 **容器化**: Docker 一键部署

## 技术栈

### 后端

- FastAPI - 高性能 Web 框架
- Neo4j - 图数据库
- spaCy - NLP 处理
- SQLite - 用户数据存储

### 前端

- React - UI 框架
- D3.js - 图谱可视化
- Ant Design - UI 组件库
- Axios - HTTP 客户端

## 快速开始

### 1. 使用 Docker 部署（推荐）

```bash
# 克隆项目到本地
cd multimodal-kg-system

# 初始化环境配置
make init

# 构建并启动服务
make start

# 访问系统
# 前端: http://localhost:3000
# 后端API: http://localhost:8000
# API文档: http://localhost:8000/docs
# Neo4j浏览器: http://localhost:7474 (neo4j/password)
```

**默认登录账号**: admin / admin123

### 2. 本地开发

#### 后端设置

```bash
cd backend
pip install -r requirements.txt
python -m spacy download zh_core_web_sm
uvicorn main:app --reload --port 8000
```

#### 前端设置

```bash
cd frontend
npm install
npm start
```

#### Neo4j 设置

```bash
# 启动Neo4j（需要Java 11+）
neo4j start
# 或使用Docker
docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j
```

## 使用说明

1. **登录系统**: 默认管理员账号 admin/admin123
2. **上传文件**: 支持.txt、.pdf、.docx、.jpg、.png 格式，最大 100MB
3. **查看图谱**: 自动处理后在可视化界面查看知识图谱
4. **交互操作**: 拖拽、缩放、筛选、搜索节点和关系
5. **数据管理**: 文件管理、用户管理、图谱导出

### 快速体验

系统包含示例数据，可以直接：

1. 上传 `sample_data/sample_text.txt` 文件
2. 等待处理完成（约 30 秒）
3. 在知识图谱页面查看抽取结果
4. 尝试搜索"苹果公司"、"史蒂夫·乔布斯"等实体

## 系统架构

```
multimodal-kg-system/
├── backend/              # FastAPI后端服务
├── frontend/             # React前端应用
├── docker-compose.yml    # Docker编排配置
└── docs/                 # 文档
```

## 功能特性详解

### 📝 文本处理能力

- 中文分词和清洗
- 命名实体识别（人名、组织、地点等）
- 关系抽取（SPO 三元组）
- 实体消歧和标准化

### 🖼️ 多模态支持

- OCR 文字识别（图片转文本）
- PDF 文档解析
- Word 文档处理
- 批量文件上传

### 📊 知识图谱构建

- 自动实体链接
- 关系网络构建
- Neo4j 图数据库存储
- 增量图谱更新

### 🎨 可视化界面

- D3.js 交互式图谱
- 节点拖拽和缩放
- 实体类型颜色编码
- 关系路径高亮

### 🔍 智能搜索

- 实体和关系搜索
- 模糊匹配支持
- 搜索结果高亮
- 图谱筛选功能

### 👥 用户管理

- 基于角色的权限控制
- 管理员用户管理
- JWT 身份认证
- 安全 API 接口

## API 文档

启动后端服务后访问: http://localhost:8000/docs

详细 API 文档: [docs/API.md](docs/API.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
# multimodal-kg-system-
