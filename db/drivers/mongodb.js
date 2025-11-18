const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB || 'learning_tracker';

let client;
let collection;

async function connect() {
  if (collection) return;
  client = new MongoClient(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db(DB_NAME);
  collection = db.collection('tasks');
}

module.exports = {
  init: async (tasks) => {
    await connect();
    await collection.deleteMany({});
    // attach index to preserve order
    const docs = tasks.map((t, i) => ({ ...t, idx: i }));
    if (docs.length > 0) await collection.insertMany(docs);
    return true;
  },
  getAll: async () => {
    await connect();
    const docs = await collection.find({}).sort({ idx: 1 }).toArray();
    // remove internal fields if needed
    return docs.map(d => {
      const { _id, idx, ...rest } = d;
      return rest;
    });
  },
  updateStatus: async (index, status) => {
    await connect();
    const res = await collection.findOneAndUpdate({ idx: Number(index) }, { $set: { status } }, { returnDocument: 'after' });
    if (!res.value) return null;
    const { _id, idx, ...rest } = res.value;
    return rest;
  },
  updateTask: async (index, taskObj) => {
    await connect();
    const { idx, _id, ...safeObj } = taskObj;
    const res = await collection.findOneAndUpdate({ idx: Number(index) }, { $set: safeObj }, { returnDocument: 'after' });
    if (!res.value) return null;
    const { _id: id, idx: i, ...rest } = res.value;
    return rest;
  }
};
