import { createConnection } from 'mysql2/promise';
const conn = await createConnection(process.env.DATABASE_URL);

// Create media_tags table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS media_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mediaId INT NOT NULL,
    taggedUserId INT NULL,
    taggedPlayerId INT NULL,
    taggedByUserId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tag (mediaId, taggedUserId, taggedPlayerId)
  )
`);
console.log('media_tags table created');

// Create user_notifications table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NULL,
    type ENUM('info','success','warning','error','goal','training','medical','payment') DEFAULT 'info',
    link VARCHAR(500) NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_notif (userId, isRead, createdAt)
  )
`);
console.log('user_notifications table created');

await conn.end();
console.log('Done!');
