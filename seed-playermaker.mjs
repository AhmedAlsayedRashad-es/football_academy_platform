import { drizzle } from 'drizzle-orm/mysql2';
import { 
  playermakerSettings, 
  playermakerSessions, 
  playermakerPlayerMetrics,
  players 
} from './drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);

async function seedPlayerMakerData() {
  console.log('🌱 Seeding PlayerMaker sample data...');

  try {
    // 1. Create sample settings
    console.log('Creating PlayerMaker settings...');
    await db.insert(playermakerSettings).values({
      clientSecret: 'sample_secret_key_12345',
      clientKey: 'sample_client_key_67890',
      clientTeamId: 'team_future_stars_fc',
      isActive: true,
      lastSyncAt: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        clientSecret: 'sample_secret_key_12345',
        clientKey: 'sample_client_key_67890',
        clientTeamId: 'team_future_stars_fc',
        isActive: true,
        lastSyncAt: new Date(),
      }
    });

    // 2. Get existing players
    console.log('Fetching existing players...');
    const existingPlayers = await db.select().from(players).limit(20);
    
    if (existingPlayers.length === 0) {
      console.log('⚠️  No players found in database. Please create players first.');
      return;
    }

    console.log(`Found ${existingPlayers.length} players`);

    // 3. Create sample sessions (last 30 days)
    console.log('Creating sample sessions...');
    const sessions = [];
    const sessionTypes = ['training', 'match'];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - Math.floor(Math.random() * 30));
      
      const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
      const sessionId = `PM_${sessionType.toUpperCase()}_${Date.now()}_${i}`;

      sessions.push({
        sessionId,
        sessionType,
        sessionDate,
        duration: 60 + Math.floor(Math.random() * 60), // 60-120 minutes
        location: 'Training Ground A',
        notes: `Sample ${sessionType} session`,
        syncedAt: new Date(),
      });
    }

    await db.insert(playermakerSessions).values(sessions);
    console.log(`✅ Created ${sessions.length} sample sessions`);

    // 4. Create player metrics for each session
    console.log('Creating player metrics...');
    const metrics = [];

    for (const session of sessions) {
      // Randomly select 8-12 players per session
      const sessionPlayerCount = 8 + Math.floor(Math.random() * 5);
      const selectedPlayers = existingPlayers
        .sort(() => 0.5 - Math.random())
        .slice(0, sessionPlayerCount);

      for (const player of selectedPlayers) {
        const totalTouches = 50 + Math.floor(Math.random() * 150); // 50-200 touches
        const distanceCovered = (3000 + Math.floor(Math.random() * 5000)).toString(); // 3-8 km
        const topSpeed = (5 + Math.random() * 3).toFixed(2); // 5-8 m/s
        const sprintCount = 10 + Math.floor(Math.random() * 30); // 10-40 sprints
        const accelerationCount = 15 + Math.floor(Math.random() * 40); // 15-55 accelerations

        metrics.push({
          sessionId: session.sessionId,
          playermakerPlayerId: `PM_${player.id}`,
          playerId: player.id,
          playerName: player.name,
          ageGroup: 'U17', // You can randomize this
          totalTouches,
          leftFootTouches: Math.floor(totalTouches * (0.3 + Math.random() * 0.4)),
          rightFootTouches: Math.floor(totalTouches * (0.3 + Math.random() * 0.4)),
          distanceCovered,
          topSpeed,
          averageSpeed: (parseFloat(topSpeed) * 0.6).toFixed(2),
          sprintCount,
          accelerationCount,
          decelerationCount: Math.floor(accelerationCount * 0.8),
          highIntensityDistance: (parseFloat(distanceCovered) * 0.2).toFixed(0),
          createdAt: session.sessionDate,
        });
      }
    }

    // Insert in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < metrics.length; i += batchSize) {
      const batch = metrics.slice(i, i + batchSize);
      await db.insert(playermakerPlayerMetrics).values(batch);
      console.log(`✅ Inserted metrics batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(metrics.length / batchSize)}`);
    }

    console.log(`✅ Created ${metrics.length} player metrics`);
    console.log('');
    console.log('🎉 PlayerMaker sample data seeded successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`  - Settings: 1`);
    console.log(`  - Sessions: ${sessions.length}`);
    console.log(`  - Player Metrics: ${metrics.length}`);
    console.log('');
    console.log('You can now view this data in the PlayerMaker integration page.');

  } catch (error) {
    console.error('❌ Error seeding PlayerMaker data:', error);
    throw error;
  }
}

// Run the seed function
seedPlayerMakerData()
  .then(() => {
    console.log('✅ Seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
