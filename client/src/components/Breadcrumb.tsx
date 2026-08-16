import { Link, useLocation } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Route label map: path segment → { en, ar }
const ROUTE_LABELS: Record<string, { en: string; ar: string }> = {
  'dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'coach-dashboard': { en: 'Coach Dashboard', ar: 'لوحة المدرب' },
  'team-dashboard': { en: 'Team Dashboard', ar: 'لوحة الفريق' },
  'performance-dashboard': { en: 'Performance', ar: 'الأداء' },
  'players': { en: 'Players', ar: 'اللاعبون' },
  'player': { en: 'Player Profile', ar: 'ملف اللاعب' },
  'scouting': { en: 'Scouting Report', ar: 'تقرير الكشافة' },
  'medical': { en: 'Medical Profile', ar: 'الملف الطبي' },
  'progress': { en: 'Progress', ar: 'التقدم' },
  'report': { en: 'Report', ar: 'التقرير' },
  'scorecard': { en: 'Scorecard', ar: 'بطاقة الأداء' },
  'skill-assessment': { en: 'Skill Assessment', ar: 'تقييم المهارات' },
  'performance': { en: 'Performance', ar: 'الأداء' },
  'training': { en: 'Training', ar: 'التدريب' },
  'training-session-recorder': { en: 'Session Recorder', ar: 'تسجيل الجلسة' },
  'session-execution': { en: 'Session Execution', ar: 'تنفيذ الجلسة' },
  'session-comparison': { en: 'Session Comparison', ar: 'مقارنة الجلسات' },
  'drill-video-library': { en: 'Drill Library', ar: 'مكتبة التمارين' },
  'drill-assignment-system': { en: 'Drill Assignment', ar: 'توزيع التمارين' },
  'load-management': { en: 'Load Management', ar: 'إدارة الحمل' },
  'training-innovation-hub': { en: 'Innovation Hub', ar: 'مركز الابتكار' },
  'medical-status-dashboard': { en: 'Medical Dashboard', ar: 'لوحة الصحة' },
  'team-medical-overview': { en: 'Medical Overview', ar: 'نظرة طبية عامة' },
  'medical-trends': { en: 'Medical Trends', ar: 'الاتجاهات الطبية' },
  'injury-prevention': { en: 'Injury Prevention', ar: 'الوقاية من الإصابات' },
  'team-doctor': { en: 'Team Doctor', ar: 'طبيب الفريق' },
  'nutrition': { en: 'Nutrition', ar: 'التغذية' },
  'nutrition-ai': { en: 'Nutrition AI', ar: 'تغذية ذكية' },
  'nutrition-plan-assignment': { en: 'Nutrition Plans', ar: 'خطط التغذية' },
  'tactical-hub': { en: 'Tactical Hub', ar: 'المركز التكتيكي' },
  'advanced-tactical-hub': { en: 'Advanced Tactics', ar: 'التكتيك المتقدم' },
  'tactical-simulation': { en: 'Tactical Simulation', ar: 'المحاكاة التكتيكية' },
  'tactical-simulation-lab': { en: 'Simulation Lab', ar: 'مختبر المحاكاة' },
  'animated-tactical-board': { en: 'Animated Board', ar: 'اللوحة المتحركة' },
  'ai-formation-recommendation': { en: 'AI Formation', ar: 'التشكيل بالذكاء الاصطناعي' },
  'match': { en: 'Match', ar: 'المباراة' },
  'match-video-tagger': { en: 'Video Tagger', ar: 'وسوم الفيديو' },
  'multi-match-comparison': { en: 'Match Comparison', ar: 'مقارنة المباريات' },
  'realtime-match-tracking': { en: 'Live Tracking', ar: 'التتبع المباشر' },
  'season-stats': { en: 'Season Stats', ar: 'إحصائيات الموسم' },
  'ai-coach': { en: 'AI Coach', ar: 'المدرب الذكي' },
  'coach-selection': { en: 'Coach Selection', ar: 'اختيار المدرب' },
  'coach-database': { en: 'Coach Database', ar: 'قاعدة بيانات المدربين' },
  'coach-registration': { en: 'Coach Registration', ar: 'تسجيل المدرب' },
  'coach-progress': { en: 'Coach Progress', ar: 'تقدم المدرب' },
  'coach-reminders': { en: 'Reminders', ar: 'التذكيرات' },
  'coach': { en: 'Coach', ar: 'المدرب' },
  'player-comparison': { en: 'Player Comparison', ar: 'مقارنة اللاعبين' },
  'analytics': { en: 'Analytics', ar: 'التحليلات' },
  'xg-analytics': { en: 'xG Analytics', ar: 'تحليل xG' },
  'cross-team-benchmarking': { en: 'Cross-Team Benchmarking', ar: 'المقارنة بين الفرق' },
  'age-group-benchmarking': { en: 'Age Group Benchmarking', ar: 'مقارنة الفئات العمرية' },
  'team-progress-comparison': { en: 'Team Progress', ar: 'تقدم الفريق' },
  'scout-network': { en: 'Scout Network', ar: 'شبكة الكشافة' },
  'player-scouting-report': { en: 'Scouting Report', ar: 'تقرير الكشافة' },
  'team-needs-analysis': { en: 'Team Needs', ar: 'احتياجات الفريق' },
  'idp': { en: 'Development Plan', ar: 'خطة التطوير' },
  'player-development-plan': { en: 'Development Plan', ar: 'خطة التطوير' },
  'player-card': { en: 'Player Card', ar: 'بطاقة اللاعب' },
  'player-full-report': { en: 'Full Report', ar: 'التقرير الكامل' },
  'full-player-report': { en: 'Full Report', ar: 'التقرير الكامل' },
  'player-progress-dashboard': { en: 'Player Progress', ar: 'تقدم اللاعب' },
  'player-attachments': { en: 'Attachments', ar: 'المرفقات' },
  'player-documents': { en: 'Documents', ar: 'الوثائق' },
  'features-hub': { en: 'Advanced Features', ar: 'الميزات المتقدمة' },
  'settings': { en: 'Settings', ar: 'الإعدادات' },
  'profile': { en: 'My Profile', ar: 'ملفي الشخصي' },
  'attendance': { en: 'Attendance', ar: 'الحضور' },
  'staff-attendance': { en: 'Staff Attendance', ar: 'حضور الموظفين' },
  'staff-directory': { en: 'Staff Directory', ar: 'دليل الموظفين' },
  'academy-teams': { en: 'Academy Teams', ar: 'فرق الأكاديمية' },
  'team-players': { en: 'Team Players', ar: 'لاعبو الفريق' },
  'academy-roster': { en: 'Academy Roster', ar: 'قائمة الأكاديمية' },
  'team-management': { en: 'Team Management', ar: 'إدارة الفريق' },
  'team-schedule': { en: 'Team Schedule', ar: 'جدول الفريق' },
  'events-calendar': { en: 'Events Calendar', ar: 'تقويم الفعاليات' },
  'book-private-session': { en: 'Book Session', ar: 'حجز جلسة خاصة' },
  'booking-management': { en: 'Booking Management', ar: 'إدارة الحجوزات' },
  'points-management': { en: 'Points & Achievements', ar: 'النقاط والإنجازات' },
  'billing': { en: 'Billing', ar: 'الفواتير' },
  'plans': { en: 'Plans', ar: 'الخطط' },
  'my-fees': { en: 'My Fees', ar: 'رسومي' },
  'parent-fees': { en: 'Parent Fees', ar: 'رسوم ولي الأمر' },
  'parent-notification-center': { en: 'Notifications', ar: 'الإشعارات' },
  'weekly-report-scheduler': { en: 'Weekly Reports', ar: 'التقارير الأسبوعية' },
  'succession-planning': { en: 'Succession Planning', ar: 'التخطيط للخلافة' },
  'location-management': { en: 'Locations', ar: 'المواقع' },
  'video-telestration': { en: 'Video Telestration', ar: 'تحليل الفيديو' },
  'opponent-video-analysis': { en: 'Opponent Analysis', ar: 'تحليل المنافس' },
  'data-analysis-pro': { en: 'Data Analysis', ar: 'تحليل البيانات' },
  'admin': { en: 'Admin', ar: 'الإدارة' },
  'users': { en: 'Users', ar: 'المستخدمون' },
};

