const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

class JSONStore {
  constructor(collection) {
    this.collectionName = collection;
    this.filePath = path.join(DATA_DIR, `${collection}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  isMongoActive() {
    return mongoose.connection.readyState === 1 && process.env.MONGO_URI;
  }

  getMongoCollection() {
    return mongoose.connection.db.collection(this.collectionName);
  }

  async read() {
    if (this.isMongoActive()) {
      return await this.getMongoCollection().find({}).toArray();
    }
    const data = fs.readFileSync(this.filePath, 'utf8');
    return JSON.parse(data);
  }

  async write(data) {
    if (this.isMongoActive()) {
      const col = this.getMongoCollection();
      await col.deleteMany({});
      if (data && data.length > 0) {
        await col.insertMany(data);
      }
      return;
    }
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async find(filter = {}) {
    if (this.isMongoActive()) {
      return await this.getMongoCollection().find(filter).toArray();
    }
    let data = await this.read();
    return data.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        if (Array.isArray(value)) return value.includes(item[key]);
        return item[key] === value;
      });
    });
  }

  async findOne(filter = {}) {
    if (this.isMongoActive()) {
      return await this.getMongoCollection().findOne(filter);
    }
    const data = await this.find(filter);
    return data[0] || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(item) {
    const newItem = {
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    if (this.isMongoActive()) {
      await this.getMongoCollection().insertOne(newItem);
      return newItem;
    }
    const data = await this.read();
    data.push(newItem);
    await this.write(data);
    return newItem;
  }

  async findByIdAndUpdate(id, updates) {
    const updatedAt = new Date().toISOString();
    if (this.isMongoActive()) {
      const col = this.getMongoCollection();
      await col.updateOne({ _id: id }, { $set: { ...updates, updatedAt } });
      return await col.findOne({ _id: id });
    }
    const data = await this.read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    data[index] = { 
      ...data[index], 
      ...updates, 
      updatedAt
    };
    await this.write(data);
    return data[index];
  }

  async deleteOne(filter = {}) {
    if (this.isMongoActive()) {
      await this.getMongoCollection().deleteOne(filter);
      return true;
    }
    const data = await this.read();
    const newData = data.filter(item => {
      return !Object.entries(filter).every(([key, value]) => item[key] === value);
    });
    await this.write(newData);
    return true;
  }

  async findByIdAndDelete(id) {
    return this.deleteOne({ _id: id });
  }
}

module.exports = JSONStore;
