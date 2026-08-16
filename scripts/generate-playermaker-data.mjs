#!/usr/bin/env node

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function generateSampleData() {
  const connection = await mysql.createConnection(connectionString);
  const db = drizzle(connection, { schema });

  console.log("Generating sample PlayerMaker data...");

  // Generate sample sessions
  const sessions = [];
  const sessionIds = [];
  
  for (let i = 0; i < 5; i++) {
    const sessionId = `session_${Date.now()}_${i}`;
    sessionIds.push(sessionId);
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    sessions.push({
      sessionId,
      date,
      sessionType: ["training", "match", "friendly"][Math.floor(Math.random() * 3)],
      duration: Math.floor(Math.random() * 60) + 60,
      location: ["Main Field", "Training Ground", "Stadium"][Math.floor(Math.random() * 3)],
      weather: ["sunny", "cloudy", "rainy"][Math.floor(Math.random() * 3)],
      temperature: Math.floor(Math.random() * 20) + 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Insert sessions
  for (const session of sessions) {
    try {
      await db.insert(schema.playermakerSessions).values(session);
      console.log(`Created session: ${session.sessionId}`);
    } catch (error) {
      console.log(`Session ${session.sessionId} might already exist`);
    }
  }

  // Generate sample player metrics
  const playerNames = [
    "Ahmed Hassan",
    "Mohamed Ali",
    "Karim Ibrahim",
    "Youssef Kamal",
    "Hassan Farouk",
    "Sherif Saad",
    "Hamza El-Sayed",
    "Marwan Khaled",
    "Omar Mansour",
    "Sayed El-Shenawy",
  ];

  for (let i = 0; i < 10; i++) {
    for (const sessionId of sessionIds) {
      const playermakerPlayerId = `PM_${270000 + i}`;
      
      try {
        await db.insert(schema.playermakerPlayerMetrics).values({
          sessionId,
          playermakerPlayerId,
          playerId: null,
          playerName: playerNames[i],
          ageGroup: ["U17", "U19", "U21", "Senior"][Math.floor(Math.random() * 4)],
          totalTouches: Math.floor(Math.random() * 200) + 50,
          distanceCovered: Math.floor(Math.random() * 5000) + 3000,
          topSpeed: (Math.random() * 3 + 5).toFixed(1),
          sprints: Math.floor(Math.random() * 20) + 5,
          acceleration: Math.random() * 2 + 1,
          deceleration: Math.random() * 2 + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`Created metrics for ${playerNames[i]} in session ${sessionId}`);
      } catch (error) {
        console.log(`Metrics for ${playerNames[i]} in ${sessionId} might already exist`);
      }
    }
  }

  console.log("Sample data generation completed!");
  await connection.end();
}

generateSampleData().catch((error) => {
  console.error("Error generating sample data:", error);
  process.exit(1);
});
