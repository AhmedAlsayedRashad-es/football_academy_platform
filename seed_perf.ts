import { getDb } from './server/db';
import { performanceMetrics, players } from './drizzle/schema';

async function seedPerformanceMetrics() {
  const database = await getDb();
  if (!database) {
    console.error('No database connection');
    process.exit(1);
  }

  const allPlayers = await database.select({ id: players.id }).from(players).limit(50);
  const sessionTypes = ['training', 'match', 'friendly'] as const;

  let count = 0;
  for (const player of allPlayers) {
    for (let i = 0; i < 8; i++) {
      const daysAgo = Math.floor(Math.random() * 180);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const sessionDate = d.toISOString().split('T')[0];
      const tech = 60 + Math.floor(Math.random() * 35);
      const phys = 55 + Math.floor(Math.random() * 40);
      const tact = 58 + Math.floor(Math.random() * 37);
      const overall = Math.floor((tech + phys + tact) / 3);

      try {
        await database.insert(performanceMetrics).values({
          playerId: player.id,
          sessionDate,
          sessionType: sessionTypes[Math.floor(Math.random() * 3)],
          touches: 30 + Math.floor(Math.random() * 60),
          passes: 20 + Math.floor(Math.random() * 50),
          passAccuracy: 70 + Math.floor(Math.random() * 25),
          shots: Math.floor(Math.random() * 8),
          shotsOnTarget: Math.floor(Math.random() * 5),
          dribbles: Math.floor(Math.random() * 10),
          successfulDribbles: Math.floor(Math.random() * 8),
          distanceCovered: 4000 + Math.floor(Math.random() * 4000),
          topSpeed: 200 + Math.floor(Math.random() * 50),
          sprints: 10 + Math.floor(Math.random() * 20),
          accelerations: 8 + Math.floor(Math.random() * 15),
          decelerations: 8 + Math.floor(Math.random() * 15),
          possessionWon: Math.floor(Math.random() * 8),
          possessionLost: Math.floor(Math.random() * 6),
          interceptions: Math.floor(Math.random() * 5),
          tackles: Math.floor(Math.random() * 6),
          technicalScore: tech,
          physicalScore: phys,
          tacticalScore: tact,
          overallScore: overall,
        });
        count++;
      } catch (e) {
        // skip duplicates
      }
    }
  }
  console.log(`Inserted ${count} performance metric records`);
  process.exit(0);
}

seedPerformanceMetrics().catch((e) => { console.error(e); process.exit(1); });
