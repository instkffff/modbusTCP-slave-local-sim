import { db } from './db.js';

/**
 * 从数据库读取指定表和ID的值
 * @param {string} tableName - 数据库表名
 * @param {number} id - 数据库记录ID
 * @returns {number|null} - 从数据库读取的值，失败返回 null
 */
function readValue(tableName, id) {
  try {
    const stmt = db.prepare(`SELECT Value FROM ${tableName} WHERE ID = ?`);
    const row = stmt.get(id);
    return row?.Value ?? 0;
  } catch (err) {
    console.error(`readValue failed for table ${tableName}, id ${id}:`, err);
    return null;
  }
}

// console.log(readValue('VFDF', 1));

export { readValue };
