# 睡眠与饮食记录系统

一个完整的响应式网页应用，用于记录和追踪睡眠时间和饮食时间。所有数据使用 SQLite 数据库存储。

## 功能特性

### 睡眠记录
- **睡觉按钮**: 开始记录睡眠时间
- **起床按钮**: 结束睡眠记录，自动计算睡眠时长
- **智能处理**:
  - 多次点击睡觉按钮会更新开始时间（不会创建多条记录）
  - 无睡眠记录情况下点击起床，系统会创建记录
  - 实时显示当前睡眠状态和时长

### 睡眠时长显示格式
- 不足1小时：精确到分钟（如"共睡了45分钟"）
- 1小时以上：显示小时和分钟（如"共睡了7小时30分钟"）
- 整数小时：仅显示小时（如"共睡了8小时"）

时间格式：`xx月xx日xx时-xx月xx日xx时 共睡了X分钟/小时/小时分钟`
例如：`10月28日08时-10月28日16时 共睡了8小时`

### 饮食记录
- 6种饮食类型可选：早餐、午餐、晚餐、加餐、饮水、其他
- 记录饮食时间和类型
- 饮食记录与睡眠记录分开显示

## 项目结构

```
/root/sleep-tracker/
├── server.js           # Node.js 后端服务器
├── package.json        # 项目依赖配置
├── tracker.db         # SQLite 数据库（自动创建）
└── public/
    └── index.html     # 前端网页
```

## 技术栈

**后端**
- Express.js - Web 框架
- SQLite3 - 数据库
- Node.js - 运行环境

**前端**
- HTML5
- CSS3 (响应式设计)
- JavaScript (Fetch API)

## 运行说明

### 启动服务器
```bash
cd /root/sleep-tracker
npm start
```

服务器将在 `http://localhost:5002` 运行

### 访问网页
在浏览器中打开：`http://localhost:5002`

## 数据库表结构

### sleep_records 表
```sql
CREATE TABLE sleep_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sleep_start TEXT NOT NULL,        -- 睡眠开始时间
  sleep_end TEXT,                   -- 睡眠结束时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### meal_records 表
```sql
CREATE TABLE meal_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_time TEXT NOT NULL,          -- 饮食时间
  meal_type TEXT,                   -- 饮食类型
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API 接口

### 睡眠相关

**开始睡眠**
- `POST /api/sleep-start`
- 响应: `{"message":"开始睡眠", "id":1}`

**结束睡眠**
- `POST /api/sleep-end`
- 响应: `{"message":"睡眠记录完成", "display":"20251028 03:38-03:45 共睡了7分钟", "id":1}`

**获取睡眠状态**
- `GET /api/sleep-status`
- 响应: `{"isSleeping":true, "startTime":"...", "id":1}`

**获取睡眠记录**
- `GET /api/sleep-records`
- 响应: `[{"id":1, "display":"20251028 03:38-03:45 共睡了7分钟"}]`

### 饮食相关

**记录吃饭**
- `POST /api/meal-record`
- 请求体: `{"mealType":"早餐"}`
- 响应: `{"message":"吃饭时间已记录", "id":1}`

**获取饮食记录**
- `GET /api/meal-records`
- 响应: `[{"id":1, "display":"20251028 03:38 (早餐)"}]`

## 错误处理

系统支持以下场景：

1. **多次点击睡觉**: 自动更新睡眠开始时间，不创建重复记录
2. **无睡眠记录下点击起床**: 创建新的睡眠记录（起床时间作为结束时间）
3. **连续多次点击起床**: 每次都会创建新的睡眠记录
4. **数据库操作失败**: 返回相应的错误信息

## 前端特性

- **响应式设计**: 支持手机、平板、桌面端
- **实时状态更新**: 显示当前睡眠状态和持续时长
- **美化界面**: 渐变色背景、阴影效果、动画过渡
- **标签页切换**: 睡眠记录和饮食记录分别展示
- **自动刷新**: 每30秒自动刷新数据

## 测试验证

所有功能已测试通过：
- ✅ 睡觉/起床记录
- ✅ 多次点击处理
- ✅ 无规律点击处理
- ✅ 时长计算（时/分）
- ✅ 饮食记录
- ✅ 数据持久化
- ✅ API 接口
- ✅ 前端页面显示

## 注意事项

- 数据库文件 `tracker.db` 在首次运行时自动创建
- 时间均以服务器本地时间记录
- 记录数据按倒序显示（最新的在前）
- 睡眠记录显示最多50条，饮食记录显示最多30条
