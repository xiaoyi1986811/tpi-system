// index.js - TPI 后端服务（Render 部署版）
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 初始化数据库连接池
const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Render 的 PostgreSQL 需要此配置
  }
});

// 测试数据库连接
client.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ 无法连接到 PostgreSQL 数据库:', err.stack);
  } else {
    console.log('✅ 成功连接到 PostgreSQL 数据库！');
  }
});

// 允许 JSON 请求体
app.use(express.json());

// ======================
// 🩺 健康检查接口
// ======================
app.get('/api/time', (req, res) => {
  res.json({
    message: 'TPI Backend is running',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ======================
// ☁️ TPI 云端同步 API
// ======================

// POST /api/tpi → 保存当日数据
app.post('/api/tpi', async (req, res) => {
  const { date, data } = req.body;
  if (!date || !data) {
    return res.status(400).json({ error: '缺少 date 或 data 字段' });
  }
  try {
    await client.query(
      `INSERT INTO tpi_records (date, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (date) DO UPDATE SET data = $2, updated_at = NOW();`,
      [date, JSON.stringify(data)]
    );
    console.log(`✅ 已同步 TPI 数据：${date}`);
    res.json({ message: '✅ TPI 数据已同步到云端' });
  } catch (err) {
    console.error('❌ 保存失败:', err);
    res.status(500).json({ error: '数据库写入失败' });
  }
});

// GET /api/tpi/history → 获取全部历史
app.get('/api/tpi/history', async (req, res) => {
  try {
    const result = await client.query('SELECT date, data FROM tpi_records ORDER BY date DESC;');
    const history = {};
    result.rows.forEach(row => {
      history[row.date] = JSON.parse(row.data);
    });
    console.log(`📤 返回 ${Object.keys(history).length} 天历史数据`);
    res.json(history);
  } catch (err) {
    console.error('❌ 查询失败:', err);
    res.status(500).json({ error: '数据库读取失败' });
  }
});

// ======================
// 🚀 启动服务器
// ======================
app.listen(port, () => {
  console.log(`✅ TPI 后端服务启动成功！监听端口: ${port}`);
});