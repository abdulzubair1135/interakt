const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

class JSONStore {
  constructor(collection) {
    this.filePath = path.join(DATA_DIR, `${collection}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  async read() {
    const data = fs.readFileSync(this.filePath, 'utf8');
    return JSON.parse(data);
  }

  async write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async find(filter = {}) {
    let data = await this.read();
    return data.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        if (Array.isArray(value)) return value.includes(item[key]);
        return item[key] === value;
      });
    });
  }

  async findOne(filter = {}) {
    const data = await this.find(filter);
    return data[0] || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(item) {
    const data = await this.read();
    const newItem = {
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    data.push(newItem);
    await this.write(data);
    return newItem;
  }

  async findByIdAndUpdate(id, updates) {
    const data = await this.read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    data[index] = { 
      ...data[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    await this.write(data);
    return data[index];
  }

  async deleteOne(filter = {}) {
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
