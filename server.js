const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- Data helpers ----
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('读取数据失败:', e.message);
  }
  return [];
}

function saveData(records) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

// ---- API Routes ----

// 获取所有打卡记录
app.get('/api/records', (req, res) => {
  res.json(loadData());
});

// 打卡
app.post('/api/checkin', (req, res) => {
  const { name, day, text, image } = req.body;
  if (!name || !day) {
    return res.status(400).json({ error: '缺少 name 或 day' });
  }
  if (!text && !image) {
    return res.status(400).json({ error: '至少填写心得或上传图片' });
  }

  const records = loadData();
  const key = `${name}_${day}`;
  const idx = records.findIndex(r => r.key === key);
  const record = {
    key,
    name,
    day: parseInt(day),
    text: text || '',
    image: image || null,
    time: Date.now()
  };

  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }

  saveData(records);
  res.json({ success: true, record });
});

// 删除某条打卡记录
app.delete('/api/records/:name/:day', (req, res) => {
  const key = `${req.params.name}_${req.params.day}`;
  let records = loadData();
  records = records.filter(r => r.key !== key);
  saveData(records);
  res.json({ success: true });
});

// 清空全部
app.post('/api/reset', (req, res) => {
  saveData([]);
  res.json({ success: true });
});

// 导出
app.get('/api/export', (req, res) => {
  const records = loadData();
  records.sort((a, b) => b.time - a.time);
  const text = records.map(r => {
    return `--- ${r.name} · Day ${r.day} · ${new Date(r.time).toLocaleString('zh-CN')} ---\n${r.text || '(无文字)'}\n${r.image ? '[含图片]' : ''}`;
  }).join('\n\n');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="读书打卡导出.txt"');
  res.send(text || '暂无打卡记录');
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`📖 读书打卡服务器已启动: http://localhost:${PORT}`);
});
