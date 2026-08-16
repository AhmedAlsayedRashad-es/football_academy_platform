// Shared Skills Library video data — used by SkillsLibrary page and Digital Locker Room video picker

export interface SkillVideo {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "pro";
  duration: number;
  videoId: string; // YouTube video ID
}

export const SKILLS_VIDEOS: SkillVideo[] = [
  {
    id: "pass-1", title: "Passing Drills — Speed & Accuracy", titleAr: "تمارين التمرير — السرعة والدقة",
    category: "passing", difficulty: "beginner", duration: 15, videoId: "-V88Iy1X-is"
  },
  {
    id: "pass-2", title: "Passing & 1st Touch Combinations", titleAr: "تمريرات وتوليفات اللمسة الأولى",
    category: "passing", difficulty: "intermediate", duration: 20, videoId: "-F6OecCUHLA"
  },
  {
    id: "pass-3", title: "Tight Space Passing Drills", titleAr: "تمارين التمرير في المساحات الضيقة",
    category: "passing", difficulty: "advanced", duration: 15, videoId: "9aHmBjWdRIk"
  },
  {
    id: "drib-1", title: "5 Essential Dribbling Drills", titleAr: "5 تمارين مراوغة أساسية",
    category: "dribbling", difficulty: "beginner", duration: 15, videoId: "feA7KafbwdQ"
  },
  {
    id: "drib-2", title: "1v1 Attacking Moves & Feints", titleAr: "حركات هجومية وخدع 1 ضد 1",
    category: "dribbling", difficulty: "intermediate", duration: 20, videoId: "jwIHc9rz7yo"
  },
  {
    id: "drib-3", title: "Close Control Dribbling Mastery", titleAr: "إتقان المراوغة بتحكم قريب",
    category: "dribbling", difficulty: "advanced", duration: 20, videoId: "Hs4ByFF_AE0"
  },
  {
    id: "shoot-1", title: "How to Shoot a Football — Full Tutorial", titleAr: "كيفية التسديد في كرة القدم — دليل كامل",
    category: "shooting", difficulty: "beginner", duration: 20, videoId: "bHGW2apqfEE"
  },
  {
    id: "shoot-2", title: "Striking the Ball — Step by Step", titleAr: "ضرب الكرة — خطوة بخطوة",
    category: "shooting", difficulty: "intermediate", duration: 15, videoId: "QDb5-cMIbjM"
  },
  {
    id: "touch-1", title: "5 First Touch Exercises", titleAr: "5 تمارين اللمسة الأولى",
    category: "first-touch", difficulty: "beginner", duration: 15, videoId: "el7QvVnprOk"
  },
  {
    id: "def-1", title: "How to Defend in Soccer — 3 Drills", titleAr: "كيفية الدفاع في كرة القدم — 3 تمارين",
    category: "defending", difficulty: "beginner", duration: 20, videoId: "LR9ifmPXGhI"
  },
  {
    id: "def-2", title: "High Pressing & Defensive Attributes", titleAr: "الضغط العالي والصفات الدفاعية",
    category: "defending", difficulty: "advanced", duration: 25, videoId: "uBlSzlbvsvo"
  },
  {
    id: "gk-1", title: "Goalkeeper Speed & Reaction Drills", titleAr: "تمارين سرعة وردود فعل الحارس",
    category: "goalkeeping", difficulty: "intermediate", duration: 30, videoId: "TviVDUBTQVU"
  },
  {
    id: "tact-1", title: "Positional Play Principles", titleAr: "مبادئ اللعب الموضعي",
    category: "tactical", difficulty: "advanced", duration: 30, videoId: "uBlSzlbvsvo"
  },
  {
    id: "phys-1", title: "Agility Ladder & Speed Work", titleAr: "سلم الرشاقة وتمارين السرعة",
    category: "physical", difficulty: "beginner", duration: 15, videoId: "jwIHc9rz7yo"
  },
];

export const SKILL_CATEGORIES = [
  { id: "all", label: "All", labelAr: "الكل" },
  { id: "passing", label: "Passing", labelAr: "التمرير" },
  { id: "dribbling", label: "Dribbling", labelAr: "المراوغة" },
  { id: "shooting", label: "Shooting", labelAr: "التسديد" },
  { id: "first-touch", label: "First Touch", labelAr: "اللمسة الأولى" },
  { id: "defending", label: "Defending", labelAr: "الدفاع" },
  { id: "goalkeeping", label: "Goalkeeping", labelAr: "حراسة المرمى" },
  { id: "tactical", label: "Tactical", labelAr: "تكتيكي" },
  { id: "physical", label: "Physical", labelAr: "بدني" },
];

export const DIFF_BADGE: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-400",
  intermediate: "bg-yellow-500/20 text-yellow-400",
  advanced: "bg-orange-500/20 text-orange-400",
  pro: "bg-red-500/20 text-red-400",
};
