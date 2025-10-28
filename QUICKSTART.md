# 快速开始指南

## 🚀 启动应用

### 方式一：使用启动脚本
```bash
cd /root/sleep-tracker
./start.sh
```

### 方式二：直接运行
```bash
cd /root/sleep-tracker
npm start
```

应用将在 `http://localhost:5002` 启动

## 📖 使用说明

### 睡眠记录
1. 打开网页 http://localhost:5002
2. 点击 **"😴 睡觉"** 开始睡眠
3. 睡眠后点击 **"🌅 起床"** 完成记录
4. 记录会自动显示在"睡眠记录"标签页

### 饮食记录
1. 选择饮食类型（早餐、午餐、晚餐等）
2. 点击 **"🍽️ 记录吃饭"** 按钮
3. 记录会自动显示在"饮食记录"标签页

## 💡 系统特点

✅ **智能错误处理**
- 多次点击睡觉按钮只会更新时间，不会创建重复记录
- 无睡眠记录时点击起床也能正确处理
- 支持各种无规律操作

✅ **精确时长显示**
- 少于1小时：精确到分钟（如"共睡了45分钟"）
- 1小时以上：显示小时+分钟（如"共睡了7时30分"）

✅ **数据持久化**
- 所有数据使用 SQLite 数据库保存
- 服务器重启后数据不会丢失

✅ **响应式设计**
- 完美支持手机、平板、电脑等各种设备

## 📊 数据查看

### 通过网页查看
- 直接在网页上切换"睡眠记录"和"饮食记录"标签页

### 通过 API 查看
```bash
# 获取睡眠记录
curl http://localhost:5002/api/sleep-records

# 获取饮食记录
curl http://localhost:5002/api/meal-records

# 获取当前睡眠状态
curl http://localhost:5002/api/sleep-status
```

## 🗂️ 文件位置

```
/root/sleep-tracker/
├── server.js           # 后端服务器
├── package.json        # 依赖配置
├── tracker.db          # 数据库文件
├── start.sh            # 启动脚本
├── README.md           # 详细文档
└── public/
    └── index.html      # 前端网页
```

## 🛑 停止应用

在运行服务器的终端中按 `Ctrl + C` 即可停止。

## 🔧 遇到问题？

1. **端口被占用**
   - 修改 `server.js` 中的 `PORT` 变量

2. **依赖安装失败**
   - 删除 node_modules 文件夹：`rm -rf node_modules`
   - 重新安装：`npm install`

3. **数据库错误**
   - 删除 `tracker.db` 文件
   - 重启应用会自动创建新数据库

## 📈 高级用法

### 修改端口
编辑 `server.js`，修改这一行：
```javascript
const PORT = 5002;  // 改为你想要的端口
```

### 修改数据库位置
编辑 `server.js`，修改这一行：
```javascript
const db = new sqlite3.Database('./tracker.db');  // 改为新路径
```

### 修改样式
编辑 `public/index.html` 中的 `<style>` 标签

---

祝你使用愉快！如有问题，请参考 README.md 获取更详细的说明。
