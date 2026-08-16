// One-time migration script to create ai_tool_usage table
import { getDb } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Connecting to database...');
  const db = await getDb();
  if (!db) {
    console.error('No DB connection available');
    process.exit(1);
  }
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_tool_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tool_path VARCHAR(255) NOT NULL,
        tool_label VARCHAR(255) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ ai_tool_usage table created successfully');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('ℹ️ Table already exists, skipping');
    } else {
      console.error('Error creating table:', err.message);
      process.exit(1);
    }
  }
  
  process.exit(0);
}

main();
