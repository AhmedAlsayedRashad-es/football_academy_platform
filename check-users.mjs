import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, openId, name, email, role FROM users');
console.log(JSON.stringify(rows, null, 2));
await conn.end();
