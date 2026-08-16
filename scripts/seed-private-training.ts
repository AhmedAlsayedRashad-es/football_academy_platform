import { getDb } from '../server/db';
import { users, coachProfiles, trainingLocations, coachScheduleSlots, coachReviews } from '../drizzle/schema';

async function seedPrivateTraining() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('🌱 Seeding private training data...');

  // 1. Create sample coach users
  const coachUsers = [
    {
      openId: 'coach-ahmed-001',
      name: 'Coach Ahmed Hassan',
      email: 'ahmed.hassan@futurefc.com',
      role: 'coach' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    {
      openId: 'coach-mohamed-002',
      name: 'Coach Mohamed Ali',
      email: 'mohamed.ali@futurefc.com',
      role: 'coach' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    },
    {
      openId: 'coach-omar-003',
      name: 'Coach Omar Khaled',
      email: 'omar.khaled@futurefc.com',
      role: 'coach' as const,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    },
  ];

  console.log('Creating coach users...');
  const insertedUsers = [];
  for (const user of coachUsers) {
    try {
      const [existing] = await db.select().from(users).where({ openId: user.openId } as any).limit(1);
      if (existing) {
        console.log(`  ✓ Coach ${user.name} already exists`);
        insertedUsers.push(existing);
      } else {
        const result = await db.insert(users).values(user);
        const [newUser] = await db.select().from(users).where({ openId: user.openId } as any).limit(1);
        console.log(`  ✓ Created coach ${user.name}`);
        insertedUsers.push(newUser);
      }
    } catch (e) {
      console.log(`  ⚠ Skipping ${user.name} (may already exist)`);
    }
  }

  // 2. Create coach profiles
  const coachProfilesData = [
    {
      title: 'Head Coach',
      specialization: 'technical' as const,
      qualifications: 'UEFA A License, AFC Pro Diploma',
      experience: '15 years of professional coaching experience. Former player for Al-Ahly youth academy.',
      yearsExperience: 15,
      bio: 'Specialized in developing young talent with focus on technical skills and ball control. Passionate about nurturing the next generation of Egyptian football stars.',
      achievements: JSON.stringify(['Egyptian Premier League Youth Champion 2020', 'Best Youth Coach Award 2019']),
      languages: JSON.stringify(['Arabic', 'English']),
      isPublic: true,
    },
    {
      title: 'Technical Coach',
      specialization: 'tactical' as const,
      qualifications: 'UEFA B License, Sports Science Degree',
      experience: '10 years coaching experience with focus on tactical awareness and game intelligence.',
      yearsExperience: 10,
      bio: 'Expert in tactical training and match analysis. Helps players understand positioning, movement, and decision-making on the field.',
      achievements: JSON.stringify(['Regional Championship Winner 2021', 'Youth Development Excellence Award']),
      languages: JSON.stringify(['Arabic', 'English', 'French']),
      isPublic: true,
    },
    {
      title: 'Fitness & Goalkeeping Coach',
      specialization: 'goalkeeping' as const,
      qualifications: 'AFC Goalkeeping License, Certified Fitness Trainer',
      experience: '8 years specializing in goalkeeper development and physical conditioning.',
      yearsExperience: 8,
      bio: 'Former professional goalkeeper with expertise in reflexes, positioning, and distribution. Also certified in youth fitness training.',
      achievements: JSON.stringify(['Trained 5 national youth team goalkeepers', 'Fitness Innovation Award 2022']),
      languages: JSON.stringify(['Arabic', 'English']),
      isPublic: true,
    },
  ];

  console.log('Creating coach profiles...');
  for (let i = 0; i < insertedUsers.length && i < coachProfilesData.length; i++) {
    const user = insertedUsers[i];
    const profile = coachProfilesData[i];
    try {
      await db.insert(coachProfiles).values({
        userId: user.id,
        ...profile,
      });
      console.log(`  ✓ Created profile for ${user.name}`);
    } catch (e) {
      console.log(`  ⚠ Profile for ${user.name} may already exist`);
    }
  }

  // 3. Create training locations
  const locations = [
    {
      name: 'Main Field',
      nameAr: 'الملعب الرئيسي',
      description: 'Full-size grass field with professional lighting',
      descriptionAr: 'ملعب عشبي كامل الحجم مع إضاءة احترافية',
      address: 'Future Stars FC Academy, New Cairo',
      capacity: 2,
      isActive: true,
    },
    {
      name: 'Indoor Court',
      nameAr: 'الملعب الداخلي',
      description: 'Climate-controlled indoor facility for all-weather training',
      descriptionAr: 'منشأة داخلية مكيفة للتدريب في جميع الأحوال الجوية',
      address: 'Future Stars FC Academy, New Cairo',
      capacity: 1,
      isActive: true,
    },
    {
      name: 'Training Pitch A',
      nameAr: 'ملعب التدريب أ',
      description: 'Smaller training pitch ideal for 1-on-1 sessions',
      descriptionAr: 'ملعب تدريب صغير مثالي للجلسات الفردية',
      address: 'Future Stars FC Academy, New Cairo',
      capacity: 3,
      isActive: true,
    },
    {
      name: 'Goalkeeper Training Area',
      nameAr: 'منطقة تدريب الحراس',
      description: 'Specialized area with goal and diving mats',
      descriptionAr: 'منطقة متخصصة مع مرمى وحصائر للغطس',
      address: 'Future Stars FC Academy, New Cairo',
      capacity: 2,
      isActive: true,
    },
  ];

  console.log('Creating training locations...');
  for (const location of locations) {
    try {
      await db.insert(trainingLocations).values(location);
      console.log(`  ✓ Created location: ${location.name}`);
    } catch (e) {
      console.log(`  ⚠ Location ${location.name} may already exist`);
    }
  }

  // 4. Create schedule slots for coaches
  const scheduleSlots = [
    // Coach 1 - Ahmed (weekdays mornings and evenings)
    { dayOfWeek: 0, startTime: '09:00', endTime: '10:00', pricePerSession: 500, isRecurring: true },
    { dayOfWeek: 0, startTime: '17:00', endTime: '18:00', pricePerSession: 500, isRecurring: true },
    { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', pricePerSession: 500, isRecurring: true },
    { dayOfWeek: 1, startTime: '17:00', endTime: '18:00', pricePerSession: 500, isRecurring: true },
    { dayOfWeek: 3, startTime: '09:00', endTime: '10:00', pricePerSession: 500, isRecurring: true },
    { dayOfWeek: 3, startTime: '17:00', endTime: '18:00', pricePerSession: 500, isRecurring: true },
    { dayOfWeek: 5, startTime: '10:00', endTime: '11:00', pricePerSession: 600, isRecurring: true },
  ];

  const scheduleSlots2 = [
    // Coach 2 - Mohamed (afternoons)
    { dayOfWeek: 1, startTime: '14:00', endTime: '15:00', pricePerSession: 450, isRecurring: true },
    { dayOfWeek: 2, startTime: '14:00', endTime: '15:00', pricePerSession: 450, isRecurring: true },
    { dayOfWeek: 2, startTime: '16:00', endTime: '17:00', pricePerSession: 450, isRecurring: true },
    { dayOfWeek: 4, startTime: '14:00', endTime: '15:00', pricePerSession: 450, isRecurring: true },
    { dayOfWeek: 4, startTime: '16:00', endTime: '17:00', pricePerSession: 450, isRecurring: true },
    { dayOfWeek: 6, startTime: '11:00', endTime: '12:00', pricePerSession: 550, isRecurring: true },
  ];

  const scheduleSlots3 = [
    // Coach 3 - Omar (mornings and weekends)
    { dayOfWeek: 0, startTime: '08:00', endTime: '09:00', pricePerSession: 400, isRecurring: true },
    { dayOfWeek: 2, startTime: '08:00', endTime: '09:00', pricePerSession: 400, isRecurring: true },
    { dayOfWeek: 4, startTime: '08:00', endTime: '09:00', pricePerSession: 400, isRecurring: true },
    { dayOfWeek: 5, startTime: '09:00', endTime: '10:00', pricePerSession: 500, isRecurring: true },
    { dayOfWeek: 5, startTime: '11:00', endTime: '12:00', pricePerSession: 500, isRecurring: true },
    { dayOfWeek: 6, startTime: '09:00', endTime: '10:00', pricePerSession: 500, isRecurring: true },
  ];

  console.log('Creating schedule slots...');
  const allSlots = [
    { userId: insertedUsers[0]?.id, slots: scheduleSlots },
    { userId: insertedUsers[1]?.id, slots: scheduleSlots2 },
    { userId: insertedUsers[2]?.id, slots: scheduleSlots3 },
  ];

  for (const { userId, slots } of allSlots) {
    if (!userId) continue;
    for (const slot of slots) {
      try {
        await db.insert(coachScheduleSlots).values({
          coachId: userId,
          locationId: 1, // Main Field
          ...slot,
          isAvailable: true,
        });
      } catch (e) {
        // Slot may already exist
      }
    }
    console.log(`  ✓ Created ${slots.length} slots for coach ID ${userId}`);
  }

  // 5. Create sample reviews
  const sampleReviews = [
    { rating: 5, comment: 'Excellent coach! My son improved significantly after just a few sessions.' },
    { rating: 5, comment: 'Very professional and patient with the kids. Highly recommended!' },
    { rating: 4, comment: 'Great technical training. My daughter loves the sessions.' },
    { rating: 5, comment: 'Best private training experience. Coach is very dedicated.' },
    { rating: 4, comment: 'Good communication and flexible scheduling.' },
  ];

  console.log('Creating sample reviews...');
  for (let i = 0; i < insertedUsers.length; i++) {
    const coachId = insertedUsers[i]?.id;
    if (!coachId) continue;
    
    // Add 2-3 reviews per coach
    const reviewCount = 2 + (i % 2);
    for (let j = 0; j < reviewCount; j++) {
      const review = sampleReviews[(i + j) % sampleReviews.length];
      try {
        await db.insert(coachReviews).values({
          coachId,
          reviewerId: 1, // System/demo reviewer
          rating: review.rating,
          comment: review.comment,
        });
      } catch (e) {
        // Review may already exist
      }
    }
    console.log(`  ✓ Created ${reviewCount} reviews for coach ID ${coachId}`);
  }

  console.log('✅ Private training data seeded successfully!');
  process.exit(0);
}

seedPrivateTraining().catch((e) => {
  console.error('Error seeding data:', e);
  process.exit(1);
});
