import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🌱 Seeding home page content...');

// Clear existing content
await db.delete(schema.homePageContent);

// Hero Section
await db.insert(schema.homePageContent).values({
  sectionType: 'hero',
  title: 'Future Stars Football Academy',
  titleAr: 'أكاديمية نجوم المستقبل لكرة القدم',
  subtitle: 'Developing young talent through professional training and advanced technology',
  subtitleAr: 'تطوير المواهب الشابة من خلال التدريب الاحترافي والتكنولوجيا المتقدمة',
  content: 'Join Egypt\'s leading football academy and unlock your potential',
  contentAr: 'انضم إلى أكاديمية كرة القدم الرائدة في مصر وأطلق العنان لإمكانياتك',
  ctaText: 'Get Started',
  ctaTextAr: 'ابدأ الآن',
  ctaLink: '#enrollment',
  mediaUrl: '/nano-hero-simple.png',
  displayOrder: 1,
  isActive: true
});

// Features
const features = [
  {
    icon: 'Brain',
    title: 'AI-Powered Training',
    titleAr: 'تدريب مدعوم بالذكاء الاصطناعي',
    content: 'Advanced analytics and personalized training plans powered by artificial intelligence',
    contentAr: 'تحليلات متقدمة وخطط تدريب مخصصة مدعومة بالذكاء الاصطناعي'
  },
  {
    icon: 'Users',
    title: 'Expert Coaches',
    titleAr: 'مدربون خبراء',
    content: 'Learn from UEFA-certified coaches with professional playing experience',
    contentAr: 'تعلم من مدربين معتمدين من UEFA مع خبرة لعب احترافية'
  },
  {
    icon: 'BarChart3',
    title: 'Performance Analytics',
    titleAr: 'تحليلات الأداء',
    content: 'Track your progress with detailed performance metrics and video analysis',
    contentAr: 'تتبع تقدمك من خلال مقاييس أداء مفصلة وتحليل الفيديو'
  },
  {
    icon: 'Trophy',
    title: 'Competitive Opportunities',
    titleAr: 'فرص تنافسية',
    content: 'Participate in local and international tournaments',
    contentAr: 'شارك في البطولات المحلية والدولية'
  },
  {
    icon: 'Target',
    title: 'Holistic Development',
    titleAr: 'تطوير شامل',
    content: 'Focus on technical, physical, tactical, and mental aspects of the game',
    contentAr: 'التركيز على الجوانب الفنية والبدنية والتكتيكية والعقلية للعبة'
  },
  {
    icon: 'Star',
    title: 'Flexible Schedules',
    titleAr: 'جداول مرنة',
    content: 'Training sessions designed to fit your academic and personal commitments',
    contentAr: 'جلسات تدريبية مصممة لتناسب التزاماتك الأكاديمية والشخصية'
  }
];

for (let i = 0; i < features.length; i++) {
  await db.insert(schema.homePageContent).values({
    sectionType: 'features',
    title: features[i].title,
    titleAr: features[i].titleAr,
    content: features[i].content,
    contentAr: features[i].contentAr,
    metadata: JSON.stringify({ icon: features[i].icon }),
    displayOrder: i + 1,
    isActive: true
  });
}

// Stats
const stats = [
  { value: '500+', label: 'Active Players', labelAr: 'لاعب نشط' },
  { value: '50+', label: 'Professional Coaches', labelAr: 'مدرب محترف' },
  { value: '95%', label: 'Parent Satisfaction', labelAr: 'رضا الأهل' },
  { value: '25+', label: 'Professional Graduates', labelAr: 'خريج محترف' }
];

for (let i = 0; i < stats.length; i++) {
  await db.insert(schema.homePageContent).values({
    sectionType: 'stats',
    title: stats[i].value,
    subtitle: stats[i].label,
    subtitleAr: stats[i].labelAr,
    displayOrder: i + 1,
    isActive: true
  });
}

// Gallery
const galleryItems = [
  { type: 'image', url: '/media/team/b77066c1-11b8-4798-acb0-ae5d3b971ce0.jpg', caption: 'Team Training', captionAr: 'تدريب الفريق' },
  { type: 'image', url: '/media/team/5980967093731969141(1).jpg', caption: 'Match Day', captionAr: 'يوم المباراة' },
  { type: 'video', url: '/media/training/WhatsAppVideo2025-10-10at3.26.20PM.mp4', caption: 'Skills Training', captionAr: 'تدريب المهارات' },
  { type: 'video', url: '/media/training/1-video5791879702075415019.mp4', caption: 'Tactical Drills', captionAr: 'تدريبات تكتيكية' }
];

for (let i = 0; i < galleryItems.length; i++) {
  await db.insert(schema.homePageContent).values({
    sectionType: 'gallery',
    mediaUrl: galleryItems[i].url,
    subtitle: galleryItems[i].caption,
    subtitleAr: galleryItems[i].captionAr,
    metadata: JSON.stringify({ type: galleryItems[i].type }),
    displayOrder: i + 1,
    isActive: true
  });
}

// Testimonials
const testimonials = [
  {
    name: 'Ahmed Hassan',
    nameAr: 'أحمد حسن',
    role: 'Parent',
    roleAr: 'ولي أمر',
    content: 'My son has improved tremendously since joining Future Stars. The coaches are professional and caring.',
    contentAr: 'تحسن ابني بشكل كبير منذ انضمامه إلى نجوم المستقبل. المدربون محترفون ومهتمون.',
    rating: 5
  },
  {
    name: 'Sara Mohamed',
    nameAr: 'سارة محمد',
    role: 'Parent',
    roleAr: 'ولي أمر',
    content: 'Excellent facilities and training programs. My daughter loves coming to practice every week!',
    contentAr: 'مرافق وبرامج تدريبية ممتازة. ابنتي تحب القدوم للتدريب كل أسبوع!',
    rating: 5
  },
  {
    name: 'Karim Ali',
    nameAr: 'كريم علي',
    role: 'Player (U16)',
    roleAr: 'لاعب (تحت 16)',
    content: 'The AI-powered training analysis has helped me understand my strengths and weaknesses better.',
    contentAr: 'ساعدني تحليل التدريب المدعوم بالذكاء الاصطناعي على فهم نقاط قوتي وضعفي بشكل أفضل.',
    rating: 5
  }
];

for (let i = 0; i < testimonials.length; i++) {
  await db.insert(schema.homePageContent).values({
    sectionType: 'testimonials',
    title: testimonials[i].name,
    titleAr: testimonials[i].nameAr,
    subtitle: testimonials[i].role,
    subtitleAr: testimonials[i].roleAr,
    content: testimonials[i].content,
    contentAr: testimonials[i].contentAr,
    metadata: JSON.stringify({ rating: testimonials[i].rating }),
    displayOrder: i + 1,
    isActive: true
  });
}

console.log('✅ Home page content seeded successfully!');
process.exit(0);
