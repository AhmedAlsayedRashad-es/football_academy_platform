import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// Load env
const envContent = readFileSync('.env', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
}
Object.assign(process.env, env);

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

console.log('Running WebAuthn migration...');

const conn = await mysql.createConnection(dbUrl);

try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      credential_id VARCHAR(512) NOT NULL UNIQUE,
      public_key TEXT NOT NULL,
      counter BIGINT NOT NULL DEFAULT 0,
      device_type VARCHAR(32) NOT NULL DEFAULT 'singleDevice',
      backed_up TINYINT NOT NULL DEFAULT 0,
      transports VARCHAR(255),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_webauthn_user_id (user_id),
      INDEX idx_webauthn_credential_id (credential_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ webauthn_credentials table created successfully');
} catch (err) {
  if (err.code === 'ER_TABLE_EXISTS_ERROR') {
    console.log('ℹ️  webauthn_credentials table already exists');
  } else {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
} finally {
  await conn.end();
}
