const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Pluggable storage layer
const db = require('./db');

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db.getAll();
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks', err);
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
});

// Update task by index (accepts full task object)
app.put('/api/tasks/:index', async (req, res) => {
  const { index } = req.params;
  const taskObj = req.body || {};
  try {
    const updated = await db.updateTask(Number(index), taskObj);
    if (updated) {
      res.json({ success: true, task: updated });
    } else {
      res.status(404).json({ success: false, message: 'Task not found' });
    }
  } catch (err) {
    console.error('Error updating task', err);
    res.status(500).json({ success: false, message: 'Error updating task' });
  }
});

// Initialize tasks
app.post('/api/tasks/init', async (req, res) => {
  try {
    const incoming = req.body || [];
    await db.init(incoming);
    res.json({ success: true, message: 'Tasks initialized' });
  } catch (err) {
    console.error('Error initializing tasks', err);
    res.status(500).json({ success: false, message: 'Error initializing tasks' });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
