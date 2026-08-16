import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('missing url');
  process.exit(1);
}

try {
  const pool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  });
  const conn = await pool.getConnection();
  const [rows] = await conn.query('SELECT 1 AS ok');
  console.log(rows);
  conn.release();
  await pool.end();
} catch (error) {
  console.error(error.code || '', error.message);
  process.exit(1);
}
