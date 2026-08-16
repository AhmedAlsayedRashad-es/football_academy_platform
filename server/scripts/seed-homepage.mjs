import { drizzle } from "drizzle-orm/mysql2";
import { homePageContent } from "../../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seedHomePageContent() {
  console.log('🚀 Starting home page content seeding...');

  try {
    // Hero Section
    console.log('📝 Adding Hero Section...');
    await db.insert(homePageContent).values({
      sectionType: 'hero',
      title: 'Develop Future Football Stars',
      subtitle: 'Egypt\'s Premier Youth Football Academy',
      content: 'A technology-driven academy combining elite coaching, sports science, mental wellness, and nutrition to develop complete athletes.',
      ctaText: 'Register Now',
      ctaLink: '/register',
      videoUrl: '/media/hero-video.mp4',
      displayOrder: 1,
      isActive: true,
      metadata: JSON.stringify({
        titleAr: 'طور نجوم كرة القدم المستقبليين',
        subtitleAr: 'أكاديمية كرة القدم الشبابية الرائدة في مصر',
        contentAr: 'أكاديمية تعتمد على التكنولوجيا تجمع بين التدريب النخبوي وعلوم الرياضة والصحة النفسية والتغذية لتطوير رياضيين متكاملين.',
        ctaTextAr: 'سجل الآن'
      })
    });

    // Features Cards
    console.log('⚡ Adding Features Cards...');
    
    const features = [
      {
        title: 'Performance Analytics',
        content: 'Track technical, physical, and tactical metrics with AI-powered insights',
        imageUrl: '/icons/analytics.svg',
        metadata: {
          titleAr: 'تحليلات الأداء',
          contentAr: 'تتبع المقاييس الفنية والبدنية والتكتيكية برؤى مدعومة بالذكاء الاصطناعي',
          icon: 'BarChart3'
        }
      },
      {
        title: 'Mental Coaching',
        content: 'Professional psychological support for confidence and resilience building',
        imageUrl: '/icons/mental.svg',
        metadata: {
          titleAr: 'التدريب النفسي',
          contentAr: 'دعم نفسي احترافي لبناء الثقة والمرونة',
          icon: 'Brain'
        }
      },
      {
        title: 'Physical Training',
        content: 'Customized workout plans with injury prevention and recovery protocols',
        imageUrl: '/icons/physical.svg',
        metadata: {
          titleAr: 'التدريب البدني',
          contentAr: 'خطط تمرين مخصصة مع بروتوكولات الوقاية من الإصابات والتعافي',
          icon: 'Dumbbell'
        }
      },
      {
        title: 'Nutrition Planning',
        content: 'Personalized meal plans optimized for peak athletic performance',
        imageUrl: '/icons/nutrition.svg',
        metadata: {
          titleAr: 'التخطيط الغذائي',
          contentAr: 'خطط وجبات مخصصة محسّنة لذروة الأداء الرياضي',
          icon: 'Apple'
        }
      },
      {
        title: 'Video Analysis',
        content: 'Advanced video review with AI-powered action tagging and highlights',
        imageUrl: '/icons/video.svg',
        metadata: {
          titleAr: 'تحليل الفيديو',
          contentAr: 'مراجعة فيديو متقدمة مع وسم الإجراءات والمقاطع البارزة بالذكاء الاصطناعي',
          icon: 'Video'
        }
      },
      {
        title: 'GPS Tracking',
        content: 'Integration with wearable devices for real-time performance data',
        imageUrl: '/icons/gps.svg',
        metadata: {
          titleAr: 'تتبع GPS',
          contentAr: 'التكامل مع الأجهزة القابلة للارتداء لبيانات الأداء في الوقت الفعلي',
          icon: 'MapPin'
        }
      }
    ];

    for (let i = 0; i < features.length; i++) {
      await db.insert(homePageContent).values({
        sectionType: 'features',
        title: features[i].title,
        content: features[i].content,
        imageUrl: features[i].imageUrl,
        displayOrder: i + 1,
        isActive: true,
        metadata: JSON.stringify(features[i].metadata)
      });
    }

    console.log('✅ Home page content seeded successfully!');
    console.log(`   - 1 Hero Section`);
    console.log(`   - ${features.length} Features Cards`);

  } catch (error) {
    console.error('❌ Error seeding home page content:', error);
    throw error;
  }
}

seedHomePageContent()
  .then(() => {
    console.log('🎉 Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
