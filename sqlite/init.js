import Database from 'better-sqlite3';
import path from 'node:path';
import { System } from '../config.js';

// 获取当前脚本所在文件夹的绝对路径
const dbPath = path.join(import.meta.dirname, 'control.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const init = db.transaction((tables) => {
  for (const [name, count] of Object.entries(tables)) {
    db.exec(`CREATE TABLE IF NOT EXISTS ${name} (ID INTEGER PRIMARY KEY, Value INTEGER DEFAULT 0)`);
    const insert = db.prepare(`INSERT OR IGNORE INTO ${name} (ID) VALUES (?)`);
    for (let i = 1; i <= count; i++) insert.run(i);
  }
});

// 根据 System 配置动态生成表初始化参数
const tables = Object.values(System).reduce((acc, [name, count]) => {
  acc[name] = count;
  return acc;
}, {});

init(tables);