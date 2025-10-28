const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5002;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 初始化数据库
const db = new sqlite3.Database('./tracker.db', (err) => {
  if (err) {
    console.error('数据库连接错误:', err);
  } else {
    console.log('数据库已连接');
    initializeDatabase();
  }
});

// 初始化表
function initializeDatabase() {
  db.serialize(() => {
    // 睡眠记录表
    db.run(`
      CREATE TABLE IF NOT EXISTS sleep_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sleep_start TEXT NOT NULL,
        sleep_end TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 吃饭记录表
    db.run(`
      CREATE TABLE IF NOT EXISTS meal_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_time TEXT NOT NULL,
        meal_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

// 工具函数：计算睡眠时长
function calculateSleepDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffMinutes = (diffMs / (1000 * 60)) % 60;

  return {
    hours: Math.floor(diffHours),
    minutes: Math.round(diffMinutes),
    totalMinutes: Math.round(diffMs / (1000 * 60))
  };
}

// 工具函数：格式化时间（睡眠/饮食显示用）
// 格式：xx月xx日xx时
// 修复：使用本地时区方法，确保显示正确
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  return `${month}月${day}日${hours}时`;
}

// 工具函数：格式化睡眠显示
function formatSleepDisplay(startTime, endTime) {
  const duration = calculateSleepDuration(startTime, endTime);
  const startFormatted = formatDateTime(startTime);
  const endFormatted = formatDateTime(endTime);

  let durationText;
  if (duration.totalMinutes < 60) {
    durationText = `共睡了${duration.minutes}分钟`;
  } else {
    if (duration.minutes === 0) {
      durationText = `共睡了${duration.hours}小时`;
    } else {
      durationText = `共睡了${duration.hours}小时${duration.minutes}分钟`;
    }
  }

  return `${startFormatted}-${endFormatted} ${durationText}`;
}

// API: 记录睡觉
app.post('/api/sleep-start', (req, res) => {
  const now = new Date().toISOString();

  // 检查是否有未完成的睡眠记录
  db.get('SELECT id FROM sleep_records WHERE sleep_end IS NULL ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    if (row) {
      // 已有未完成的睡眠记录，更新其开始时间（防止多次点击）
      db.run(
        'UPDATE sleep_records SET sleep_start = ?, updated_at = ? WHERE id = ?',
        [now, now, row.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '更新失败' });
          }
          res.json({ message: '睡眠记录已更新', id: row.id });
        }
      );
    } else {
      // 创建新的睡眠记录
      db.run(
        'INSERT INTO sleep_records (sleep_start) VALUES (?)',
        [now],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '插入失败' });
          }
          res.json({ message: '开始睡眠', id: this.lastID });
        }
      );
    }
  });
});

// API: 记录起床
app.post('/api/sleep-end', (req, res) => {
  const now = new Date().toISOString();

  // 获取最后一条未完成的睡眠记录
  db.get('SELECT id, sleep_start FROM sleep_records WHERE sleep_end IS NULL ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    if (!row) {
      // 没有未完成的睡眠记录，创建一个虚拟的
      db.run(
        'INSERT INTO sleep_records (sleep_start, sleep_end) VALUES (?, ?)',
        [now, now],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '插入失败' });
          }
          res.json({ message: '未有睡眠记录，已记录起床时间', id: this.lastID });
        }
      );
    } else {
      // 更新睡眠记录的结束时间
      db.run(
        'UPDATE sleep_records SET sleep_end = ?, updated_at = ? WHERE id = ?',
        [now, now, row.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '更新失败' });
          }

          const display = formatSleepDisplay(row.sleep_start, now);
          res.json({ message: '睡眠记录完成', display: display, id: row.id });
        }
      );
    }
  });
});

// API: 记录吃饭
app.post('/api/meal-record', (req, res) => {
  const now = new Date().toISOString();
  const mealType = req.body.mealType || '其他';

  db.run(
    'INSERT INTO meal_records (meal_time, meal_type) VALUES (?, ?)',
    [now, mealType],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '插入失败' });
      }
      res.json({ message: '吃饭时间已记录', id: this.lastID });
    }
  );
});

// API: 获取睡眠记录
app.get('/api/sleep-records', (req, res) => {
  db.all(
    'SELECT id, sleep_start, sleep_end FROM sleep_records WHERE sleep_end IS NOT NULL ORDER BY id DESC LIMIT 50',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: '查询失败' });
      }

      const records = rows.map(row => ({
        id: row.id,
        display: formatSleepDisplay(row.sleep_start, row.sleep_end)
      }));

      res.json(records);
    }
  );
});

// API: 获取吃饭记录
app.get('/api/meal-records', (req, res) => {
  db.all(
    'SELECT id, meal_time, meal_type FROM meal_records ORDER BY id DESC LIMIT 30',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: '查询失败' });
      }

      const records = rows.map(row => {
        return {
          id: row.id,
          display: `${formatDateTime(row.meal_time)} (${row.meal_type})`
        };
      });

      res.json(records);
    }
  );
});

