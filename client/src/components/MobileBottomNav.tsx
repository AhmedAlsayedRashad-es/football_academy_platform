import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { 
  LayoutDashboard, Users, Calendar, Trophy, CreditCard,
  Activity, Heart, Apple, Brain, Settings, Swords, BarChart3,
  Video, ClipboardList, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  labelAr: string;
  path: string;
  roles: string[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  // Universal: Dashboard
  {
    icon: LayoutDashboard,
    label: 'Home',
    labelAr: 'الرئيسية',
    path: '/dashboard',
    roles: ['admin', 'coach', 'assistant_coach', 'parent', 'player', 'nutritionist', 'mental_coach', 'physical_trainer', 'doctor', 'physio', 'finance', 'academy_owner', 'platform_owner'],
  },
  // Admin
  {
    icon: Users,
    label: 'Users',
    labelAr: 'المستخدمون',
    path: '/user-management',
    roles: ['admin', 'academy_owner', 'platform_owner'],
  },
  {
    icon: Settings,
    label: 'Admin',
    labelAr: 'الإدارة',
    path: '/admin/control-panel',
    roles: ['admin', 'academy_owner', 'platform_owner'],
  },
  // Coach
  {
    icon: Users,
    label: 'Players',
    labelAr: 'اللاعبون',
    path: '/players',
    roles: ['coach', 'assistant_coach'],
  },
  {
    icon: Calendar,
    label: 'Training',
    labelAr: 'التدريب',
    path: '/training',
    roles: ['coach', 'assistant_coach', 'player'],
  },
  {
    icon: Swords,
    label: 'Matches',
    labelAr: 'المباريات',
    path: '/matches',
    roles: ['coach', 'assistant_coach'],
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    labelAr: 'التحليلات',
    path: '/analytics',
    roles: ['coach', 'assistant_coach'],
  },
  // Player
  {
    icon: Activity,
    label: 'Performance',
    labelAr: 'الأداء',
    path: '/performance',
    roles: ['player'],
  },
  {
    icon: Video,
    label: 'Videos',
    labelAr: 'الفيديو',
    path: '/videos',
    roles: ['player'],
  },
  {
    icon: CreditCard,
    label: 'Fees',
    labelAr: 'الرسوم',
    path: '/my-fees',
    roles: ['player'],
  },
  // Parent
  {
    icon: User,
    label: 'My Child',
    labelAr: 'طفلي',
    path: '/parent-dashboard',
    roles: ['parent'],
  },
  {
    icon: Calendar,
    label: 'Schedule',
    labelAr: 'الجدول',
    path: '/training',
    roles: ['parent'],
  },
  {
    icon: CreditCard,
    label: 'Fees',
    labelAr: 'الرسوم',
    path: '/my-fees',
    roles: ['parent'],
  },
  // Doctor / Medical staff
  {
    icon: Heart,
    label: 'Medical',
    labelAr: 'الطبي',
    path: '/team-doctor',
    roles: ['doctor', 'physio'],
  },
  {
    icon: ClipboardList,
    label: 'Injuries',
    labelAr: 'الإصابات',
    path: '/injury-prevention',
    roles: ['doctor', 'physio'],
  },
  // Nutritionist
  {
    icon: Apple,
    label: 'Nutrition',
    labelAr: 'التغذية',
    path: '/nutrition',
    roles: ['nutritionist'],
  },
  // Mental coach
  {
    icon: Brain,
    label: 'Mental',
    labelAr: 'النفسي',
    path: '/mental-coaching',
    roles: ['mental_coach'],
  },
  // Finance
  {
    icon: CreditCard,
    label: 'Finance',
    labelAr: 'المالية',
    path: '/finance',
    roles: ['finance'],
  },
];

function getNavItemsForRole(role: string): NavItem[] {
  const items = ALL_NAV_ITEMS.filter(item => item.roles.includes(role));
  return items.slice(0, 5);
}

export function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();

  if (!user) return null;

  const visibleItems = getNavItemsForRole(user.role);

  if (visibleItems.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || 
            location.startsWith(item.path + '/') ||
            location.startsWith(item.path + '?');
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-all duration-150',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={language === 'ar' ? item.labelAr : item.label}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-150',
                  isActive && 'scale-110'
                )}
              />
              <span className="truncate max-w-[60px] text-[10px] leading-tight">
                {language === 'ar' ? item.labelAr : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
