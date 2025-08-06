FROM python:3.11-slim

WORKDIR /app

# 配置阿里云APT源
RUN echo "deb http://mirrors.aliyun.com/debian/ bookworm main non-free contrib" > /etc/apt/sources.list && \
    echo "deb-src http://mirrors.aliyun.com/debian/ bookworm main non-free contrib" >> /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian-security/ bookworm-security main" >> /etc/apt/sources.list && \
    echo "deb-src http://mirrors.aliyun.com/debian-security/ bookworm-security main" >> /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian/ bookworm-updates main non-free contrib" >> /etc/apt/sources.list && \
    echo "deb-src http://mirrors.aliyun.com/debian/ bookworm-updates main non-free contrib" >> /etc/apt/sources.list

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 配置pip使用阿里云源并安装Python依赖
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    pip config set install.trusted-host mirrors.aliyun.com && \
    pip install --no-cache-dir -r requirements.txt

# 下载spaCy中文模型
RUN python -m spacy download zh_core_web_sm

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p /app/uploads

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]