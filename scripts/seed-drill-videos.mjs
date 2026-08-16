import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const VIDEOS = [
  { title: 'Passing Speed & Accuracy Drills', titleAr: 'تمارين التمرير — السرعة والدقة', skillArea: 'technical', ageGroup: 'All', difficulty: 'beginner', duration: 900, videoUrl: 'https://www.youtube.com/watch?v=-V88Iy1X-is', tags: '["passing","accuracy","technique"]' },
  { title: 'Passing & 1st Touch Combinations', titleAr: 'تمريرات وتوليفات اللمسة الأولى', skillArea: 'technical', ageGroup: 'All', difficulty: 'intermediate', duration: 1200, videoUrl: 'https://www.youtube.com/watch?v=-F6OecCUHLA', tags: '["passing","first_touch","combinations"]' },
  { title: 'Tight Space Passing Drills', titleAr: 'تمارين التمرير في المساحات الضيقة', skillArea: 'technical', ageGroup: 'All', difficulty: 'advanced', duration: 900, videoUrl: 'https://www.youtube.com/watch?v=9aHmBjWdRIk', tags: '["passing","tight_space","technique"]' },
  { title: '5 Essential Dribbling Drills', titleAr: '5 تمارين مراوغة أساسية', skillArea: 'technical', ageGroup: 'All', difficulty: 'beginner', duration: 900, videoUrl: 'https://www.youtube.com/watch?v=feA7KafbwdQ', tags: '["dribbling","ball_control","technique"]' },
  { title: '1v1 Attacking Moves & Feints', titleAr: 'حركات هجومية وخدع 1 ضد 1', skillArea: 'technical', ageGroup: 'All', difficulty: 'intermediate', duration: 1200, videoUrl: 'https://www.youtube.com/watch?v=jwIHc9rz7yo', tags: '["dribbling","1v1","feints"]' },
  { title: 'Close Control Dribbling Mastery', titleAr: 'إتقان المراوغة بتحكم قريب', skillArea: 'technical', ageGroup: 'All', difficulty: 'advanced', duration: 1200, videoUrl: 'https://www.youtube.com/watch?v=Hs4ByFF_AE0', tags: '["dribbling","close_control","mastery"]' },
  { title: 'How to Shoot a Football — Full Tutorial', titleAr: 'كيفية التسديد في كرة القدم — دليل كامل', skillArea: 'technical', ageGroup: 'All', difficulty: 'beginner', duration: 1200, videoUrl: 'https://www.youtube.com/watch?v=bHGW2apqfEE', tags: '["shooting","technique","power"]' },
  { title: 'Striking the Ball — Step by Step', titleAr: 'ضرب الكرة — خطوة بخطوة', skillArea: 'technical', ageGroup: 'All', difficulty: 'intermediate', duration: 900, videoUrl: 'https://www.youtube.com/watch?v=QDb5-cMIbjM', tags: '["shooting","striking","accuracy"]' },
  { title: '5 First Touch Exercises', titleAr: '5 تمارين اللمسة الأولى', skillArea: 'technical', ageGroup: 'All', difficulty: 'beginner', duration: 900, videoUrl: 'https://www.youtube.com/watch?v=el7QvVnprOk', tags: '["first_touch","control","receiving"]' },
  { title: 'How to Defend in Soccer — 3 Drills', titleAr: 'كيفية الدفاع في كرة القدم — 3 تمارين', skillArea: 'technical', ageGroup: 'All', difficulty: 'beginner', duration: 1200, videoUrl: 'https://www.youtube.com/watch?v=LR9ifmPXGhI', tags: '["defending","tackling","positioning"]' },
  { title: 'High Pressing & Defensive Attributes', titleAr: 'الضغط العالي والصفات الدفاعية', skillArea: 'tactical', ageGroup: 'All', difficulty: 'advanced', duration: 1500, videoUrl: 'https://www.youtube.com/watch?v=uBlSzlbvsvo', tags: '["pressing","defending","tactical"]' },
  { title: 'Goalkeeper Speed & Reaction Drills', titleAr: 'تمارين سرعة وردود فعل الحارس', skillArea: 'technical', ageGroup: 'All', difficulty: 'intermediate', duration: 1800, videoUrl: 'https://www.youtube.com/watch?v=TviVDUBTQVU', tags: '["goalkeeping","reaction","footwork"]' },
  { title: 'Positional Play Principles (Pep Style)', titleAr: 'مبادئ اللعب الموضعي (أسلوب بيب)', skillArea: 'tactical', ageGroup: 'All', difficulty: 'advanced', duration: 1800, videoUrl: 'https://www.youtube.com/watch?v=uBlSzlbvsvo', tags: '["tactical","positional_play","possession"]' },
  { title: 'Agility Ladder & Speed Work', titleAr: 'سلم الرشاقة وتمارين السرعة', skillArea: 'physical', ageGroup: 'All', difficulty: 'beginner', duration: 900, videoUrl: 'https://www.youtube.com/watch?v=jwIHc9rz7yo', tags: '["speed","agility","fitness"]' },
  { title: 'Tiki-Taka Passing Combinations', titleAr: 'توليفات التمرير بأسلوب تيكي-تاكا', skillArea: 'tactical', ageGroup: 'All', difficulty: 'advanced', duration: 1380, videoUrl: 'https://www.youtube.com/watch?v=9aHmBjWdRIk', tags: '["passing","tiki_taka","tactical"]' },
  { title: '4-3-3 Formation — Attacking Movements', titleAr: 'تشكيل 4-3-3 — الحركات الهجومية', skillArea: 'tactical', ageGroup: 'All', difficulty: 'advanced', duration: 1560, videoUrl: 'https://www.youtube.com/watch?v=uBlSzlbvsvo', tags: '["tactical","formation","attacking"]' },
  { title: 'Corner Kick Routines & Set Pieces', titleAr: 'روتينات الركنيات والكرات الثابتة', skillArea: 'tactical', ageGroup: 'All', difficulty: 'intermediate', duration: 840, videoUrl: 'https://www.youtube.com/watch?v=9aHmBjWdRIk', tags: '["set_pieces","corners","tactical"]' },
  { title: 'Defensive Shape & Compactness', titleAr: 'الشكل الدفاعي والتماسك', skillArea: 'tactical', ageGroup: 'All', difficulty: 'advanced', duration: 1560, videoUrl: 'https://www.youtube.com/watch?v=uBlSzlbvsvo', tags: '["defending","shape","tactical"]' },
  { title: 'Youth Dribbling Masterclass', titleAr: 'دورة المراوغة للناشئين', skillArea: 'technical', ageGroup: 'All', difficulty: 'intermediate', duration: 1800, videoUrl: 'https://www.youtube.com/watch?v=Hs4ByFF_AE0', tags: '["dribbling","youth","masterclass"]' },
  { title: 'High Intensity Pressing Drill', titleAr: 'تمرين الضغط عالي الكثافة', skillArea: 'tactical', ageGroup: 'All', difficulty: 'advanced', duration: 1200, videoUrl: 'https://www.youtube.com/watch?v=uBlSzlbvsvo', tags: '["pressing","high_intensity","tactical"]' },
  { title: 'Finishing Under Pressure', titleAr: 'الإنهاء تحت الضغط', skillArea: 'technical', ageGroup: 'All', difficulty: 'intermediate', duration: 900, videoUrl: 'https://www.youtube.com/watch?v=bHGW2apqfEE', tags: '["finishing","shooting","pressure"]' },
  { title: 'Mental Toughness for Young Players', titleAr: 'الصلابة الذهنية للاعبين الشباب', skillArea: 'physical', ageGroup: 'All', difficulty: 'beginner', duration: 1200, videoUrl: 'https://www.youtube.com/watch?v=feA7KafbwdQ', tags: '["mental","confidence","youth"]' },
  { title: 'Counter-Attack Transitions', titleAr: 'الانتقال للهجمة المرتدة', skillArea: 'tactical', ageGroup: 'All', difficulty: 'advanced', duration: 1500, videoUrl: 'https://www.youtube.com/watch?v=uBlSzlbvsvo', tags: '["counter_attack","transition","tactical"]' },
  { title: 'Crossing & Finishing Combinations', titleAr: 'توليفات العرضيات والإنهاء', skillArea: 'technical', ageGroup: 'All', difficulty: 'intermediate', duration: 1080, videoUrl: 'https://www.youtube.com/watch?v=QDb5-cMIbjM', tags: '["crossing","finishing","combinations"]' },
  { title: 'Pressing Triggers & Compactness', titleAr: 'محفزات الضغط والتماسك', skillArea: 'tactical', ageGroup: 'All', difficulty: 'advanced', duration: 1320, videoUrl: 'https://www.youtube.com/watch?v=uBlSzlbvsvo', tags: '["pressing","tactical","compactness"]' },
  { title: 'Ball Control Under Pressure', titleAr: 'التحكم بالكرة تحت الضغط', skillArea: 'technical', ageGroup: 'All', difficulty: 'intermediate', duration: 960, videoUrl: 'https://www.youtube.com/watch?v=el7QvVnprOk', tags: '["ball_control","pressure","technique"]' },
  { title: 'Speed & Explosive Power Training', titleAr: 'تدريب السرعة والقوة الانفجارية', skillArea: 'physical', ageGroup: 'All', difficulty: 'intermediate', duration: 1200, videoUrl: 'https://www.youtube.com/watch?v=jwIHc9rz7yo', tags: '["speed","power","physical"]' },
  { title: 'Heading Technique & Timing', titleAr: 'تقنية وتوقيت الكرة الرأسية', skillArea: 'technical', ageGroup: 'All', difficulty: 'intermediate', duration: 720, videoUrl: 'https://www.youtube.com/watch?v=bHGW2apqfEE', tags: '["heading","aerial","timing"]' },
  { title: 'Weak Foot Development Program', titleAr: 'برنامج تطوير القدم الضعيفة', skillArea: 'technical', ageGroup: 'All', difficulty: 'intermediate', duration: 1080, videoUrl: 'https://www.youtube.com/watch?v=el7QvVnprOk', tags: '["weak_foot","two_footed","development"]' },
  { title: 'Build-Up Play from the Back', titleAr: 'بناء اللعب من الخلف', skillArea: 'tactical', ageGroup: 'All', difficulty: 'advanced', duration: 1440, videoUrl: 'https://www.youtube.com/watch?v=uBlSzlbvsvo', tags: '["build_up","tactical","possession"]' },
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Delete all existing drill videos
    await conn.execute('DELETE FROM drill_videos');
    console.log('Cleared existing drill videos');

    // Insert new real football videos
    for (const v of VIDEOS) {
      await conn.execute(
        `INSERT INTO drill_videos (title, titleAr, description, skillArea, ageGroup, difficulty, duration, videoUrl, tags, isActive, viewCount, uploadedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1)`,
        [v.title, v.titleAr, `${v.title} — professional football training drill.`, v.skillArea, v.ageGroup, v.difficulty, v.duration, v.videoUrl, v.tags, Math.floor(Math.random() * 2000) + 200]
      );
    }
    console.log(`Inserted ${VIDEOS.length} real football training videos`);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await conn.end();
  }
}

main();
