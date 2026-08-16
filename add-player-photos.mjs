import mysql from 'mysql2/promise';
import 'dotenv/config';

const photoUrls = [
  'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031075609/oepfPMfwejOZLnxL.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031075609/qqVpMYhJWwABxoov.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031075609/pCTQUXxbJLGzbmTJ.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031075609/rcGkRxKsVxmyikiM.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031075609/ZSTpuheXuSzrUvmq.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031075609/SKzTJwmelamgLKQj.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031075609/hnCkqYTCDlomWfvd.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031075609/ZQMHWJWmxTnaETNy.jpg',
];

async function addPlayerPhotos() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🔴 Starting to add player photos...');
    
    // Get all players
    const [players] = await conn.execute('SELECT id FROM players LIMIT 30');
    console.log(`Found ${players.length} players`);
    
    // Assign photos to players
    let photoIndex = 0;
    for (const player of players) {
      const photoUrl = photoUrls[photoIndex % photoUrls.length];
      await conn.execute(
        'UPDATE players SET photoUrl = ? WHERE id = ?',
        [photoUrl, player.id]
      );
      photoIndex++;
    }
    
    console.log(`✅ Added photos to ${players.length} players`);
    
    // Verify
    const [updated] = await conn.execute('SELECT COUNT(*) as cnt FROM players WHERE photoUrl IS NOT NULL');
    console.log(`✅ Total players with photos: ${updated[0].cnt}`);
    
  } finally {
    await conn.end();
  }
}

addPlayerPhotos().catch(console.error);
