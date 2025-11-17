const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function readFile() {
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks: [] }, null, 2));
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return parsed.tasks || [];
  } catch (e) {
    return [];
  }
}

async function writeFile(tasks) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks }, null, 2));
}

module.exports = {
  init: async (tasks) => {
    await writeFile(tasks);
    return true;
  },
  getAll: async () => {
    return await readFile();
  },
  updateStatus: async (index, status) => {
    const tasks = await readFile();
    if (index < 0 || index >= tasks.length) return null;
    tasks[index].status = status;
    await writeFile(tasks);
    return tasks[index];
  }
};
