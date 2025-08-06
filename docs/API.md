# API 文档

## 概述

多模态知识图谱系统提供RESTful API接口，支持用户认证、文件管理、知识图谱构建和查询等功能。

## 基础信息

- **Base URL**: `http://localhost:8000`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`

## 认证接口

### 用户登录

**POST** `/auth/login`

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "is_admin": true
  }
}
```

### 用户注册

**POST** `/auth/register`

```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123"
}
```

### 获取当前用户信息

**GET** `/auth/me`

需要认证Token。

## 文件管理接口

### 上传文件

**POST** `/files/upload`

- Content-Type: `multipart/form-data`
- 支持格式: `.txt`, `.pdf`, `.docx`, `.jpg`, `.png`, `.jpeg`
- 最大大小: 100MB

### 获取文件列表

**GET** `/files`

**响应**:
```json
[
  {
    "id": 1,
    "filename": "sample.txt",
    "file_type": ".txt",
    "file_size": 1024,
    "status": "completed",
    "created_at": "2023-12-01T10:00:00Z"
  }
]
```

### 删除文件

**DELETE** `/files/{file_id}`

## 知识图谱接口

### 获取文件的知识图谱

**GET** `/graph/{file_id}`

**响应**:
```json
{
  "id": 1,
  "file_id": 1,
  "entities": [
    {
      "text": "苹果公司",
      "label": "ORG",
      "start": 0,
      "end": 3,
      "confidence": 0.95
    }
  ],
  "relations": [
    {
      "subject": "苹果公司",
      "predicate": "located_in",
      "object": "库比蒂诺",
      "confidence": 0.85
    }
  ],
  "graph_data": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### 搜索知识图谱

**GET** `/graph/search?query=苹果`

**响应**:
```json
{
  "results": [
    {
      "type": "entity",
      "data": {
        "text": "苹果公司",
        "label": "ORG"
      },
      "file_id": 1
    }
  ]
}
```

## 错误处理

所有API错误都会返回以下格式：

```json
{
  "detail": "错误描述信息"
}
```

常见HTTP状态码：
- `400` - 请求参数错误
- `401` - 未认证或Token过期
- `403` - 权限不足
- `404` - 资源不存在
- `500` - 服务器内部错误

## 认证说明

除了登录和注册接口外，其他所有接口都需要在请求头中包含认证Token：

```
Authorization: Bearer <your_token_here>
```

Token有效期为30分钟，过期后需要重新登录获取新的Token。