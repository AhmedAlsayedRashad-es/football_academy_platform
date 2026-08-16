import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(DB_URL);

const coaches = [
  {
    name: 'Hassan El-Shazly',
    nationality: 'Egyptian',
    age: 45,
    email: 'hassan.elshazly@alahly-academy.com',
    phone: '+20 100 123 4567',
    title: 'Head Coach – U21',
    years_experience: 15,
    preferred_formation: '4-3-3',
    playing_styles: JSON.stringify(['High Press', 'Possession-Based', 'Vertical Play', 'Counter-Press']),
    coaching_strengths: JSON.stringify(['Youth Development', 'Attacking Play', 'Set Pieces', 'Player Motivation']),
    required_player_skills: JSON.stringify(['Speed', 'Dribbling', 'Pressing', 'Quick Passing']),
    certifications: JSON.stringify(['UEFA A License', 'CAF A License']),
    languages: JSON.stringify(['Arabic', 'English']),
    bio: 'Former Al Ahly midfielder turned elite youth coach. Specializes in high-intensity pressing systems that develop technically gifted young players.',
    achievements: JSON.stringify(['CAF Youth Championship 2021', 'Egyptian Youth League 2022', 'Best Youth Coach Award 2023']),
    availability: 'available',
    contract_status: 'free',
    expected_salary: '$4,500/month',
    rating: 9.2,
  },
  {
    name: 'Mohamed Abdel-Aziz',
    nationality: 'Egyptian',
    age: 42,
    email: 'mabdelaziz@coach.eg',
    phone: '+20 101 234 5678',
    title: 'Defensive Specialist Coach',
    years_experience: 12,
    preferred_formation: '4-2-3-1',
    playing_styles: JSON.stringify(['Defensive Solidity', 'Counter Attack', 'Wing Play', 'Set Piece Specialist']),
    coaching_strengths: JSON.stringify(['Defending', 'Set Pieces', 'Tactical Flexibility', 'Physical Intensity']),
    required_player_skills: JSON.stringify(['Aerial Ability', 'Defensive Positioning', 'Physical Strength']),
    certifications: JSON.stringify(['UEFA B License', 'CAF A License']),
    languages: JSON.stringify(['Arabic', 'French']),
    bio: 'Defensive specialist with a track record of building organized, hard-to-beat teams. Known for transforming defensive records.',
    achievements: JSON.stringify(['Egyptian Premier League 2020', 'CAF Champions League Runner-Up 2021', 'Best Defense Award 3 seasons']),
    availability: 'available',
    contract_status: 'free',
    expected_salary: '$3,800/month',
    rating: 8.6,
  },
  {
    name: 'Carlos Mendez',
    nationality: 'Spanish',
    age: 48,
    email: 'carlos.mendez@coachspain.com',
    phone: '+34 600 123 456',
    title: 'Technical Director & Head Coach',
    years_experience: 18,
    preferred_formation: '4-3-3',
    playing_styles: JSON.stringify(['Tiki-Taka', 'Possession-Based', 'High Press', 'Technical Football']),
    coaching_strengths: JSON.stringify(['Technical Writing', 'Player Development', 'Tactical Flexibility', 'Video Analysis']),
    required_player_skills: JSON.stringify(['Technical Ability', 'Passing Accuracy', 'Spatial Awareness', 'First Touch']),
    certifications: JSON.stringify(['UEFA Pro License', 'FIFA Coaching Certificate']),
    languages: JSON.stringify(['Spanish', 'English', 'Arabic']),
    bio: 'La Liga academy graduate coach who brings Spanish football philosophy to African talent. Expert in developing technically superior midfielders.',
    achievements: JSON.stringify(['La Liga B Division 2018', 'UEFA Youth League Finalist 2019', 'Best Technical Coach Award 2022']),
    availability: 'negotiating',
    contract_status: 'notice_period',
    expected_salary: '$7,500/month',
    rating: 9.4,
  },
  {
    name: 'Ibrahim Fathy',
    nationality: 'Egyptian',
    age: 38,
    email: 'ibrahim.fathy@coach.eg',
    phone: '+20 102 345 6789',
    title: 'Fitness & Tactical Coach',
    years_experience: 10,
    preferred_formation: '3-5-2',
    playing_styles: JSON.stringify(['Physical Intensity', 'Direct Play', 'Wing Play', 'Set Piece Specialist']),
    coaching_strengths: JSON.stringify(['Fitness & Conditioning', 'Set Pieces', 'Team Building', 'Motivation']),
    required_player_skills: JSON.stringify(['Physical Strength', 'Aerial Ability', 'Stamina']),
    certifications: JSON.stringify(['CAF B License', 'Sports Science Degree']),
    languages: JSON.stringify(['Arabic', 'English']),
    bio: 'Former professional defender who coaches with intensity and discipline. Builds physically dominant teams with strong aerial presence.',
    achievements: JSON.stringify(['Egyptian Cup 2019', 'CAF Confederation Cup 2020', 'Best Defensive Record 2021']),
    availability: 'available',
    contract_status: 'free',
    expected_salary: '$3,200/month',
    rating: 8.2,
  },
  {
    name: 'Thierry Dubois',
    nationality: 'French',
    age: 52,
    email: 'thierry.dubois@coachfrance.fr',
    phone: '+33 6 12 34 56 78',
    title: 'Elite Performance Coach',
    years_experience: 20,
    preferred_formation: '4-3-3',
    playing_styles: JSON.stringify(['Gegenpressing', 'Counter Attack', 'High Press', 'Technical Football']),
    coaching_strengths: JSON.stringify(['Tactical Flexibility', 'Physical Intensity', 'Youth Development', 'Video Analysis']),
    required_player_skills: JSON.stringify(['Speed', 'Stamina', 'Pressing Intensity', 'Quick Decision Making']),
    certifications: JSON.stringify(['UEFA Pro License', 'UEFA A License']),
    languages: JSON.stringify(['French', 'English', 'Spanish']),
    bio: 'French Ligue 1 coach with Bundesliga experience. Brings modern gegenpressing philosophy with emphasis on athleticism and rapid transitions.',
    achievements: JSON.stringify(['Ligue 1 Title 2017', 'Bundesliga Promotion 2019', 'UEFA Youth League 2021']),
    availability: 'available',
    contract_status: 'free',
    expected_salary: '$9,000/month',
    rating: 9.6,
  },
  {
    name: 'Ahmed Samy',
    nationality: 'Egyptian',
    age: 40,
    email: 'ahmed.samy@alahly.com',
    phone: '+20 103 456 7890',
    title: 'Youth Academy Director',
    years_experience: 14,
    preferred_formation: '4-2-3-1',
    playing_styles: JSON.stringify(['Youth Development', 'Technical Football', 'Possession-Based', 'High Press']),
    coaching_strengths: JSON.stringify(['Youth Management', 'Player Development', 'Recruitment', 'Mental Coaching']),
    required_player_skills: JSON.stringify(['Technical Ability', 'Creative Midfield', 'Passing Accuracy']),
    certifications: JSON.stringify(['CAF A License', 'UEFA B License', 'Sports Science Degree']),
    languages: JSON.stringify(['Arabic', 'English', 'French']),
    bio: 'Dedicated youth developer who has produced 12 professional players in the last 5 years. Passionate about holistic player development.',
    achievements: JSON.stringify(['Produced 12 Pro Players 2018-2023', 'Best Academy Director CAF 2022', 'Egyptian Youth Cup 2023']),
    availability: 'available',
    contract_status: 'contracted',
    expected_salary: '$5,000/month',
    rating: 9.0,
  },
  {
    name: 'Marcelo Rossi',
    nationality: 'Brazilian',
    age: 46,
    email: 'marcelo.rossi@coachbrazil.com',
    phone: '+55 11 9 1234 5678',
    title: 'Attacking Football Specialist',
    years_experience: 16,
    preferred_formation: '4-3-3',
    playing_styles: JSON.stringify(['Wing Play', 'Technical Football', 'Counter Attack', 'Possession-Based']),
    coaching_strengths: JSON.stringify(['Attacking', 'Player Development', 'Team Building', 'Motivation']),
    required_player_skills: JSON.stringify(['Dribbling', 'Speed', 'Creative Midfield', 'Technical Ability']),
    certifications: JSON.stringify(['CBF Pro License', 'FIFA Coaching Certificate']),
    languages: JSON.stringify(['Portuguese', 'Spanish', 'English']),
    bio: 'Brazilian football philosophy expert with experience across South America and Africa. Known for developing creative, attacking-minded players.',
    achievements: JSON.stringify(['Brazilian Serie B 2016', 'Copa Sudamericana Semifinal 2018', 'Best Attacking Coach 2020']),
    availability: 'negotiating',
    contract_status: 'notice_period',
    expected_salary: '$6,500/month',
    rating: 8.8,
  },
  {
    name: 'Khaled Mansour',
    nationality: 'Egyptian',
    age: 35,
    email: 'khaled.mansour@coach.eg',
    phone: '+20 104 567 8901',
    title: 'Assistant Coach & Video Analyst',
    years_experience: 8,
    preferred_formation: '4-4-2',
    playing_styles: JSON.stringify(['Defensive Solidity', 'Set Piece Specialist', 'Counter Attack', 'Low Block']),
    coaching_strengths: JSON.stringify(['Video Analysis', 'Set Pieces', 'Defending', 'Tactical Flexibility']),
    required_player_skills: JSON.stringify(['Defensive Positioning', 'Physical Strength', 'Aerial Ability']),
    certifications: JSON.stringify(['CAF B License', 'Physical Education Degree']),
    languages: JSON.stringify(['Arabic', 'English']),
    bio: 'Young and ambitious coach with a strong background in video analysis and set-piece design. Brings modern analytical approach to coaching.',
    achievements: JSON.stringify(['Egyptian U17 National Team Assistant 2021', 'Set Piece Specialist Award 2022']),
    availability: 'available',
    contract_status: 'free',
    expected_salary: '$2,500/month',
    rating: 7.8,
  },
];

