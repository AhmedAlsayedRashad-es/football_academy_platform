import { getDb } from './db';
import { educationCourses, vrScenarios } from '../drizzle/schema';

async function seedSampleData() {
  const db = (await getDb())!;
  if (!db) {
    console.error('Database not available');
    return;
  }

  console.log('Starting sample data seeding...');

  // 1. Create 5 Parent Education Courses
  const courses = [
    {
      title: 'Understanding Youth Football Development',
      description: 'Learn the fundamentals of youth football development and how to support your child',
      category: 'youth_development' as const,
      duration: 120,
      isPublished: true,
    },
    {
      title: 'Nutrition for Young Athletes',
      description: 'Essential nutrition knowledge for parents of young football players',
      category: 'nutrition' as const,
      duration: 90,
      isPublished: true,
    },
    {
      title: 'Mental Health in Youth Sports',
      description: "Supporting your child's mental wellbeing in competitive sports",
      category: 'sports_psychology' as const,
      duration: 100,
      isPublished: true,
    },
    {
      title: 'Injury Prevention and Recovery',
      description: 'Learn how to prevent injuries and support recovery',
      category: 'injury_prevention' as const,
      duration: 80,
      isPublished: true,
    },
    {
      title: 'Communication with Coaches',
      description: 'Effective communication strategies for parents and coaches',
      category: 'general' as const,
      duration: 60,
      isPublished: true,
    },
  ];

  console.log('Inserting courses...');
  await db.insert(educationCourses).values(courses);
  console.log('✓ 5 courses created');

  // 2. Create 10 VR Training Scenarios
  const vrScenarioData = [
    {
      title: 'Penalty Kick Pressure',
      description: 'Practice penalty kicks in high-pressure situations',
      scenarioType: 'set_piece' as const,
      difficulty: 'intermediate' as const,
      duration: 15,
      isPublished: true,
    },
    {
      title: 'Defensive Positioning',
      description: 'Learn optimal defensive positioning against various attacks',
      scenarioType: 'tactical_positioning' as const,
      difficulty: 'advanced' as const,
      duration: 20,
      isPublished: true,
    },
    {
      title: 'First Touch Mastery',
      description: 'Improve your first touch control in game situations',
      scenarioType: 'skill_drill' as const,
      difficulty: 'beginner' as const,
      duration: 10,
      isPublished: true,
    },
    {
      title: 'Counter-Attack Speed',
      description: 'Practice quick transitions from defense to attack',
      scenarioType: 'tactical_positioning' as const,
      difficulty: 'intermediate' as const,
      duration: 18,
      isPublished: true,
    },
    {
      title: 'Goalkeeper Reflexes',
      description: 'Enhance goalkeeper reaction time and positioning',
      scenarioType: 'skill_drill' as const,
      difficulty: 'advanced' as const,
      duration: 12,
      isPublished: true,
    },
    {
      title: 'Passing Under Pressure',
      description: 'Maintain passing accuracy when pressed by opponents',
      scenarioType: 'decision_making' as const,
      difficulty: 'intermediate' as const,
      duration: 15,
      isPublished: true,
    },
    {
      title: 'Set Piece Execution',
      description: 'Master free kicks and corner kick scenarios',
      scenarioType: 'set_piece' as const,
      difficulty: 'advanced' as const,
      duration: 20,
      isPublished: true,
    },
    {
      title: 'Dribbling in Tight Spaces',
      description: 'Improve close control and dribbling skills',
      scenarioType: 'skill_drill' as const,
      difficulty: 'beginner' as const,
      duration: 12,
      isPublished: true,
    },
    {
      title: 'Tactical Awareness Training',
      description: 'Develop game reading and decision-making skills',
      scenarioType: 'decision_making' as const,
      difficulty: 'advanced' as const,
      duration: 25,
      isPublished: true,
    },
    {
      title: 'Heading Technique',
      description: 'Practice safe and effective heading techniques',
      scenarioType: 'skill_drill' as const,
      difficulty: 'beginner' as const,
      duration: 10,
      isPublished: true,
    },
  ];

  console.log('Inserting VR scenarios...');
  await db.insert(vrScenarios).values(vrScenarioData);
  console.log('✓ 10 VR scenarios created');

  console.log('Sample data seeding completed successfully!');
}

seedSampleData().catch(console.error);
