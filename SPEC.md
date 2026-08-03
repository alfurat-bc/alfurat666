# Murdoch University Survey System - 技术规范文档

## 1. 项目概述

**项目名称**: Murdoch University International Student Travel Survey System
**项目类型**: 全栈Web应用（前后端分离）
**核心功能**: 面向默多克大学国际学生的旅行习惯问卷调查系统，支持多角色管理、二维码生成、数据可视化
**目标用户**:
- 超级管理员：平台运营者
- 普通发布者：研究人员/学生
- 受访者：国际学生

## 2. 技术栈

### 前端
- React 18 + TypeScript
- Vite (构建工具)
- Tailwind CSS (样式)
- Recharts (数据可视化)
- React Router (路由)
- QRCode (二维码生成)

### 后端
- Node.js + Express
- SQLite (数据库，使用better-sqlite3)
- JWT (身份认证)
- CORS (跨域支持)
- Helmet (安全头)
- qrcode (二维码生成)

### 部署
- Docker + Docker Compose
- Nginx (反向代理)
- HTTPS (海外服务器)

## 3. 功能模块

### 3.1 用户系统

| 角色 | 权限 |
|------|------|
| 超级管理员 | 全站管理、用户管理、问卷审核、数据统计 |
| 普通发布者 | 注册登录、创建问卷、管理自己的问卷、查看自己的数据、导出PDF/二维码 |
| 受访者 | 扫码、填写问卷、提交 |

### 3.2 问卷系统

**预置问卷**: Travel Habits of International Students at Murdoch University

**10道固定题目**:
1. How often do you travel during your studies? (单选)
2. What is your primary mode of transportation? (单选)
3. Which countries or regions have you visited? (多选)
4. What is your average travel budget per trip? (单选)
5. Who do you usually travel with? (多选)
6. What factors influence your travel decisions? (多选)
7. How do you usually book your travel arrangements? (单选)
8. What type of accommodation do you prefer when traveling? (单选)
9. What activities do you enjoy most while traveling? (多选)
10. Please share any memorable travel experiences at Murdoch University (文本)

### 3.3 二维码系统

- ISO/IEC 18004 国际标准
- QR Code Version 2 (中等密度)
- 容错率: M (15%)
- PNG格式高清下载
- 永久有效，链接问卷最新版本

### 3.4 数据可视化

- 饼图：展示各选项占比
- 柱状图：展示各题作答分布
- 表格导出：CSV格式
- 答卷总数统计

## 4. 页面结构

### 前台（英文/受访者）
- `/` - 首页（英文问卷页面）
- `/survey/:id` - 问卷填写页
- `/info-sheet` - 参与者知情告知书

### 后台（中文/发布者）
- `/admin/login` - 管理员登录
- `/admin/dashboard` - 发布者仪表盘
- `/admin/surveys` - 问卷管理
- `/admin/surveys/create` - 创建问卷
- `/admin/surveys/edit/:id` - 编辑问卷
- `/admin/surveys/responses/:id` - 查看数据
- `/admin/register` - 用户注册

### 超级管理员后台
- `/super/login` - 超级管理员登录
- `/super/dashboard` - 全局统计
- `/super/users` - 用户管理
- `/super/surveys` - 全站问卷管理

## 5. 数据库设计

### users表
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'super_admin', 'admin', 'user'
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);
```

### surveys表
```sql
CREATE TABLE surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  questions TEXT NOT NULL, -- JSON
  is_published BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### responses表
```sql
CREATE TABLE responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id INTEGER NOT NULL,
  answers TEXT NOT NULL, -- JSON
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id)
);
```

## 6. API接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

### 问卷
- `GET /api/surveys` - 获取问卷列表
- `GET /api/surveys/:id` - 获取问卷详情
- `POST /api/surveys` - 创建问卷
- `PUT /api/surveys/:id` - 更新问卷
- `DELETE /api/surveys/:id` - 删除问卷
- `POST /api/surveys/:id/publish` - 发布问卷
- `GET /api/surveys/:id/qrcode` - 获取二维码

### 答卷
- `POST /api/surveys/:id/responses` - 提交答卷
- `GET /api/surveys/:id/responses` - 获取答卷列表
- `GET /api/surveys/:id/analytics` - 获取分析数据

### 管理员
- `GET /api/admin/users` - 用户列表
- `PUT /api/admin/users/:id/toggle-active` - 启用/禁用用户
- `DELETE /api/admin/surveys/:id` - 删除问卷

## 7. 样式规范

### 颜色
- 主色: `#10B981` (绿色，高校学术风格)
- 次色: `#059669`
- 强调: `#34D399`
- 背景: `#F0FDF4`
- 文字: `#1F2937`
- 边框: `#D1D5DB`

### 字体
- 标题: Inter, sans-serif
- 正文: Inter, sans-serif

### 布局
- 最大宽度: 1200px
- 卡片圆角: 8px
- 间距: 4px基数

## 8. 部署要求

### 服务器要求
- 海外云服务器（推荐AWS、Google Cloud、DigitalOcean澳洲节点）
- Node.js 18+
- Docker + Docker Compose
- Nginx
- HTTPS证书

### 环境变量
```
DATABASE_URL=./data/survey.db
JWT_SECRET=your-secret-key
BASE_URL=https://your-domain.com
PORT=3000
```

## 9. 安全措施

- JWT Token认证
- 密码bcrypt加密
- CORS配置
- Helmet安全头
- SQL参数化查询
- 输入验证

## 10. 交付清单

1. 前后端完整源代码
2. Docker部署配置
3. 数据库初始化脚本
4. 中文部署教程
5. 分角色操作手册
6. PDF导出功能
7. 二维码生成功能
