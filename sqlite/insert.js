import { db } from './db.js';

/**
 * 向数据库插入或替换指定表和ID的值
 * @param {string} tableName - 数据库表名
 * @param {number} id - 数据库记录ID
 * @param {number} value - 要插入或替换的值
 * @returns {boolean} 成功返回 true，失败返回 false
 */
function insertValue(tableName, id, value) {
  try {
    const stmt = db.prepare(`INSERT OR REPLACE INTO ${tableName} (ID, Value) VALUES (?, ?)`);
    stmt.run(id, value);
    return true;
  } catch (err) {
    console.error(`insertValue failed for table ${tableName}, id ${id}:`, err);
    return false;
  }
}

// console.log(insertValue('VFDF', 1, 0));

export { insertValue };
