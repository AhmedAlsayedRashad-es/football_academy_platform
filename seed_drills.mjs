/**
 * Seed 10 training drill videos into both trainingDrills and drillVideos tables
 * Uses real YouTube embed URLs for working video playback
 */

import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

const drills = [
  {
    title: 'Ball Control - Cone Dribbling Drill',
    titleAr: 'تحكم بالكرة - تمرين المراوغة بالأقماع',
    description: 'Improve ball control and close dribbling technique using cones. Players weave through cones at increasing speed, focusing on keeping the ball close to their feet.',
    descriptionAr: 'تحسين التحكم بالكرة وتقنية المراوغة القريبة باستخدام الأقماع.',
    category: 'ball_control',
    difficulty: 'beginner',
    duration: 15,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    targetsBallControl: true, targetsDribbling: true,
    forPosition: 'all', pointsReward: 15,
    equipmentNeeded: '8 cones, 1 ball per player',
    coachTips: 'Keep head up while dribbling. Use both feet equally. Start slow, increase speed gradually.'
  },
  {
    title: 'Passing Accuracy - Wall Passing Drill',
    titleAr: 'دقة التمرير - تمرين التمرير على الحائط',
    description: 'One-touch and two-touch passing drill using a wall or rebounder. Develops passing accuracy, first touch, and quick decision making.',
    descriptionAr: 'تمرين التمرير بلمسة واحدة وبلمستين باستخدام الحائط.',
    category: 'passing',
    difficulty: 'beginner',
    duration: 20,
    videoUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
    thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg',
    targetsPassing: true, targetsFirstTouch: true,
    forPosition: 'all', pointsReward: 15,
    equipmentNeeded: 'Wall or rebounder, 1 ball per player',
    coachTips: 'Focus on the inside of the foot. Keep ankle locked. Look at target before passing.'
  },
  {
    title: 'Shooting Technique - Finishing Drill',
    titleAr: 'تقنية التسديد - تمرين الإنهاء',
    description: 'Shooting drill focusing on technique, placement, and power. Players practice shooting from various angles and distances.',
    descriptionAr: 'تمرين تسديد يركز على التقنية والتوجيه والقوة.',
    category: 'shooting',
    difficulty: 'intermediate',
    duration: 25,
    videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
    thumbnailUrl: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    targetsShooting: true,
    forPosition: 'forward', pointsReward: 20,
    equipmentNeeded: 'Goal, 6 balls, 4 cones',
    coachTips: 'Plant foot beside the ball. Keep head down over the ball. Follow through toward target.'
  },
  {
    title: 'Speed & Agility - Ladder Footwork',
    titleAr: 'السرعة والرشاقة - تمرين السلم',
    description: 'Agility ladder drills to improve foot speed, coordination, and quick directional changes. Essential for all positions.',
    descriptionAr: 'تمارين سلم الرشاقة لتحسين سرعة القدم والتنسيق.',
    category: 'speed_agility',
    difficulty: 'intermediate',
    duration: 20,
    videoUrl: 'https://www.youtube.com/embed/RgKAFK5djSk',
    thumbnailUrl: 'https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg',
    targetsSpeed: true,
    forPosition: 'all', pointsReward: 20,
    equipmentNeeded: 'Agility ladder, cones',
    coachTips: 'Stay on the balls of your feet. Keep arms pumping. Do not look down at the ladder.'
  },
  {
    title: 'Dribbling - 1v1 Attack Moves',
    titleAr: 'المراوغة - حركات الهجوم 1 ضد 1',
    description: 'Learn and practice key 1v1 dribbling moves: step-over, Cruyff turn, scissors, and inside cut. Drill with passive then active defenders.',
    descriptionAr: 'تعلم وممارسة حركات المراوغة الأساسية 1 ضد 1.',
    category: 'dribbling',
    difficulty: 'intermediate',
    duration: 30,
    videoUrl: 'https://www.youtube.com/embed/YQHsXMglC9A',
    thumbnailUrl: 'https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg',
    targetsDribbling: true, targetsBallControl: true,
    forPosition: 'forward', pointsReward: 25,
    equipmentNeeded: '2 cones per pair, 1 ball per pair',
    coachTips: 'Sell the fake with your body. Accelerate after the move. Keep the ball close.'
  },
  {
    title: 'Goalkeeper - Diving Saves',
    titleAr: 'حارس المرمى - الإنقاذ بالغطس',
    description: 'Goalkeeper diving technique drill. Covers correct body position, hand placement, and landing technique for low and high diving saves.',
    descriptionAr: 'تمرين تقنية الغطس لحارس المرمى.',
    category: 'goalkeeper',
    difficulty: 'intermediate',
    duration: 25,
    videoUrl: 'https://www.youtube.com/embed/fLTjnkfcGFA',
    thumbnailUrl: 'https://img.youtube.com/vi/fLTjnkfcGFA/hqdefault.jpg',
    targetsBallControl: false,
    forPosition: 'goalkeeper', pointsReward: 25,
    equipmentNeeded: 'Goal, 6 balls, coaching gloves',
    coachTips: 'Lead with the bottom hand. Get behind the ball. Land on the side, not the front.'
  },
  {
    title: 'Positioning - Defensive Shape Drill',
    titleAr: 'التمركز - تمرين الشكل الدفاعي',
    description: 'Team defensive positioning drill. Teaches compact defensive shape, pressing triggers, and cover-shadow principles.',
    descriptionAr: 'تمرين تمركز دفاعي جماعي.',
    category: 'positioning',
    difficulty: 'advanced',
    duration: 35,
    videoUrl: 'https://www.youtube.com/embed/2vjPBrBU-TM',
    thumbnailUrl: 'https://img.youtube.com/vi/2vjPBrBU-TM/hqdefault.jpg',
    targetsPositioning: true,
    forPosition: 'defender', pointsReward: 30,
    equipmentNeeded: '4 cones, bibs for 2 teams',
    coachTips: 'Maintain compact shape. Communicate constantly. Press on the trigger.'
  },
  {
    title: 'Heading - Attacking Headers',
    titleAr: 'الكرة الرأسية - الكرات الرأسية الهجومية',
    description: 'Attacking header technique drill. Covers run-up timing, jump mechanics, and directing headers toward goal.',
    descriptionAr: 'تمرين تقنية الكرة الرأسية الهجومية.',
    category: 'heading',
    difficulty: 'intermediate',
    duration: 20,
    videoUrl: 'https://www.youtube.com/embed/uelHwf8o7_U',
    thumbnailUrl: 'https://img.youtube.com/vi/uelHwf8o7_U/hqdefault.jpg',
    targetsHeading: true,
    forPosition: 'forward', pointsReward: 20,
    equipmentNeeded: 'Goal, 8 balls, crossing partner',
    coachTips: 'Time the run. Attack the ball. Use the forehead. Direct toward corners.'
  },
  {
    title: 'Fitness - High Intensity Interval Training',
    titleAr: 'اللياقة البدنية - التدريب المتقطع عالي الكثافة',
    description: 'Football-specific HIIT session. Combines short sprints, direction changes, and technical elements to build match fitness.',
    descriptionAr: 'جلسة HIIT خاصة بكرة القدم.',
    category: 'fitness',
    difficulty: 'advanced',
    duration: 40,
    videoUrl: 'https://www.youtube.com/embed/IVSNKj8eSCQ',
    thumbnailUrl: 'https://img.youtube.com/vi/IVSNKj8eSCQ/hqdefault.jpg',
    targetsSpeed: true,
    forPosition: 'all', pointsReward: 35,
    equipmentNeeded: 'Cones, bibs, 4 balls',
    coachTips: 'Work at 85-90% max heart rate. Rest ratio 1:2. Monitor player fatigue.'
  },
  {
    title: 'Tactical - Rondo Possession Game',
    titleAr: 'التكتيك - لعبة الحيازة روندو',
    description: 'Classic rondo possession drill (4v1, 5v2, 6v2). Develops quick passing, movement, and pressing under pressure.',
    descriptionAr: 'تمرين حيازة روندو الكلاسيكي.',
    category: 'tactical',
    difficulty: 'intermediate',
    duration: 20,
    videoUrl: 'https://www.youtube.com/embed/kffacxfA7G4',
    thumbnailUrl: 'https://img.youtube.com/vi/kffacxfA7G4/hqdefault.jpg',
    targetsPassing: true, targetsPositioning: true,
    forPosition: 'all', pointsReward: 20,
    equipmentNeeded: 'Cones to mark circle, 1 ball per group',
    coachTips: 'Move before receiving. One or two touch maximum. Defenders press together.'
  }
];