// API: 获取当前睡眠状态
app.get('/api/sleep-status', (req, res) => {
  db.get('SELECT id, sleep_start FROM sleep_records WHERE sleep_end IS NULL ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }

    if (row) {
      res.json({ isSleeping: true, startTime: row.sleep_start, id: row.id });
    } else {
      res.json({ isSleeping: false });
    }
  });
});

// API: 删除睡眠记录
app.delete('/api/sleep-records/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM sleep_records WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: '删除失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    res.json({ message: '删除成功', id: id });
  });
});

// API: 删除饮食记录
app.delete('/api/meal-records/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM meal_records WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: '删除失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    res.json({ message: '删除成功', id: id });
  });
});

// API: 手动添加睡眠记录
app.post('/api/sleep-records/custom', (req, res) => {
  const { sleep_start, sleep_end } = req.body;

  if (!sleep_start || !sleep_end) {
    return res.status(400).json({ error: '缺少必需参数' });
  }

  db.run(
    'INSERT INTO sleep_records (sleep_start, sleep_end) VALUES (?, ?)',
    [sleep_start, sleep_end],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '插入失败' });
      }
      const display = formatSleepDisplay(sleep_start, sleep_end);
      res.json({ message: '睡眠记录已添加', display: display, id: this.lastID });
    }
  );
});

// API: 手动添加饮食记录
app.post('/api/meal-records/custom', (req, res) => {
  const { meal_time, meal_type } = req.body;

  if (!meal_time) {
    return res.status(400).json({ error: '缺少必需参数' });
  }

  const type = meal_type || '其他';
  db.run(
    'INSERT INTO meal_records (meal_time, meal_type) VALUES (?, ?)',
    [meal_time, type],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '插入失败' });
      }
      const display = `${formatDateTime(meal_time)} (${type})`;
      res.json({ message: '饮食记录已添加', display: display, id: this.lastID });
    }
  );
});

// API: 按日期范围筛选记录
app.get('/api/records/filter', (req, res) => {
  const { type, start, end } = req.query;

  if (!type || !start || !end) {
    return res.status(400).json({ error: '缺少必需参数' });
  }

  const startDate = new Date(start).toISOString();
  const endDate = new Date(end).toISOString();

  if (type === 'sleep') {
    db.all(
      'SELECT id, sleep_start, sleep_end FROM sleep_records WHERE sleep_end IS NOT NULL AND sleep_start >= ? AND sleep_start <= ? ORDER BY sleep_start DESC',
      [startDate, endDate],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: '查询失败' });
        }
        const records = rows.map(row => ({
          id: row.id,
          display: formatSleepDisplay(row.sleep_start, row.sleep_end),
          start: row.sleep_start,
          end: row.sleep_end
        }));
        res.json(records);
      }
    );
  } else if (type === 'meal') {
    db.all(
      'SELECT id, meal_time, meal_type FROM meal_records WHERE meal_time >= ? AND meal_time <= ? ORDER BY meal_time DESC',
      [startDate, endDate],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: '查询失败' });
        }
        const records = rows.map(row => {
          return {
            id: row.id,
            display: `${formatDateTime(row.meal_time)} (${row.meal_type})`,
            time: row.meal_time,
            type: row.meal_type
          };
        });
        res.json(records);
      }
    );
  } else {
    res.status(400).json({ error: '无效的记录类型' });
  }
});

// API: 获取统计数据
app.get('/api/statistics', (req, res) => {
  const days = req.query.days || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateISO = startDate.toISOString();

  db.all(
    'SELECT sleep_start, sleep_end FROM sleep_records WHERE sleep_end IS NOT NULL AND sleep_start >= ? ORDER BY sleep_start DESC',
    [startDateISO],
    (err, sleepRows) => {
      if (err) {
        return res.status(500).json({ error: '查询失败' });
      }

      // 计算睡眠统计
      let totalMinutes = 0;
      const sleepByDate = {};

      sleepRows.forEach(row => {
        const duration = calculateSleepDuration(row.sleep_start, row.sleep_end);
        totalMinutes += duration.totalMinutes;

        const date = new Date(row.sleep_start);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (!sleepByDate[dateStr]) {
          sleepByDate[dateStr] = 0;
        }
        sleepByDate[dateStr] += duration.totalMinutes;
      });

      const avgMinutes = sleepRows.length > 0 ? Math.round(totalMinutes / sleepRows.length) : 0;

      // 获取饮食统计
      db.all(
        'SELECT meal_type FROM meal_records WHERE meal_time >= ? ORDER BY meal_time DESC',
        [startDateISO],
        (err, mealRows) => {
          if (err) {
            return res.status(500).json({ error: '查询失败' });
          }

          const mealStats = {};
          mealRows.forEach(row => {
            if (!mealStats[row.meal_type]) {
              mealStats[row.meal_type] = 0;
            }
            mealStats[row.meal_type]++;
          });

          res.json({
            days: days,
            sleep: {
              totalRecords: sleepRows.length,
              totalMinutes: totalMinutes,
              totalHours: Math.round(totalMinutes / 60 * 10) / 10,
              avgMinutes: avgMinutes,
              avgHours: Math.round(avgMinutes / 60 * 10) / 10,
              byDate: sleepByDate
            },
            meals: {
              totalRecords: mealRows.length,
              byType: mealStats
            }
          });
        }
      );
    }
  );
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
