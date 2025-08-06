# 部署指南

## 系统要求

### 硬件要求

- CPU: 2 核心以上
- 内存: 4GB 以上
- 存储: 20GB 以上可用空间
- 网络: 稳定的互联网连接

### 软件要求

- Docker 20.10+
- Docker Compose 2.0+
- Git

## 快速部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd multimodal-kg-system
```

### 2. 环境配置

```bash
# 复制环境配置文件
cp env.example .env

# 编辑配置文件（可选）
vim .env
```

### 3. 启动服务

```bash
# 使用Docker Compose启动所有服务
docker-compose up -d

# 或使用Makefile
make start
```

### 4. 验证部署

访问以下地址验证服务是否正常：

- 前端应用: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- Neo4j 浏览器: http://localhost:7474

默认登录账号：

- 用户名: `admin`
- 密码: `admin123`

## 详细部署步骤

### 服务架构

系统包含以下服务：

1. **Frontend** (React): 端口 3000
2. **Backend** (FastAPI): 端口 8000
3. **Neo4j** (图数据库): 端口 7474(HTTP), 7687(Bolt)

### 数据持久化

系统使用 Docker volumes 持久化数据：

- `neo4j_data`: Neo4j 数据库文件
- `./uploads`: 上传文件存储

### 环境变量配置

编辑 `.env` 文件配置以下变量：

```bash
# Neo4j配置
NEO4J_URI=bolt://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_secure_password

# JWT密钥
SECRET_KEY=your_very_secure_secret_key

# 文件上传配置
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=100MB
```

### 网络配置

所有服务运行在自定义 Docker 网络 `kg-network` 中，服务间通过服务名通信。

## 生产环境部署

### 1. 安全配置

```bash
# 更新密码和密钥
vim .env

# 设置复杂的Neo4j密码
NEO4J_PASSWORD=your_very_secure_neo4j_password

# 设置复杂的JWT密钥
SECRET_KEY=your_very_long_and_complex_secret_key
```

### 2. 反向代理配置

使用 Nginx 作为反向代理：

```nginx
# /etc/nginx/sites-available/kg-system
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. SSL 证书配置

```bash
# 使用Certbot获取免费SSL证书
sudo certbot --nginx -d your-domain.com
```

### 4. 防火墙配置

```bash
# 只开放必要端口
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

## 维护操作

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f neo4j
```

### 服务管理

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新服务
git pull
docker-compose build
docker-compose up -d
```

### 数据备份

```bash
# 备份Neo4j数据
docker exec kg-neo4j neo4j-admin dump --database=neo4j --to=/backups/neo4j-backup.dump

# 备份上传文件
tar -czf uploads-backup.tar.gz uploads/
```

### 数据恢复

```bash
# 恢复Neo4j数据
docker exec kg-neo4j neo4j-admin load --from=/backups/neo4j-backup.dump --database=neo4j --force

# 恢复上传文件
tar -xzf uploads-backup.tar.gz
```

## 故障排除

### 常见问题

1. **Neo4j 连接失败**

   - 检查 Neo4j 服务状态
   - 验证连接配置
   - 查看 Neo4j 日志

2. **文件上传失败**

   - 检查 uploads 目录权限
   - 验证文件大小限制
   - 查看后端日志

3. **前端无法访问后端**
   - 检查 API 地址配置
   - 验证 CORS 设置
   - 检查网络连接

### 日志位置

- 后端日志: Docker 容器内，通过 `docker-compose logs backend` 查看
- Neo4j 日志: `/var/lib/neo4j/logs/`
- Nginx 日志: `/var/log/nginx/`

### 性能优化

1. **数据库优化**

   - 增加 Neo4j 内存配置
   - 创建适当的索引
   - 定期清理无用数据

2. **应用优化**
   - 启用 Redis 缓存
   - 使用 CDN 加速静态资源
   - 配置 Gzip 压缩

## 监控

### 健康检查

```bash
# 检查所有服务状态
make health

# 手动检查
curl -f http://localhost:8000/
curl -f http://localhost:3000/
curl -f http://localhost:7474/
```

### 资源监控

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用情况
df -h
```
