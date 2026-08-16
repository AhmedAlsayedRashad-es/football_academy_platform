import { drizzle } from "drizzle-orm/mysql2";
import { homePageContent } from "../../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

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

    // Gallery Items
    console.log('🖼️ Adding Gallery Items...');
    
    const galleryItems = [
      {
        title: 'Team Photo - Academy Players',
        imageUrl: '/team-photo-1.jpg',
        metadata: { type: 'image', titleAr: 'صورة الفريق - لاعبو الأكاديمية' }
      },
      {
        title: 'Youth Squad',
        imageUrl: '/team-photo-2.jpg',
        metadata: { type: 'image', titleAr: 'فريق الشباب' }
      },
      {
        title: 'Training Day',
        imageUrl: '/team-photo-3.jpg',
        metadata: { type: 'image', titleAr: 'يوم التدريب' }
      },
      {
        title: 'Technical Drills',
        videoUrl: '/training-video-2.mp4',
        metadata: { type: 'video', titleAr: 'تمارين فنية' }
      },
      {
        title: 'Match Highlights',
        videoUrl: '/training-video-3.mp4',
        metadata: { type: 'video', titleAr: 'أبرز لحظات المباراة' }
      },
      {
        title: 'Skills Training',
        videoUrl: '/training-video-4.mp4',
        metadata: { type: 'video', titleAr: 'تدريب المهارات' }
      }
    ];

    for (let i = 0; i < galleryItems.length; i++) {
      await db.insert(homePageContent).values({
        sectionType: 'gallery',
        title: galleryItems[i].title,
        imageUrl: galleryItems[i].imageUrl,
        videoUrl: galleryItems[i].videoUrl,
        displayOrder: i + 1,
        isActive: true,
        metadata: JSON.stringify(galleryItems[i].metadata)
      });
    }

    // Testimonials
    console.log('💬 Adding Testimonials...');
    
    const testimonials = [
      {
        title: 'Mariam El-Sayed',
        subtitle: 'Mother of Omar, U-12',
        content: 'My son has been training with Future Stars FC for 8 months now. The coaches are incredibly dedicated and treat every child like their own. Omar\'s confidence on and off the pitch has grown tremendously.',
        metadata: {
          rating: 5,
          titleAr: 'مريم السيد',
          subtitleAr: 'والدة عمر، تحت 12',
          contentAr: 'ابني يتدرب مع فيوتشر ستارز منذ 8 أشهر. المدربون مخلصون بشكل لا يصدق ويعاملون كل طفل كأنه طفلهم. ثقة عمر داخل وخارج الملعب نمت بشكل هائل.'
        }
      },
      {
        title: 'Khaled Mahmoud',
        subtitle: 'Father of Youssef, U-10',
        content: 'What sets this academy apart is the genuine care for player development. The coaches focus on fundamentals and character building, not just winning. Youssef looks forward to every training session!',
        metadata: {
          rating: 5,
          titleAr: 'خالد محمود',
          subtitleAr: 'والد يوسف، تحت 10',
          contentAr: 'ما يميز هذه الأكاديمية هو الاهتمام الحقيقي بتطوير اللاعبين. المدربون يركزون على الأساسيات وبناء الشخصية، وليس فقط الفوز. يوسف يتطلع لكل جلسة تدريب!'
        }
      },
      {
        title: 'Fatma Abdel-Rahman',
        subtitle: 'Mother of Twins, U-8',
        content: 'Both my boys train here and I couldn\'t be happier. The facility is excellent, the schedule is convenient, and the communication with parents is outstanding. Highly recommend to any parent looking for quality football training.',
        metadata: {
          rating: 5,
          titleAr: 'فاطمة عبد الرحمن',
          subtitleAr: 'والدة التوأم، تحت 8',
          contentAr: 'كلا ولديّ يتدربان هنا ولا يمكنني أن أكون أسعد. المرفق ممتاز، الجدول مناسب، والتواصل مع أولياء الأمور رائع. أنصح بشدة أي ولي أمر يبحث عن تدريب كرة قدم عالي الجودة.'
        }
      }
    ];

    for (let i = 0; i < testimonials.length; i++) {
      await db.insert(homePageContent).values({
        sectionType: 'testimonials',
        title: testimonials[i].title,
        subtitle: testimonials[i].subtitle,
        content: testimonials[i].content,
        displayOrder: i + 1,
        isActive: true,
        metadata: JSON.stringify(testimonials[i].metadata)
      });
    }

    // Stats
    console.log('📊 Adding Stats...');
    
    const stats = [
      {
        title: '500+',
        content: 'Active Players',
        metadata: { contentAr: 'لاعب نشط' }
      },
      {
        title: '50+',
        content: 'Professional Coaches',
        metadata: { contentAr: 'مدرب محترف' }
      },
      {
        title: '95%',
        content: 'Parent Satisfaction',
        metadata: { contentAr: 'رضا أولياء الأمور' }
      },
      {
        title: '25+',
        content: 'Pro Graduates',
        metadata: { contentAr: 'خريج محترف' }
      }
    ];

    for (let i = 0; i < stats.length; i++) {
      await db.insert(homePageContent).values({
        sectionType: 'stats',
        title: stats[i].title,
        content: stats[i].content,
        displayOrder: i + 1,
        isActive: true,
        metadata: JSON.stringify(stats[i].metadata)
      });
    }

    console.log('✅ Home page content seeded successfully!');
    console.log(`   - 1 Hero Section`);
    console.log(`   - ${features.length} Features Cards`);
    console.log(`   - ${galleryItems.length} Gallery Items`);
    console.log(`   - ${testimonials.length} Testimonials`);
    console.log(`   - ${stats.length} Stats`);

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
