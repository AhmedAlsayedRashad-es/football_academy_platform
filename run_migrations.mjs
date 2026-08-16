import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await createConnection(url);

const migrations = [
  // Add isPublicProfile to players table
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS isPublicProfile BOOLEAN DEFAULT FALSE`,
  // Add player_development_goals table if it doesn't exist
  `CREATE TABLE IF NOT EXISTS player_development_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playerId INT NOT NULL,
    createdByUserId INT,
    category_pdg ENUM('technical','physical','tactical','mental') NOT NULL DEFAULT 'technical',
    title_pdg VARCHAR(200) NOT NULL,
    description_pdg TEXT,
    targetDate_pdg DATE,
    progress_pdg INT NOT NULL DEFAULT 0,
    priority_pdg ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
    completed_pdg BOOLEAN NOT NULL DEFAULT FALSE,
    drills_pdg TEXT,
    notes_pdg TEXT,
    createdAt_pdg TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt_pdg TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (playerId) REFERENCES players(id)
  )`,
  // Add group_development_plans table if it doesn't exist
  `CREATE TABLE IF NOT EXISTS group_development_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_gdp VARCHAR(200) NOT NULL,
    createdByUserId_gdp INT,
    playerIds_gdp TEXT NOT NULL,
    notes_gdp TEXT,
    createdAt_gdp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt_gdp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
];

for (const sql of migrations) {
  try {
    await conn.execute(sql);
    console.log('OK:', sql.substring(0, 60) + '...');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column')) {
      console.log('SKIP (already exists):', sql.substring(0, 60));
    } else {
      console.error('ERROR:', err.message, '\nSQL:', sql.substring(0, 80));
    }
  }
}

await conn.end();
console.log('Migrations complete');
