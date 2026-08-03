# Vercel 部署指南

## 一、项目结构

```
murdoch-survey/
├── api/
│   ├── index.py           # Flask 后端 (Turso 数据库)
│   └── requirements.txt   # Python 依赖
├── client/                # React 前端
│   ├── src/              # 源码
│   └── dist/             # 打包输出
├── vercel.json           # Vercel 配置
└── dist/client/         # 前端构建产物
```

## 二、Turso 数据库设置

### 1. 注册 Turso

1. 访问 https://turso.tech 注册账号
2. 可用 GitHub 登录

### 2. 创建数据库

```bash
# 安装 Turso CLI (Linux/macOS)
curl -sSfL https://get.tur.so/install.sh | bash

# Windows 用户可直接在 Turso Dashboard 创建
```

### 3. 获取连接凭证

登录 Turso Dashboard (https://dashboard.turso.tech):

1. 点击 "New Database"
2. 输入数据库名称，如 `murdoch-survey`
3. 选择区域 (推荐: `sin` 新加坡 或 `tyo` 东京)
4. 创建后，进入数据库详情页

**复制以下两个值:**

- **Database URL**: `libsql://your-db-name.turso.io`
- **Auth Token**: 在 "Authentication" 标签页生成

## 三、Vercel 环境变量配置

登录 Vercel Dashboard: https://vercel.com/dashboard

### 1. 创建新项目

1. 点击 "Add New" → "Project"
2. 导入你的 GitHub 仓库
3. 点击 "Environment Variables"

### 2. 添加环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `TURSO_DATABASE_URL` | `libsql://your-db-name.turso.io` | Turso 数据库地址 |
| `TURSO_AUTH_TOKEN` | `your-auth-token-here` | Turso 认证令牌 |
| `JWT_SECRET` | `your-secure-jwt-secret-key` | JWT 密钥 (随机生成) |
| `ADMIN_EMAIL` | `admin@your-domain.com` | 管理员邮箱 |
| `ADMIN_PASSWORD` | `YourSecurePassword123!` | 管理员密码 |
| `BASE_URL` | `https://your-project.vercel.app` | 你的 Vercel 域名 |

**提示**: 生成随机 JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 四、部署步骤

### 方式 1: Git 集成部署 (推荐)

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 导入仓库
3. 配置环境变量 (上一步)
4. 点击 "Deploy"

### 方式 2: Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署到预览
vercel

# 部署到生产
vercel --prod
```

## 五、首次部署后操作

### 1. 检查部署状态

访问 `https://your-project.vercel.app/api/health`，应返回:
```json
{"status": "ok", "timestamp": "2024-..."}
```

### 2. 初始化数据库

部署后首次访问任意 API 端点，系统会自动:
- 创建 `users`、`surveys`、`responses` 表
- 创建默认管理员账号
- 创建示例问卷

### 3. 访问管理后台

1. 访问 `https://your-project.vercel.app/login`
2. 使用你设置的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 登录

## 六、前端打包命令

本地开发时:

```bash
cd client
npm install
npm run build
```

构建产物输出到 `client/dist/`

## 七、完整环境变量清单

### 开发环境 (.env)

```env
# Turso 数据库
TURSO_DATABASE_URL=libsql://murdoch-survey.turso.io
TURSO_AUTH_TOKEN=your-token-here

# JWT
JWT_SECRET=your-secret-key

# 管理员
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123456

# 基础URL
BASE_URL=http://localhost:5173
```

### 生产环境 (Vercel)

| 变量名 | 示例值 |
|--------|--------|
| `TURSO_DATABASE_URL` | `libsql://murdoch-survey-xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJhbGci...` (长字符串) |
| `JWT_SECRET` | `abc123...` (64位随机字符串) |
| `ADMIN_EMAIL` | `admin@murdoch.edu.au` |
| `ADMIN_PASSWORD` | `YourSecurePassword123!` |
| `BASE_URL` | `https://murdoch-survey.vercel.app` |

## 八、常见问题

### Q: 数据库连接失败

确保:
1. `TURSO_DATABASE_URL` 格式正确
2. `TURSO_AUTH_TOKEN` 未过期
3. Vercel 环境变量已保存

### Q: 管理员账号无法登录

首次部署后，管理员账号会自动创建。检查:
1. `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 环境变量
2. 数据库连接是否正常

### Q: SPA 路由刷新 404

`vercel.json` 已配置所有路由回退到 `index.html`，不会 404。

## 九、更新代码

```bash
# 本地修改后
git add .
git commit -m "Update code"
git push

# Vercel 自动部署
```

或使用 CLI:
```bash
vercel --prod
```