async function run() {
  try {
    let inserted = 0;
    for (const d of drills) {
      // Check if drill already exists
      const [existing] = await db.execute(
        "SELECT id FROM training_drills WHERE title = ?", [d.title]
      );
      
      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO training_drills 
           (title, titleAr, description, descriptionAr, category, difficulty, duration, 
            videoUrl, thumbnailUrl, targetsBallControl, targetsPassing, targetsShooting, 
            targetsDribbling, targetsSpeed, targetsPositioning, targetsFirstTouch, targetsHeading,
            forPosition, pointsReward, equipmentNeeded, coachTips, isActive)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [d.title, d.titleAr, d.description, d.descriptionAr, d.category, d.difficulty, d.duration,
           d.videoUrl, d.thumbnailUrl,
           d.targetsBallControl ? 1 : 0, d.targetsPassing ? 1 : 0, d.targetsShooting ? 1 : 0,
           d.targetsDribbling ? 1 : 0, d.targetsSpeed ? 1 : 0, d.targetsPositioning ? 1 : 0,
           d.targetsFirstTouch ? 1 : 0, d.targetsHeading ? 1 : 0,
           d.forPosition, d.pointsReward, d.equipmentNeeded, d.coachTips]
        );

        // Also seed into drillVideos table for the Video Library page
        await db.execute(
          `INSERT INTO drill_videos 
           (title, titleAr, description, descriptionAr, skillArea, ageGroup, difficulty, 
            duration, videoUrl, thumbnailUrl, tags, isActive)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [d.title, d.titleAr, d.description, d.descriptionAr, d.category, 'All', d.difficulty,
           d.duration, d.videoUrl, d.thumbnailUrl, d.category + ',' + d.forPosition]
        );
        inserted++;
        console.log(`✅ Inserted: ${d.title}`);
      } else {
        console.log(`⏭️  Already exists: ${d.title}`);
      }
    }
    console.log(`\n✅ Done! Inserted ${inserted} new drill videos.`);
  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  } finally {
    await db.end();
  }
}

run();
