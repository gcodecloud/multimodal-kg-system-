# 多模态知识图谱系统 Makefile

.PHONY: help build start stop clean install dev test

# 默认目标
help:
	@echo "多模态知识图谱系统 - 可用命令:"
	@echo "  build     - 构建Docker镜像"
	@echo "  start     - 启动所有服务"
	@echo "  stop      - 停止所有服务"
	@echo "  restart   - 重启所有服务"
	@echo "  logs      - 查看服务日志"
	@echo "  clean     - 清理Docker资源"
	@echo "  install   - 安装本地开发依赖"
	@echo "  dev       - 启动开发模式"
	@echo "  test      - 运行测试"

# 构建Docker镜像
build:
	@echo "构建Docker镜像..."
	docker compose build

# 启动所有服务
start:
	@echo "启动所有服务..."
	docker compose up -d
	@echo "服务已启动!"
	@echo "前端: http://localhost:3000"
	@echo "后端API: http://localhost:8000"
	@echo "Neo4j浏览器: http://localhost:7474"

# 停止所有服务
stop:
	@echo "停止所有服务..."
	docker compose down

# 重启所有服务
restart: stop start

# 查看服务日志
logs:
	docker compose logs -f

# 查看特定服务日志
logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-neo4j:
	docker compose logs -f neo4j

# 清理Docker资源
clean:
	@echo "清理Docker资源..."
	docker compose down -v
	docker system prune -f

# 安装本地开发依赖
install:
	@echo "安装后端依赖..."
	cd backend && pip install -r requirements.txt
	@echo "下载spaCy中文模型..."
	python -m spacy download zh_core_web_sm
	@echo "安装前端依赖..."
	cd frontend && npm install

# 启动开发模式
dev-backend:
	@echo "启动后端开发服务器..."
	cd backend && uvicorn main:app --reload --port 8000

dev-frontend:
	@echo "启动前端开发服务器..."
	cd frontend && npm start

dev-neo4j:
	@echo "启动Neo4j开发环境..."
	docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j

# 初始化项目
init:
	@echo "初始化项目..."
	cp env.example .env
	mkdir -p uploads
	@echo "请编辑 .env 文件配置环境变量"

# 运行测试
test:
	@echo "运行后端测试..."
	cd backend && python -m pytest
	@echo "运行前端测试..."
	cd frontend && npm test

# 生产部署
deploy: build
	@echo "部署到生产环境..."
	docker compose -f docker compose.yml -f docker compose.prod.yml up -d

# 数据备份
backup:
	@echo "备份数据..."
	mkdir -p backups
	docker exec kg-neo4j neo4j-admin dump --database=neo4j --to=/backups/neo4j-$(shell date +%Y%m%d_%H%M%S).dump

# 数据恢复
restore:
	@echo "恢复数据..."
	@echo "请指定备份文件: make restore FILE=backup_file.dump"

# 健康检查
health:
	@echo "检查服务状态..."
	curl -f http://localhost:8000/ || echo "后端服务异常"
	curl -f http://localhost:3000/ || echo "前端服务异常"
	curl -f http://localhost:7474/ || echo "Neo4j服务异常"