const type = (process.env.DB_TYPE || 'file').toLowerCase();
let driver = null;

if (type === 'mongodb') {
  driver = require('./drivers/mongodb');
} else if (type === 'sqlite') {
  driver = require('./drivers/sqlite');
} else {
  // default to simple file-based JSON storage
  driver = require('./drivers/file');
}

module.exports = {
  init: async (tasks) => {
    return driver.init(tasks || []);
  },
  getAll: async () => {
    return driver.getAll();
  },
  updateStatus: async (index, status) => {
    return driver.updateStatus(index, status);
  },
  updateTask: async (index, taskObj) => {
    return driver.updateTask(index, taskObj);
  }
};
