import { createConnection } from './node_modules/mysql2/promise/index.js';
import { readFileSync } from 'fs';

const envContent = readFileSync('/home/ubuntu/football_academy_platform/.env', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!dbUrlMatch) { console.log('No DB URL found'); process.exit(1); }

const url = dbUrlMatch[1];
const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
const [,user,pass,host,port,db] = match;

const conn = await createConnection({host, port: +port, user, password: pass, database: db, ssl: {rejectUnauthorized: true}});
const [rows] = await conn.execute('SHOW TABLES');
const tables = rows.map(r => Object.values(r)[0]);
console.log('Relevant tables:', JSON.stringify(tables.filter(t => t.includes('transfer') || t.includes('valuation') || t.includes('scouting') || t.includes('watchlist'))));

// Check if player_valuations exists
const hasValuations = tables.includes('player_valuations');
console.log('player_valuations exists:', hasValuations);

if (!hasValuations) {
  console.log('Creating player_valuations table...');
  await conn.execute(`CREATE TABLE IF NOT EXISTS player_valuations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playerId INT NOT NULL,
    valuationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estimatedValue DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    technicalScore INT DEFAULT 50,
    physicalScore INT DEFAULT 50,
    mentalScore INT DEFAULT 50,
    performanceScore INT DEFAULT 50,
    potentialScore INT DEFAULT 50,
    marketDemandScore INT DEFAULT 50,
    injuryRiskScore INT DEFAULT 50,
    contractScore INT DEFAULT 50,
    overallRating INT DEFAULT 50,
    trend ENUM('rising','stable','declining') DEFAULT 'stable',
    comparablePlayer VARCHAR(100),
    aiNarrative TEXT,
    valuedByUserId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`);
  console.log('player_valuations table created!');
}
await conn.end();
