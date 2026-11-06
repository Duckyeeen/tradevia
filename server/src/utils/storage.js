import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

/**
 * Đọc file JSON từ thư mục data/.
 * @param {string} filename — tên file (ví dụ: 'suppliers.json')
 * @returns {Promise<any>}
 */
export async function readJSON(filename) {
  const filePath = join(DATA_DIR, filename);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Ghi dữ liệu vào file JSON trong thư mục data/.
 * @param {string} filename — tên file
 * @param {any} data — dữ liệu cần ghi
 */
export async function writeJSON(filename, data) {
  const filePath = join(DATA_DIR, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

