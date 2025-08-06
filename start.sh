#!/bin/bash

# 多模态知识图谱系统启动脚本

echo "🚀 启动多模态知识图谱系统..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker compose &> /dev/null; then
    echo "❌ 错误: Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建环境配置文件
if [ ! -f .env ]; then
    echo "📝 创建环境配置文件..."
    cp env.example .env
    echo "✅ 已创建 .env 文件，请根据需要修改配置"
fi

# 创建上传目录
mkdir -p uploads

# 启动服务
echo "🔧 构建并启动服务..."
docker compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."

# 检查后端
if curl -s -f http://localhost:8000/ > /dev/null; then
    echo "✅ 后端服务已启动: http://localhost:8000"
else
    echo "❌ 后端服务启动失败"
fi

# 检查前端
if curl -s -f http://localhost:3000/ > /dev/null; then
    echo "✅ 前端服务已启动: http://localhost:3000"
else
    echo "❌ 前端服务启动失败"
fi

# 检查Neo4j
if curl -s -f http://localhost:7474/ > /dev/null; then
    echo "✅ Neo4j服务已启动: http://localhost:7474"
else
    echo "❌ Neo4j服务启动失败"
fi

echo ""
echo "🎉 系统启动完成！"
echo ""
echo "📱 访问地址:"
echo "   前端应用: http://localhost:3000"
echo "   后端API:  http://localhost:8000"
echo "   API文档:  http://localhost:8000/docs"
echo "   Neo4j:    http://localhost:7474"
echo ""
echo "🔑 默认登录账号:"
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "📚 使用帮助:"
echo "   用户指南: docs/USER_GUIDE.md"
echo "   API文档:  docs/API.md"
echo "   部署指南: docs/DEPLOYMENT.md"
echo ""
echo "📄 示例数据: sample_data/sample_text.txt"
echo ""
echo "🛑 停止服务: docker compose down"
echo "📊 查看日志: docker compose logs -f"