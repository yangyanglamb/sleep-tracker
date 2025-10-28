#!/bin/bash

# 睡眠与饮食记录系统 - 快速启动脚本

echo "🚀 启动睡眠与饮食记录系统..."
echo ""
echo "项目位置: /root/sleep-tracker"
echo "服务器端口: 5002"
echo "网址: http://localhost:5002"
echo ""

cd /root/sleep-tracker

if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，正在安装依赖..."
  npm install
  echo ""
fi

echo "✨ 服务器启动中..."
npm start