// Section groupings: which paths belong to which parent section
const SECTION_PARENTS: Record<string, { path: string; en: string; ar: string }> = {
  'skill-assessment': { path: '/players', en: 'Players', ar: 'اللاعبون' },
  'player-progress-dashboard': { path: '/players', en: 'Players', ar: 'اللاعبون' },
  'player-full-report': { path: '/players', en: 'Players', ar: 'اللاعبون' },
  'full-player-report': { path: '/players', en: 'Players', ar: 'اللاعبون' },
  'player-card': { path: '/players', en: 'Players', ar: 'اللاعبون' },
  'player-attachments': { path: '/players', en: 'Players', ar: 'اللاعبون' },
  'player-documents': { path: '/players', en: 'Players', ar: 'اللاعبون' },
  'idp': { path: '/players', en: 'Players', ar: 'اللاعبون' },
  'player-development-plan': { path: '/players', en: 'Players', ar: 'اللاعبون' },
  'session-execution': { path: '/training', en: 'Training', ar: 'التدريب' },
  'session-comparison': { path: '/training', en: 'Training', ar: 'التدريب' },
  'training-session-recorder': { path: '/training', en: 'Training', ar: 'التدريب' },
  'drill-video-library': { path: '/training', en: 'Training', ar: 'التدريب' },
  'drill-assignment-system': { path: '/training', en: 'Training', ar: 'التدريب' },
  'load-management': { path: '/training', en: 'Training', ar: 'التدريب' },
  'training-innovation-hub': { path: '/training', en: 'Training', ar: 'التدريب' },
  'team-medical-overview': { path: '/medical-status-dashboard', en: 'Medical', ar: 'الصحة' },
  'medical-trends': { path: '/medical-status-dashboard', en: 'Medical', ar: 'الصحة' },
  'injury-prevention': { path: '/medical-status-dashboard', en: 'Medical', ar: 'الصحة' },
  'team-doctor': { path: '/medical-status-dashboard', en: 'Medical', ar: 'الصحة' },
  'nutrition-ai': { path: '/nutrition', en: 'Nutrition', ar: 'التغذية' },
  'nutrition-plan-assignment': { path: '/nutrition', en: 'Nutrition', ar: 'التغذية' },
  'animated-tactical-board': { path: '/tactical-hub', en: 'Tactics', ar: 'التكتيك' },
  'tactical-simulation': { path: '/tactical-hub', en: 'Tactics', ar: 'التكتيك' },
  'ai-formation-recommendation': { path: '/tactical-hub', en: 'Tactics', ar: 'التكتيك' },
  'match-video-tagger': { path: '/match', en: 'Matches', ar: 'المباريات' },
  'multi-match-comparison': { path: '/match', en: 'Matches', ar: 'المباريات' },
  'realtime-match-tracking': { path: '/match', en: 'Matches', ar: 'المباريات' },
  'season-stats': { path: '/match', en: 'Matches', ar: 'المباريات' },
  'coach-selection': { path: '/coach-dashboard', en: 'Coaches', ar: 'المدربون' },
  'coach-database': { path: '/coach-dashboard', en: 'Coaches', ar: 'المدربون' },
  'coach-progress': { path: '/coach-dashboard', en: 'Coaches', ar: 'المدربون' },
  'coach-reminders': { path: '/coach-dashboard', en: 'Coaches', ar: 'المدربون' },
  'xg-analytics': { path: '/analytics', en: 'Analytics', ar: 'التحليلات' },
  'cross-team-benchmarking': { path: '/analytics', en: 'Analytics', ar: 'التحليلات' },
  'age-group-benchmarking': { path: '/analytics', en: 'Analytics', ar: 'التحليلات' },
  'team-progress-comparison': { path: '/analytics', en: 'Analytics', ar: 'التحليلات' },
  'player-scouting-report': { path: '/scout-network', en: 'Scouting', ar: 'الكشافة' },
  'team-needs-analysis': { path: '/scout-network', en: 'Scouting', ar: 'الكشافة' },
  'book-private-session': { path: '/booking-management', en: 'Bookings', ar: 'الحجوزات' },
  'billing': { path: '/my-fees', en: 'Billing', ar: 'الفواتير' },
  'staff-attendance': { path: '/attendance', en: 'Attendance', ar: 'الحضور' },
  'staff-directory': { path: '/academy-teams', en: 'Academy', ar: 'الأكاديمية' },
  'academy-roster': { path: '/academy-teams', en: 'Academy', ar: 'الأكاديمية' },
  'team-players': { path: '/academy-teams', en: 'Academy', ar: 'الأكاديمية' },
  'team-management': { path: '/academy-teams', en: 'Academy', ar: 'الأكاديمية' },
  'team-schedule': { path: '/events-calendar', en: 'Calendar', ar: 'التقويم' },
  'weekly-report-scheduler': { path: '/parent-notification-center', en: 'Notifications', ar: 'الإشعارات' },
  'features-hub': { path: '/dashboard', en: 'Dashboard', ar: 'لوحة التحكم' },
  'succession-planning': { path: '/settings', en: 'Settings', ar: 'الإعدادات' },
  'location-management': { path: '/settings', en: 'Settings', ar: 'الإعدادات' },
  'video-telestration': { path: '/tactical-hub', en: 'Tactics', ar: 'التكتيك' },
  'opponent-video-analysis': { path: '/tactical-hub', en: 'Tactics', ar: 'التكتيك' },
  'data-analysis-pro': { path: '/analytics', en: 'Analytics', ar: 'التحليلات' },
};

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

