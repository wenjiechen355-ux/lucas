#!/bin/bash
# ============================================
# 澳门童军执委会管理系统 - 部署脚本
# ============================================

set -e

echo "=== 澳门童军执委会管理系统 - 部署 ==="
echo ""

# 1. 检查环境变量
if [ ! -f .env.local ]; then
    echo "[ERROR] .env.local 不存在！"
    echo "请复制 .env.example 为 .env.local 并填入 Supabase 配置"
    exit 1
fi

# 2. 安装依赖
echo "[1/3] 安装依赖..."
npm ci

# 3. 构建
echo "[2/3] 构建项目..."
npm run build

# 4. 启动生产服务器
echo "[3/3] 启动生产服务器..."
echo "网站运行在 http://localhost:3000"
echo ""

# 复制 .env.local 到生产环境
cp .env.local .env.production

# 启动
NODE_ENV=production npm start
