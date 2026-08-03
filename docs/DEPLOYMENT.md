# Murdoch University Survey System - 部署教程

## 目录
1. [服务器要求](#服务器要求)
2. [快速部署 (Docker)](#快速部署-docker)
3. [手动部署](#手动部署)
4. [SSL证书配置](#ssl证书配置)
5. [域名配置](#域名配置)
6. [环境变量说明](#环境变量说明)
7. [验证部署](#验证部署)

---

## 服务器要求

### 最低配置
- CPU: 1 vCPU
- 内存: 1 GB RAM
- 硬盘: 10 GB
- 操作系统: Ubuntu 20.04+ / Debian 11+ / CentOS 8+

### 推荐配置
- CPU: 2+ vCPUs
- 内存: 2+ GB RAM
- 硬盘: 20+ GB SSD
- 操作系统: Ubuntu 22.04 LTS

### 推荐云服务商 (海外)
- **AWS (Amazon)** - 悉尼/新加坡节点
- **Google Cloud** - 悉尼/新加坡节点
- **DigitalOcean** - 悉尼/新加坡节点
- **Vultr** - 东京/悉尼节点
- **Linode** - 悉尼/东京节点

---

## 快速部署 (Docker)

### 步骤 1: 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl git unzip

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 步骤 2: 上传项目

```bash
# 创建项目目录
sudo mkdir -p /var/www/murdoch-survey
cd /var/www/murdoch-survey

# 使用 scp 上传文件 (在本地执行)
scp -r ./murdoch-survey-system/* user@your-server:/var/www/murdoch-survey/

# 或者使用 git 克隆 (如果使用 git)
git clone https://your-repo-url.git .
```

### 步骤 3: 配置环境变量

```bash
cd /var/www/murdoch-survey

# 创建环境变量文件
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=./data/survey.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
BASE_URL=https://your-domain.com
ADMIN_EMAIL=admin@murdoch.edu.au
ADMIN_PASSWORD=YourSecurePassword123!
EOF
```

### 步骤 4: 启动服务

```bash
# 构建并启动 (生产模式)
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

### 步骤 5: 配置 SSL 和域名 (见下方)

---

## 手动部署

如果不想使用 Docker，可以手动部署：

### 步骤 1: 安装 Node.js

```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version  # 应显示 v18.x.x
npm --version
```

### 步骤 2: 安装 PM2 (进程管理器)

```bash
sudo npm install -g pm2
```

### 步骤 3: 安装 Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 步骤 4: 配置项目

```bash
cd /var/www/murdoch-survey

# 安装依赖
npm install
cd client && npm install && cd ..
npm run build
```

### 步骤 5: 配置环境变量

```bash
# 创建 .env 文件
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=./data/survey.db
JWT_SECRET=your-super-secret-jwt-key
BASE_URL=https://your-domain.com
ADMIN_EMAIL=admin@murdoch.edu.au
ADMIN_PASSWORD=YourSecurePassword123!
EOF
```

### 步骤 6: 使用 PM2 启动

```bash
# 启动应用
pm2 start server/index.ts --name murdoch-survey --interpreter tsx

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 步骤 7: 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/murdoch-survey
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/murdoch-survey/dist/client;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/murdoch-survey /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## SSL证书配置

### 使用 Let's Encrypt (免费)

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书 (前提是域名已指向服务器)
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

### 手动配置 SSL

如果已有 SSL 证书，将证书文件复制到服务器：

```bash
# 创建 SSL 目录
sudo mkdir -p /etc/nginx/ssl

# 复制证书
sudo cp your-certificate.crt /etc/nginx/ssl/
sudo cp your-private-key.key /etc/nginx/ssl/

# 设置权限
sudo chmod 600 /etc/nginx/ssl/*
```

更新 Nginx 配置中的 SSL 路径。

---

## 域名配置

1. 在域名服务商处添加 DNS 记录：
   - **A 记录**: `your-domain.com` → `服务器IP`
   - **CNAME 记录**: `www.your-domain.com` → `your-domain.com`

2. 等待 DNS 生效 (通常 5-30 分钟)

3. 等待 SSL 证书签发

---

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `3000` |
| `DATABASE_URL` | 数据库路径 | `./data/survey.db` |
| `JWT_SECRET` | JWT密钥 (必改) | `随机64位字符串` |
| `BASE_URL` | 网站基础URL | `https://your-domain.com` |
| `ADMIN_EMAIL` | 管理员邮箱 | `admin@murdoch.edu.au` |
| `ADMIN_PASSWORD` | 管理员密码 | `YourSecurePassword!` |

### 生成强密码和密钥

```bash
# 生成随机密钥
openssl rand -base64 32

# 生成随机密码
openssl rand -base64 16
```

---

## 验证部署

### 健康检查

```bash
# 检查服务状态
curl http://localhost:3000/api/health

# 预期返回
{"status":"ok","timestamp":"2024-..."}
```

### 访问网站

1. 打开浏览器访问 `https://your-domain.com`
2. 应该看到英文问卷首页
3. 访问 `https://your-domain.com/admin` 查看中文管理后台

### 默认管理员账号

- **邮箱**: `admin@murdoch.edu.au`
- **密码**: 在 `.env` 文件中设置的值

⚠️ **首次登录后请立即修改密码！**

---

## 维护命令

```bash
# 查看日志
docker-compose logs -f app

# 重启服务
docker-compose restart

# 更新代码
git pull
docker-compose up -d --build

# 备份数据库
cp data/survey.db data/survey-backup-$(date +%Y%m%d).db

# 查看资源使用
docker stats
```

---

## 故障排除

### 服务无法启动

```bash
# 查看详细日志
docker-compose logs app

# 检查端口占用
netstat -tlnp | grep 3000
```

### 数据库错误

```bash
# 重新初始化数据库
rm -f data/survey.db
docker-compose restart
```

### SSL 证书问题

```bash
# 检查证书
openssl s_client -connect your-domain.com:443

# 续期证书
sudo certbot renew
```
