// db.js
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件 (db.js) 的绝对路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'control.db');

// console.log('正在连接数据库：', dbPath); // 打印出来确认一下！

const db = new Database(dbPath, { 
    timeout: 10000 
});

// 优化设置
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

export { db };