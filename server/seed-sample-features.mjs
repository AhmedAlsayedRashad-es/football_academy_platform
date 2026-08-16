import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seedSampleData() {
  console.log('Starting sample data seeding...');

  // 1. Create 5 Parent Education Courses
  const courses = [
    {
      title: 'Understanding Youth Football Development',
      titleAr: 'فهم تطوير كرة القدم للشباب',
      description: 'Learn the fundamentals of youth football development and how to support your child',
      descriptionAr: 'تعلم أساسيات تطوير كرة القدم للشباب وكيفية دعم طفلك',
      category: 'development',
      duration: 120,
      isPublished: true,
    },
    {
      title: 'Nutrition for Young Athletes',
      titleAr: 'التغذية للرياضيين الشباب',
      description: 'Essential nutrition knowledge for parents of young football players',
      descriptionAr: 'معرفة التغذية الأساسية لأولياء أمور لاعبي كرة القدم الشباب',
      category: 'nutrition',
      duration: 90,
      isPublished: true,
    },
    {
      title: 'Mental Health in Youth Sports',
      titleAr: 'الصحة النفسية في الرياضة للشباب',
      description: 'Supporting your child\'s mental wellbeing in competitive sports',
      descriptionAr: 'دعم الصحة النفسية لطفلك في الرياضة التنافسية',
      category: 'mental_health',
      duration: 100,
      isPublished: true,
    },
    {
      title: 'Injury Prevention and Recovery',
      titleAr: 'الوقاية من الإصابات والتعافي',
      description: 'Learn how to prevent injuries and support recovery',
      descriptionAr: 'تعلم كيفية الوقاية من الإصابات ودعم التعافي',
      category: 'health',
      duration: 80,
      isPublished: true,
    },
    {
      title: 'Communication with Coaches',
      titleAr: 'التواصل مع المدربين',
      description: 'Effective communication strategies for parents and coaches',
      descriptionAr: 'استراتيجيات التواصل الفعال لأولياء الأمور والمدربين',
      category: 'communication',
      duration: 60,
      isPublished: true,
    },
  ];

  console.log('Inserting courses...');
  await db.insert(schema.educationCourses).values(courses);
  console.log('✓ 5 courses created');

  // 2. Create 10 VR Training Scenarios
  const vrScenarios = [
    {
      title: 'Penalty Kick Pressure',
      titleAr: 'ضغط ركلة الجزاء',
      description: 'Practice penalty kicks in high-pressure situations',
      descriptionAr: 'تدرب على ركلات الجزاء في مواقف الضغط العالي',
      difficulty: 'intermediate',
      duration: 15,
      category: 'shooting',
      isActive: true,
    },
    {
      title: 'Defensive Positioning',
      titleAr: 'المواقع الدفاعية',
      description: 'Learn optimal defensive positioning against various attacks',
      descriptionAr: 'تعلم المواقع الدفاعية المثلى ضد الهجمات المختلفة',
      difficulty: 'advanced',
      duration: 20,
      category: 'defending',
      isActive: true,
    },
    {
      title: 'First Touch Mastery',
      titleAr: 'إتقان اللمسة الأولى',
      description: 'Improve your first touch control in game situations',
      descriptionAr: 'حسّن سيطرتك على اللمسة الأولى في مواقف اللعب',
      difficulty: 'beginner',
      duration: 10,
      category: 'ball_control',
      isActive: true,
    },
    {
      title: 'Counter-Attack Speed',
      titleAr: 'سرعة الهجوم المضاد',
      description: 'Practice quick transitions from defense to attack',
      descriptionAr: 'تدرب على الانتقالات السريعة من الدفاع إلى الهجوم',
      difficulty: 'intermediate',
      duration: 18,
      category: 'tactics',
      isActive: true,
    },
    {
      title: 'Goalkeeper Reflexes',
      titleAr: 'ردود أفعال حارس المرمى',
      description: 'Enhance goalkeeper reaction time and positioning',
      descriptionAr: 'عزز وقت رد فعل حارس المرمى ومواقعه',
      difficulty: 'advanced',
      duration: 12,
      category: 'goalkeeping',
      isActive: true,
    },
    {
      title: 'Passing Under Pressure',
      titleAr: 'التمرير تحت الضغط',
      description: 'Maintain passing accuracy when pressed by opponents',
      descriptionAr: 'حافظ على دقة التمرير عند الضغط من الخصوم',
      difficulty: 'intermediate',
      duration: 15,
      category: 'passing',
      isActive: true,
    },
    {
      title: 'Set Piece Execution',
      titleAr: 'تنفيذ الكرات الثابتة',
      description: 'Master free kicks and corner kick scenarios',
      descriptionAr: 'أتقن الركلات الحرة وسيناريوهات الركنيات',
      difficulty: 'advanced',
      duration: 20,
      category: 'set_pieces',
      isActive: true,
    },
    {
      title: 'Dribbling in Tight Spaces',
      titleAr: 'المراوغة في المساحات الضيقة',
      description: 'Improve close control and dribbling skills',
      descriptionAr: 'حسّن السيطرة القريبة ومهارات المراوغة',
      difficulty: 'beginner',
      duration: 12,
      category: 'dribbling',
      isActive: true,
    },
    {
      title: 'Tactical Awareness Training',
      titleAr: 'تدريب الوعي التكتيكي',
      description: 'Develop game reading and decision-making skills',
      descriptionAr: 'طور مهارات قراءة اللعب واتخاذ القرار',
      difficulty: 'advanced',
      duration: 25,
      category: 'tactics',
      isActive: true,
    },
    {
      title: 'Heading Technique',
      titleAr: 'تقنية ضرب الكرة بالرأس',
      description: 'Practice safe and effective heading techniques',
      descriptionAr: 'تدرب على تقنيات ضرب الكرة بالرأس الآمنة والفعالة',
      difficulty: 'beginner',
      duration: 10,
      category: 'shooting',
      isActive: true,
    },
  ];

  console.log('Inserting VR scenarios...');
  await db.insert(schema.vrTrainingScenarios).values(vrScenarios);
  console.log('✓ 10 VR scenarios created');

  console.log('Sample data seeding completed successfully!');
  await client.end();
}

seedSampleData().catch(console.error);
