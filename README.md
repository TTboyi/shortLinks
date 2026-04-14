# 短链管理系统

全功能短链管理系统，前端 React + TypeScript + TailwindCSS，后端 Express.js + SQLite。

## 快速启动

### 后端

```bash
cd shortLinks-back
npm install
# 可选：复制 .env.example 为 .env 并修改配置
node src/index.js
# 或开发模式（Node 18+）
npm run dev
```

默认监听 `http://localhost:8000`

**默认账号**：`admin` / `admin123`（首次启动自动创建）

### 前端

```bash
cd shortLinks-ui
npm install
npm run dev
```

访问 `http://localhost:5173`

## 功能

- 用户登录 / 注册 / 信息修改
- 短链分组管理（增删改排序）
- 短链创建 / 编辑 / 删除（移入回收站）
- 短链访问跳转（记录 PV / UV / IP 统计）
- 数据看板：访问趋势、浏览器/系统/设备分布、Top5 短链
- 回收站（恢复 / 永久删除）

## 生产部署

1. 在 `.env` 中设置 `DOMAIN` 为你的域名（如 `short.example.com`）
2. 设置随机 `JWT_SECRET`
3. 使用 Nginx 反向代理后端，并将前端 `dist/` 目录作为静态文件服务

```nginx
server {
    listen 80;
    server_name short.example.com;

    # 短链跳转和 API
    location / {
        proxy_pass http://127.0.0.1:8000;
    }

    # 前端管理界面（如果分开部署）
    location /admin {
        root /path/to/shortLinks-ui/dist;
        try_files $uri $uri/ /index.html;
    }
}
```
