import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('No DATABASE_URL'); process.exit(1); }

const url = new URL(DB_URL.replace('mysql2://', 'http://'));
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});

const migrations = [
  // Add coverPhotoUrl to users
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS coverPhotoUrl TEXT`,
  // Add bio to users
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`,
  // Add nationality to users
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality VARCHAR(100)`,
  // Add dateOfBirth to users
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS dateOfBirth DATE`,
  // Add coverPhotoUrl to players
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS coverPhotoUrl TEXT`,
  // Add bio to players
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS bio TEXT`,
  // Add nationality to players
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS nationality VARCHAR(100)`,
  // Add technicalScore, physicalScore, tacticalScore, mentalScore to players if not exist
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS technicalScore INT`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS physicalScore INT`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS tacticalScore INT`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS mentalScore INT`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS injuryStatus VARCHAR(50)`,
  // Media tagging table
  `CREATE TABLE IF NOT EXISTS media_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mediaId INT NOT NULL,
    taggedUserId INT,
    taggedPlayerId INT,
    taggedByUserId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  // Notifications table (if not exists)
  `CREATE TABLE IF NOT EXISTS user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50) DEFAULT 'info',
    isRead BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
];

for (const sql of migrations) {
  try {
    await conn.execute(sql);
    console.log('OK:', sql.slice(0, 60));
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME' || e.message?.includes('Duplicate column')) {
      console.log('SKIP (already exists):', sql.slice(0, 60));
    } else {
      console.error('ERR:', e.message, '|', sql.slice(0, 60));
    }
  }
}
await conn.end();
console.log('Migration complete');
