import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

// Maps route path prefixes to { en, ar } titles
const PAGE_TITLES: Record<string, { en: string; ar: string }> = {
  "/": { en: "Future Stars Academy", ar: "أكاديمية فيوتشر ستارز" },
  "/dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "/coach-dashboard": { en: "Coach Dashboard", ar: "لوحة المدرب" },
  "/team-dashboard": { en: "Team Dashboard", ar: "لوحة الفريق" },
  "/performance-dashboard": { en: "Performance Dashboard", ar: "لوحة الأداء" },
  "/features-hub": { en: "Features Hub", ar: "مركز الميزات المتقدمة" },
  "/scout-network": { en: "Scout Network", ar: "شبكة الكشافة الذكية" },
  "/players": { en: "Players", ar: "اللاعبون" },
  "/player/": { en: "Player Profile", ar: "ملف اللاعب" },
  "/analytics": { en: "Analytics", ar: "التحليلات" },
  "/matches": { en: "Match Management", ar: "إدارة المباريات" },
  "/team-schedule": { en: "Match Schedule", ar: "تقويم المباريات" },
  "/coach/live-match": { en: "Live Match Mode", ar: "وضع المباراة المباشرة" },
  "/multi-match-comparison": { en: "Multi-Match Comparison", ar: "مقارنة المباريات" },
  "/match-event-recording": { en: "Record Match Events", ar: "تسجيل أحداث المباراة" },
  "/league": { en: "League Fixtures", ar: "جدول الدوري" },
  "/coach-performance": { en: "Coach Performance", ar: "تقييم أداء المدربين" },
  "/professional-tactical-board": { en: "Tactical Board", ar: "اللوحة التكتيكية" },
  "/animated-tactical-board": { en: "Animated Tactics", ar: "التكتيكات المتحركة" },
  "/formation-builder": { en: "Formation Builder", ar: "منشئ التشكيلات" },
  "/set-piece-designer": { en: "Set Piece Designer", ar: "مصمم الأوضاع الثابتة" },
  "/set-piece-simulation": { en: "Set Piece Simulation", ar: "محاكاة الأوضاع الثابتة" },
  "/tactical-simulation": { en: "Tactical Simulation", ar: "المحاكاة التكتيكية" },
  "/advanced-tactical-hub": { en: "Advanced Tactical Hub", ar: "المركز التكتيكي المتقدم" },
  "/videos": { en: "Video Library", ar: "مكتبة الفيديو" },
  "/video-clip-library": { en: "Video Clips", ar: "مقاطع الفيديو" },
  "/ai-video-recommendations": { en: "AI Video Recommendations", ar: "توصيات الفيديو الذكية" },
  "/coach/ai-video-analysis": { en: "AI Video Analysis", ar: "تحليل الفيديو الذكي" },
  "/coach/voice-coach": { en: "AI Voice Coach", ar: "المدرب الصوتي الذكي" },
  "/video-analysis-player": { en: "AI Video Analysis (Player)", ar: "تحليل الفيديو الذكي (لاعب)" },
  "/match-video-detection": { en: "Match Player Detection", ar: "رصد لاعبي المباراة" },
  "/match-video-tagger": { en: "Video Tagging & Timeline", ar: "وسم الفيديو والجدول الزمني" },
  "/video-telestration": { en: "Tactical Annotator", ar: "المحلل التكتيكي (رسم المدرب)" },
  "/professional-heatmap": { en: "Heatmap Analysis", ar: "تحليل خريطة الحرارة" },
  "/pass-network": { en: "Pass Network", ar: "شبكة التمريرات" },
  "/ai-coach": { en: "AI Coach Assistant", ar: "مساعد المدرب الذكي" },
  "/coach/ai-assistant": { en: "AI Coach (Enhanced)", ar: "مساعد المدرب الذكي المتقدم" },
  "/ai-match-coach": { en: "AI Match Coach", ar: "مدرب المباراة الذكي" },
  "/ai-emergency-mode": { en: "AI Emergency Mode", ar: "وضع الطوارئ الذكي" },
  "/coach/ai-calendar": { en: "AI Smart Calendar", ar: "التقويم الذكي" },
  "/ai-formation-recommendation": { en: "AI Formation Advisor", ar: "مستشار التشكيلة الذكي" },
  "/ai-formation-simulation": { en: "AI Formation Simulation", ar: "محاكاة التشكيلة الذكية" },
  "/ai-tactical-planner": { en: "AI Tactical Planner", ar: "المخطط التكتيكي الذكي" },
  "/player-development-ai": { en: "Player Development AI", ar: "تطوير اللاعب الذكي" },
  "/player-scouting-report": { en: "AI Scouting Report", ar: "تقرير الاستكشاف الذكي" },
  "/coach-selection-ai": { en: "Coach Selection AI", ar: "اختيار المدرب بالذكاء الاصطناعي" },
  "/nutrition-ai": { en: "AI Nutrition", ar: "التغذية الذكية" },
  "/injury-prevention": { en: "Injury Prevention AI", ar: "الوقاية من الإصابات الذكية" },
  "/ai-report-generator": { en: "AI Report Generator", ar: "مولد التقارير الذكي" },
  "/training": { en: "Training", ar: "التدريب" },
  "/training-library": { en: "Training Library", ar: "مكتبة التدريب" },
  "/private-training": { en: "Private Training", ar: "التدريب الخاص" },
  "/my-bookings": { en: "My Bookings", ar: "حجوزاتي" },
  "/coach-availability": { en: "Availability", ar: "جدول التوفر" },
  "/talent-portal": { en: "Talent Portal", ar: "بوابة المواهب والكشافة" },
  "/nutrition": { en: "Nutrition", ar: "التغذية" },
  "/nutrition-plan-assignment": { en: "Assign Nutrition Plan", ar: "تعيين خطة التغذية" },
  "/coach/injury-tracking": { en: "Injury Tracking", ar: "تتبع الإصابات" },
  "/gps-tracker": { en: "GPS Tracker", ar: "تتبع GPS" },
  "/team-progress-comparison": { en: "Team Progress", ar: "مقارنة تقدم الفريق" },
  "/team-management": { en: "Squad Management", ar: "إدارة التشكيلة" },
  "/load-management": { en: "Load Management", ar: "إدارة الحمل التدريبي" },
  "/training-session-recorder": { en: "Session Recorder", ar: "تسجيل الجلسة التدريبية" },
  "/medical-status-dashboard": { en: "Medical Dashboard", ar: "لوحة المتابعة الطبية" },
  "/medical-trends": { en: "Blood & InBody Trends", ar: "اتجاهات فحوصات الدم والجسم" },
  "/team-doctor": { en: "Team Doctor", ar: "لوحة طبيب الفريق" },
  "/drill-video-library": { en: "Drill Library", ar: "مكتبة التمارين" },
  "/parent-notification-center": { en: "Parent Notifications", ar: "إشعارات أولياء الأمور" },
  "/weekly-report-scheduler": { en: "Weekly Reports", ar: "التقارير الأسبوعية" },
  "/staff-attendance": { en: "Staff Attendance", ar: "سجل حضور الجهاز الفني" },
  "/coach-education/laws": { en: "Football Laws", ar: "قوانين كرة القدم" },
  "/coach-education/courses": { en: "Coaching Courses", ar: "دورات التدريب والتأهيل" },
  "/coach-education/videos": { en: "Training Videos", ar: "مقاطع فيديو التدريب" },
  "/coach-assessment": { en: "Coach Assessment", ar: "تقييم أداء المدرب" },
  "/parent-portal": { en: "Parent Portal", ar: "بوابة أولياء الأمور" },
  "/forum": { en: "Forum", ar: "المنتدى" },
  "/leaderboard": { en: "Leaderboard", ar: "لوحة المتصدرين" },
  "/rewards": { en: "Rewards", ar: "المكافآت" },
  "/streak": { en: "Daily Streak", ar: "سلسلة الإنجازات اليومية" },
  "/team-needs-analysis": { en: "Team Needs Analysis", ar: "تحليل احتياجات الفريق" },
  "/data-analysis-pro": { en: "Data Analysis Pro", ar: "تحليل البيانات الاحترافي" },
  "/realtime-match-tracking": { en: "Realtime Match Tracking", ar: "تتبع المباراة في الوقت الفعلي" },
  "/settings": { en: "Settings", ar: "الإعدادات" },
  "/user-management": { en: "User Management", ar: "إدارة المستخدمين" },
  "/admin/role-permissions": { en: "Role Permissions", ar: "صلاحيات الأدوار" },
  "/admin/data-management": { en: "Data Management", ar: "إدارة قاعدة البيانات" },
  "/admin/home-content": { en: "Home Content", ar: "محتوى الصفحة الرئيسية" },
  "/admin/team-assignment": { en: "Team Assignment", ar: "تعيين اللاعبين للفرق" },
  "/admin/coach-assignment": { en: "Coach Assignment", ar: "تعيين المدربين للفرق" },
  "/admin/team-management": { en: "Team Management", ar: "إدارة الفرق والمجموعات" },
  "/admin/staff-management": { en: "Staff Management", ar: "الجهاز الفني والإداري" },
  "/staff-directory": { en: "Staff Directory", ar: "دليل الكادر الفني" },
  "/team-rosters": { en: "Team Rosters", ar: "قوائم وتشكيلات الفرق" },
  "/full-player-report": { en: "Full Player Report", ar: "التقرير الشامل للاعب" },
  "/performance": { en: "Performance Analytics", ar: "تحليلات الأداء" },
  "/age-group-benchmarking": { en: "Age-Group Benchmarking", ar: "معايير الفئات العمرية" },
  "/training-innovation-hub": { en: "Training Innovation Hub", ar: "مركز الابتكار التدريبي" },
  "/player-documents": { en: "Player Documents", ar: "وثائق اللاعبين" },
  "/xg-analytics": { en: "xG Analytics", ar: "تحليلات xG" },
};

const APP_NAME = "Future Stars Academy";
const APP_NAME_AR = "أكاديمية فيوتشر ستارز";

export function usePageTitle() {
  const [location] = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    // Find the best matching route (longest prefix match)
    let bestMatch: { en: string; ar: string } | null = null;
    let bestLength = 0;

    for (const [path, titles] of Object.entries(PAGE_TITLES)) {
      if (location === path || location.startsWith(path) && path !== "/") {
        if (path.length > bestLength) {
          bestMatch = titles;
          bestLength = path.length;
        }
      }
    }

    // Exact match for root
    if (location === "/") {
      bestMatch = PAGE_TITLES["/"];
    }

    if (bestMatch) {
      const pageTitle = language === "ar" ? bestMatch.ar : bestMatch.en;
      const appName = language === "ar" ? APP_NAME_AR : APP_NAME;
      document.title = `${pageTitle} | ${appName}`;
    } else {
      document.title = language === "ar" ? APP_NAME_AR : APP_NAME;
    }
  }, [location, language]);
}
