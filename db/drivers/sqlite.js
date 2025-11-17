const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_FILE = path.join(__dirname, '../../data/tasks.sqlite3');

let db;

function getDB() {
  if (!db) {
    db = new sqlite3.Database(DB_FILE);
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS tasks (
        idx INTEGER PRIMARY KEY,
        week INTEGER,
        day INTEGER,
        topic TEXT,
        activities TEXT,
        problems INTEGER,
        status TEXT,
        date TEXT
      )`);
    });
  }
  return db;
}

function runAsync(sql, params = []) {
  const d = getDB();
  return new Promise((resolve, reject) => {
    d.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  const d = getDB();
  return new Promise((resolve, reject) => {
    d.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  init: async (tasks) => {
    const d = getDB();
    await runAsync('DELETE FROM tasks');
    const insert = d.prepare(`INSERT INTO tasks (idx, week, day, topic, activities, problems, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    return new Promise((resolve, reject) => {
      d.serialize(() => {
        tasks.forEach((t, i) => {
          insert.run(i, t.week || null, t.day || null, t.topic || '', t.activities || '', t.problems || 0, t.status || 'Not Started', t.date || '');
        });
        insert.finalize((err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
    });
  },
  getAll: async () => {
    const rows = await allAsync('SELECT * FROM tasks ORDER BY idx ASC');
    return rows.map(r => ({ week: r.week, day: r.day, topic: r.topic, activities: r.activities, problems: r.problems, status: r.status, date: r.date }));
  },
  updateStatus: async (index, status) => {
    await runAsync('UPDATE tasks SET status = ? WHERE idx = ?', [status, index]);
    const rows = await allAsync('SELECT * FROM tasks WHERE idx = ?', [index]);
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return { week: r.week, day: r.day, topic: r.topic, activities: r.activities, problems: r.problems, status: r.status, date: r.date };
  }
};