console.log('Seeding coach candidates...');
let inserted = 0;
for (const coach of coaches) {
  try {
    const [existing] = await conn.execute('SELECT id FROM coach_candidates WHERE name = ?', [coach.name]);
    if (existing.length > 0) {
      console.log(`  Skipping ${coach.name} (already exists)`);
      continue;
    }
    await conn.execute(`
      INSERT INTO coach_candidates (
        name, nationality, age, email, phone, title, years_experience,
        preferred_formation, playing_styles, coaching_strengths, required_player_skills,
        certifications, languages, bio, achievements, availability, contract_status,
        expected_salary, rating, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [
      coach.name, coach.nationality, coach.age, coach.email, coach.phone,
      coach.title, coach.years_experience, coach.preferred_formation,
      coach.playing_styles, coach.coaching_strengths, coach.required_player_skills,
      coach.certifications, coach.languages, coach.bio, coach.achievements,
      coach.availability, coach.contract_status, coach.expected_salary, coach.rating
    ]);
    console.log(`  ✓ Added: ${coach.name}`);
    inserted++;
  } catch (err) {
    console.error(`  ✗ Error adding ${coach.name}:`, err.message);
  }
}

console.log(`\n✅ Done! Inserted ${inserted} coach candidates.`);
await conn.end();
