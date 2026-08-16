import "dotenv/config";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log("Creating session_executions table...");
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS session_executions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trainingSessionId_se INT NOT NULL,
      teamId_se INT,
      coachId_se INT,
      executionDate_se DATE NOT NULL,
      status_se ENUM('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
      actualDuration_se INT,
      weatherConditions_se VARCHAR(100),
      pitchCondition_se ENUM('excellent','good','fair','poor') DEFAULT 'good',
      coachNotes_se TEXT,
      overallRating_se INT,
      energyLevel_se INT,
      focusLevel_se INT,
      drillsCompleted_se JSON,
      goalsUpdated_se JSON,
      createdAt_se TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt_se TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (trainingSessionId_se) REFERENCES training_sessions(id),
      FOREIGN KEY (coachId_se) REFERENCES users(id)
    )
  `);
  console.log("session_executions created ✓");

  console.log("Creating session_attendance table...");
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS session_attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sessionExecutionId_sa INT NOT NULL,
      playerId_sa INT NOT NULL,
      status_sa ENUM('present','absent','late','injured','excused') NOT NULL DEFAULT 'present',
      minutesPlayed_sa INT,
      performanceRating_sa INT,
      notes_sa TEXT,
      createdAt_sa TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (sessionExecutionId_sa) REFERENCES session_executions(id),
      FOREIGN KEY (playerId_sa) REFERENCES players(id)
    )
  `);
  console.log("session_attendance created ✓");

  console.log("All tables created successfully!");
} catch (err) {
  console.error("Migration error:", err.message);
} finally {
  await connection.end();
}
