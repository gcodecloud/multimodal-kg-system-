FROM node:18-alpine

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 配置npm使用阿里云源并安装依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 使用nginx服务静态文件
FROM nginx:alpine

# 复制构建好的文件到nginx
COPY --from=0 /app/build /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 3000

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]