function getLabel(segment: string, lang: string): string {
  const entry = ROUTE_LABELS[segment];
  if (!entry) {
    // Capitalize and humanize unknown segments
    return segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return lang === 'ar' ? entry.ar : entry.en;
}

export function Breadcrumb() {
  const [location] = useLocation();
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  // Don't show breadcrumb on root, dashboard, or very short paths
  const cleanPath = location.split('?')[0];
  const segments = cleanPath.split('/').filter(Boolean);

  // Only show for pages 1+ level deep (not dashboard itself)
  if (segments.length === 0 || cleanPath === '/dashboard' || cleanPath === '/' ) return null;

  const items: BreadcrumbItem[] = [];

  // Always start with Dashboard as home
  items.push({
    label: isRtl ? 'الرئيسية' : 'Dashboard',
    path: '/dashboard',
    isLast: false,
  });

  // Check if there's a section parent for this page
  const firstSegment = segments[0];
  const sectionParent = SECTION_PARENTS[firstSegment];

  if (sectionParent && sectionParent.path !== '/dashboard') {
    items.push({
      label: isRtl ? sectionParent.ar : sectionParent.en,
      path: sectionParent.path,
      isLast: false,
    });
  }

  // Build path segments
  let builtPath = '';
  segments.forEach((seg, idx) => {
    builtPath += '/' + seg;
    const isLast = idx === segments.length - 1;
    // Skip numeric IDs — they're part of the previous segment's context
    if (/^\d+$/.test(seg)) {
      // Modify previous item to not be last
      if (items.length > 0) items[items.length - 1].isLast = false;
      return;
    }
    // Skip if already added as section parent
    if (items.some(i => i.path === builtPath)) return;

    items.push({
      label: getLabel(seg, language),
      path: builtPath,
      isLast,
    });
  });

  // Mark last item
  if (items.length > 0) {
    items.forEach((item, i) => {
      item.isLast = i === items.length - 1;
    });
  }

  // Don't render if only 1 item (just dashboard)
  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="breadcrumb"
      className="flex items-center gap-1 px-1 py-2 mb-4 text-sm text-muted-foreground overflow-x-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Home className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
      {items.map((item, idx) => (
        <span key={item.path} className="flex items-center gap-1 shrink-0">
          {idx > 0 && (
            <ChevronRight
              className={`w-3.5 h-3.5 text-muted-foreground/40 shrink-0 ${isRtl ? 'rotate-180' : ''}`}
            />
          )}
          {item.isLast ? (
            <span className="font-medium text-foreground truncate max-w-[160px]">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.path}
              className="hover:text-foreground transition-colors truncate max-w-[120px]"
            >
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumb;
