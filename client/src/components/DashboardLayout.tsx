import { useAuth } from "@/_core/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";
import PlatformTutorial from "@/components/PlatformTutorial";
import { useParentChild } from "@/contexts/ParentChildContext";
import { ChildSelector } from "@/components/ChildSelector";
import { TeamSwitcher } from "@/components/TeamSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserProfileWidget } from "@/components/UserProfileWidget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  Users, 
  Activity, 
  Brain, 
  Dumbbell, 
  Apple, 
  Calendar, 
  Target, 
  Trophy, 
  BarChart2,
  BarChart3,
  Settings,
  UserCircle,
  Heart,
  Swords,
  Video,
  Sun,
  Moon,
  Satellite,
  XCircle,
  Film, Camera,
  Cpu,
  Microscope,
  LineChart,
  Wand2,
  Bot,
  TrendingUp,
  FileText,
  Network,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  MessageSquare,
  Shield,
  Zap,
  ClipboardList,
  Map,
  Gamepad2,
  BookOpen,
  Users2,
  Flame,
  Gift,
  Home,
  Globe,
  Star,
  CheckSquare,
  CreditCard,
  Play,
  UserCog,
  UserCheck,
  Stethoscope,
  GitCompare,
  GitBranch,
  BellRing,
  CalendarClock,
  Pencil,
  Tag,
  Award,
  Mic,
  Wallet,
  User,
  PartyPopper,
  Sparkles,
  Ban,
  Inbox
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Breadcrumb } from './Breadcrumb';
import { PageTransition } from './PageTransition';
import { Button } from "./ui/button";
import { AIChatWidget } from "./AIChatWidget";
import { PWAInstallBanner } from "./PWAInstallBanner";
import { MobileBottomNav } from "./MobileBottomNav";
import { OnboardingTour } from "./OnboardingTour";
import { GlobalSearch } from "./GlobalSearch";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Clock } from "lucide-react";

// Define the team-specific items that appear in both Main Team and Academy Team modules
const getTeamModuleItems = (language: string, teamPrefix: string) => [
  { icon: Users, label: language === 'ar' ? 'اللاعبين' : 'Players', path: `/${teamPrefix}/players` },
  { icon: Activity, label: language === 'ar' ? 'الأداء' : 'Performance', path: `/${teamPrefix}/performance` },
  { icon: Calendar, label: language === 'ar' ? 'التدريب' : 'Training', path: `/${teamPrefix}/training` },
  { icon: Swords, label: language === 'ar' ? 'المباريات' : 'Matches', path: `/${teamPrefix}/matches` },
  { icon: Video, label: language === 'ar' ? 'الفيديو' : 'Videos', path: `/${teamPrefix}/videos` },
  { icon: BarChart3, label: language === 'ar' ? 'التحليلات' : 'Analytics', path: `/${teamPrefix}/analytics` },
];

// Module-based navigation structure
// MAIN TABS with yellow highlight are marked with isMainTab: true
const getModules = (t: (key: string) => string, language: string, userTeamType?: string | null) => {
  const baseModules = [
    // ── 1. DASHBOARD (yellow main tab) ──
    {
      id: 'dashboard',
      label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard',
      icon: LayoutDashboard,
      isMainTab: true,
      items: [
        { icon: LayoutDashboard, label: language === 'ar' ? 'الرئيسية' : 'Overview', path: '/dashboard' },
      ]
    },
    // ── 2. PLAYER MANAGEMENT (yellow main tab) ──
    {
      id: 'players',
      label: language === 'ar' ? 'إدارة اللاعبين' : 'Player Management',
      icon: Users,
      isMainTab: true,
      items: [
        { icon: Users, label: language === 'ar' ? 'التسجيل في الأكاديمية' : 'Academy Enrollment', path: '/enrollment' },
        { icon: ClipboardList, label: language === 'ar' ? 'مراجعة الطلبات' : 'Enrollment Review', path: '/enrollment-admin' },
        { icon: ClipboardList, label: language === 'ar' ? 'تقييم المهارات' : 'Skills Assessment', path: '/skill-assessment' },
        { icon: CreditCard, label: language === 'ar' ? 'بطاقة اللاعب' : 'Player Card', path: '/player-card' },
        { icon: Star, label: language === 'ar' ? 'إدارة النقاط' : 'Points Management', path: '/points-management' },
        { icon: CheckSquare, label: language === 'ar' ? 'تتبع الحضور' : 'Attendance Tracking', path: '/attendance' },
        { icon: ClipboardList, label: language === 'ar' ? 'وثائق اللاعبين' : 'Player Documents', path: '/player-documents' },
      ]
    },
    // ── 3. MAIN TEAM (yellow main tab) ──
    {
      id: 'main-team',
      label: language === 'ar' ? 'الفريق الأول' : 'Main Team',
      icon: Trophy,
      isMainTab: true,
      teamType: 'main',
      items: [
        { icon: LayoutDashboard, label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', path: '/team-dashboard?team=main' },
        { icon: Users, label: language === 'ar' ? 'اللاعبين' : 'Players', path: '/players?team=main' },
        { icon: Calendar, label: language === 'ar' ? 'التدريب' : 'Training', path: '/training?team=main' },
      ]
    },
    // ── 4. ACADEMY TEAM (yellow main tab) ──
    {
      id: 'academy-team',
      label: language === 'ar' ? 'فريق الأكاديمية' : 'Academy Team',
      icon: Shield,
      isMainTab: true,
      teamType: 'academy',
      items: [
        { icon: LayoutDashboard, label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', path: '/team-dashboard?team=academy' },
        { icon: Users, label: language === 'ar' ? 'اللاعبين' : 'Players', path: '/players?team=academy' },
        { icon: Calendar, label: language === 'ar' ? 'التدريب' : 'Training', path: '/training?team=academy' },
      ]
    },
    // ── 5. TRAINING (yellow main tab) ──
    {
      id: 'training',
      label: language === 'ar' ? 'التدريب' : 'Training',
      icon: Calendar,
      isMainTab: true,
      items: [
        // '/training' is reached from the Main Team and Academy Team sections,
        // which scope it with ?team=. A third unscoped copy here duplicated both
        // and repeated this module's own name.
        { icon: Video, label: language === 'ar' ? 'فيديوهات المهارات' : 'Skills Videos', path: '/skills-videos' },
        { icon: BookOpen, label: language === 'ar' ? 'مكتبة التمارين' : 'Drill Video Library', path: '/drill-video-library' },
        { icon: Users, label: language === 'ar' ? 'التدريب الخاص' : 'Private Training', path: '/private-training' },
        { icon: Shield, label: language === 'ar' ? 'فرقي وسيشناتي الخاصة' : 'My Private Teams & Sessions', path: '/coach/my-teams' },
        { icon: Calendar, label: language === 'ar' ? 'حجوزاتي' : 'My Bookings', path: '/my-bookings' },
        { icon: Calendar, label: language === 'ar' ? 'جدول التوفر' : 'Availability', path: '/coach-availability' },
        { icon: Globe, label: language === 'ar' ? 'بوابة المواهب' : 'Talent Portal', path: '/talent-portal' },
        { icon: BookOpen, label: language === 'ar' ? 'مكتبة المهارات' : 'Skills Library', path: '/skills-library' },
        { icon: Calendar, label: language === 'ar' ? 'خطة التدريب' : 'Training Plan Builder', path: '/training-plan-builder' },
        { icon: Shield, label: language === 'ar' ? 'أكاديمية حراس المرمى' : 'Goalkeeper Academy', path: '/goalkeeper-academy' },
      ]
    },
    // ── 6. MATCHES (yellow main tab) ──
    {
      id: 'matches',
      label: language === 'ar' ? 'المباريات' : 'Matches',
      icon: Swords,
      isMainTab: true,
      items: [
        { icon: Swords, label: language === 'ar' ? 'إدارة المباريات' : 'Match Management', path: '/matches' },
        { icon: Calendar, label: language === 'ar' ? 'تقويم المباريات' : 'Match Schedule Calendar', path: '/team-schedule' },
        { icon: GitCompare, label: language === 'ar' ? 'مقارنة المباريات' : 'Multi-Match Comparison', path: '/multi-match-comparison' },
        { icon: ClipboardList, label: language === 'ar' ? 'تسجيل أحداث المباراة' : 'Record Match Events', path: '/match-event-recording' },
        { icon: Trophy, label: language === 'ar' ? 'جدول الدوري' : 'League Fixtures', path: '/league' },
        { icon: Ban, label: language === 'ar' ? 'الإيقافات والعقوبات' : 'Suspensions & Bans', path: '/suspensions' },
        { icon: Shield, label: language === 'ar' ? 'الكروت والعقوبات' : 'Cards & Punishments', path: '/punishments' },
        { icon: Calendar, label: language === 'ar' ? 'الجدولة الذكية' : 'Smart Scheduling', path: '/smart-scheduling' },
      ]
    },
    // ── 7. TACTICS & FORMATIONS (yellow main tab) ──
    {
      id: 'tactics',
      label: language === 'ar' ? 'التكتيكات والتشكيلات' : 'Tactics & Formations',
      icon: Map,
      isMainTab: true,
      items: [
        { icon: Brain, label: language === 'ar' ? 'محرك استخبارات المباريات' : 'Match Intelligence Engine', path: '/match-intelligence' },
        { icon: BarChart3, label: language === 'ar' ? 'محرك تحليل المباريات' : 'Match Analysis Engine', path: '/match-analysis-engine' },
        { icon: Target, label: language === 'ar' ? 'اللوحة التكتيكية' : 'Tactics Board', path: '/professional-tactical-board' },
        { icon: Zap, label: language === 'ar' ? 'التكتيكات المتحركة' : 'Animated Tactics', path: '/animated-tactical-board' },
        { icon: Users2, label: language === 'ar' ? 'منشئ التشكيلات' : 'Formation Builder', path: '/formation-builder' },
        { icon: Zap, label: language === 'ar' ? 'محاكاة الأوضاع الثابتة' : 'Set Piece Simulation', path: '/set-piece-simulation' },
      ]
    },
    // ── 8. VIDEO ANALYSIS (yellow main tab) ──
    {
      id: 'video',
      label: language === 'ar' ? 'تحليل الفيديو' : 'Video Analysis',
      icon: Video,
      isMainTab: true,
      items: [
        { icon: Video, label: language === 'ar' ? 'معرض الفيديو' : 'Video Gallery', path: '/videos' },
        { icon: Brain, label: language === 'ar' ? 'تحليل الفيديو الذكي (مدرب)' : 'AI Video Analysis — Coach', path: '/coach/ai-video-analysis' },
        { icon: Film, label: language === 'ar' ? 'تحليل الفيديو الذكي (لاعب)' : 'AI Video Analysis — Player', path: '/video-analysis-player' },
        { icon: Pencil, label: language === 'ar' ? 'المحلل التكتيكي' : 'Tactical Annotator', path: '/video-telestration' },
        { icon: Activity, label: language === 'ar' ? 'التحليل التكتيكي المتقدم' : 'Tactical Analysis Hub', path: '/tactical-video-analysis' },
        { icon: Brain, label: language === 'ar' ? 'التحليل الاحترافي للمباريات' : 'Pro Match Analysis', path: '/pro-match-analysis' },
        { icon: MessageSquare, label: language === 'ar' ? 'غرفة تبديل الملابس الرقمية' : 'Digital Locker Room', path: '/locker-room' },
        { icon: Mic, label: language === 'ar' ? 'المدرب الصوتي' : 'Voice Coach', path: '/voice-coach' },
        { icon: Globe, label: language === 'ar' ? 'مركز الفريق الاحترافي' : 'Pro Club Hub', path: '/pro-club-hub' },
      ]
    },
    // ── 9. ADVANCED TOOLS (yellow main tab) ──
    {
      id: 'ai',
      label: language === 'ar' ? 'الأدوات المتقدمة' : 'Advanced Tools',
      icon: Brain,
      isMainTab: true,
      items: [
        // Absorbs: AI Match Coach, AI Emergency Mode (tabs inside the page)
        { icon: Bot, label: language === 'ar' ? 'مساعد المدرب الذكي' : 'AI Coach Assistant', path: '/coach/ai-assistant' },
        // Absorbs: AI Formation Simulation, AI Tactical Planner (tabs inside the page)
        { icon: Users2, label: language === 'ar' ? 'مستشار التشكيلة الذكي' : 'AI Formation Advisor', path: '/ai-formation-recommendation' },
        // Absorbs: Player Development AI (tab inside the page)
        { icon: TrendingUp, label: language === 'ar' ? 'الأداء والتطوير' : 'Performance & Development', path: '/coach/performance-prediction' },
        // Absorbs: Coach Selection AI (tab inside the page)
        { icon: ClipboardList, label: language === 'ar' ? 'الاستكشاف' : 'Scouting', path: '/player-scouting-report' },
        // Hub for all match AI analysis
        { icon: Microscope, label: language === 'ar' ? 'تحضير المباراة' : 'Match Preparation', path: '/ai-dashboard' },
        // Scheduling tool
        { icon: Calendar, label: language === 'ar' ? 'التقويم الذكي' : 'AI Smart Calendar', path: '/coach/ai-calendar' },
        // Advanced Features Hub — all 17 advanced features in one place
        { icon: Sparkles, label: language === 'ar' ? 'مركز الميزات المتقدمة' : 'Advanced Features Hub', path: '/features-hub' },
      ]
    },
    // ── 10. ANALYTICS & REPORTS (yellow main tab) ──
    {
      id: 'analytics',
      label: language === 'ar' ? 'التحليلات والتقارير' : 'Analytics & Reports',
      icon: BarChart3,
      isMainTab: true,
      items: [
        { icon: BarChart3, label: language === 'ar' ? 'تحليلات الأداء' : 'Performance Analytics', path: '/analytics' },
        { icon: TrendingUp, label: language === 'ar' ? 'تحليلات xG' : 'xG Analytics', path: '/xg-analytics' },
        { icon: Award, label: language === 'ar' ? 'معايير الفئة العمرية' : 'Age-Group Benchmarking', path: '/age-group-benchmarking' },
        { icon: Trophy, label: language === 'ar' ? 'إحصائيات الموسم' : 'Season Statistics', path: '/season-stats' },
        { icon: FileText, label: language === 'ar' ? 'تقارير المباريات' : 'Match Reports', path: '/match-reports' },
        { icon: FileText, label: language === 'ar' ? 'مولد التقارير الذكي' : 'AI Report Generator', path: '/coach/match-report-generator' },
        { icon: TrendingUp, label: language === 'ar' ? 'مركز المقارنة المعيارية' : 'Benchmarking Hub', path: '/benchmarking-hub' },
        { icon: FileText, label: language === 'ar' ? 'التقارير التلقائية' : 'Auto Reports', path: '/auto-reports' },
        { icon: FileText, label: language === 'ar' ? 'تقرير اللاعب الكامل' : 'Full Player Report', path: '/full-player-report' },
      ]
    },
    // ── 11. STAFF TOOLS (yellow main tab) ──
    {
      id: 'staff',
      label: language === 'ar' ? 'أدوات الطاقم' : 'Staff Tools',
      icon: Heart,
      isMainTab: true,
      items: [
        // Player Welfare
        { icon: Brain, label: language === 'ar' ? 'التدريب الذهني' : 'Mental Coaching', path: '/mental' },
        { icon: Dumbbell, label: language === 'ar' ? 'التدريب البدني' : 'Physical Training', path: '/physical' },
        { icon: Apple, label: language === 'ar' ? 'التغذية' : 'Nutrition', path: '/nutrition' },
        { icon: Apple, label: language === 'ar' ? 'تعيين خطة التغذية' : 'Assign Nutrition Plan', path: '/nutrition-plan-assignment' },

        // Performance & Tracking
        { icon: Satellite, label: language === 'ar' ? 'تتبع GPS' : 'GPS Tracker', path: '/gps-tracker' },
        { icon: Activity, label: language === 'ar' ? 'Smart Shoe Pro' : 'Smart Shoe Pro', path: '/device-integration' },
        { icon: Users2, label: language === 'ar' ? 'مقارنة تقدم الفريق' : 'Team Progress', path: '/team-progress-comparison' },
        { icon: Users2, label: language === 'ar' ? 'إدارة التشكيلة' : 'Squad Management', path: '/team-management' },
        { icon: Activity, label: language === 'ar' ? 'إدارة الحمل التدريبي' : 'Load Management', path: '/load-management' },
        { icon: Zap, label: language === 'ar' ? 'مركز التدريب الموحد' : 'Training Hub', path: '/training-hub' },
        { icon: ClipboardList, label: language === 'ar' ? 'تسجيل الجلسة التدريبية' : 'Session Recorder', path: '/training-session-recorder' },
        { icon: Play, label: language === 'ar' ? 'تنفيذ الجلسة' : 'Session Execution', path: '/session-execution' },
        // Medical — Injury Tracking is now inside Medical Dashboard (per Excel)
        { icon: Activity, label: language === 'ar' ? 'لوحة المتابعة الطبية' : 'Medical Dashboard', path: '/medical-status-dashboard' },
        { icon: TrendingUp, label: language === 'ar' ? 'اتجاهات فحوصات الدم والجسم' : 'Blood & InBody Trends', path: '/medical-trends' },
        { icon: Stethoscope, label: language === 'ar' ? 'لوحة طبيب الفريق' : 'Doctor Dashboard', path: '/team-doctor' },
        // Reporting
        { icon: CalendarClock, label: language === 'ar' ? 'التقارير الأسبوعية' : 'Weekly Reports', path: '/weekly-report-scheduler' },
        { icon: UserCheck, label: language === 'ar' ? 'سجل حضور الجهاز الفني' : 'Staff Attendance', path: '/staff-attendance' },
        { icon: Activity, label: language === 'ar' ? 'الإنذار المبكر للإصابات' : 'Injury Early Warning', path: '/injury-early-warning' },
      ]
    },
    // ── 12. EDUCATION (yellow main tab) ──
    {
      id: 'education',
      label: language === 'ar' ? 'التعليم' : 'Education',
      icon: GraduationCap,
      isMainTab: true,
      items: [
        { icon: BookOpen, label: language === 'ar' ? 'قوانين كرة القدم' : 'Football Laws', path: '/coach-education/laws' },
        { icon: GraduationCap, label: language === 'ar' ? 'دورات التدريب والتأهيل' : 'Coaching Courses', path: '/coach-education/courses' },
        { icon: Video, label: language === 'ar' ? 'مقاطع فيديو التدريب' : 'Training Videos', path: '/coach-education/videos' },
        { icon: Trophy, label: language === 'ar' ? 'تقييم أداء المدرب' : 'Coach Assessment', path: '/coach-assessment' },
      ]
    },
    // ── 13. COMMUNITY (yellow main tab) ──
    {
      id: 'community',
      label: language === 'ar' ? 'المجتمع' : 'Community',
      icon: MessageSquare,
      isMainTab: true,
      items: [
        { icon: Calendar, label: language === 'ar' ? 'تقويم الفعاليات' : 'Events Calendar', path: '/events-calendar' },
        { icon: UserCircle, label: language === 'ar' ? 'بوابة أولياء الأمور' : 'Parent Portal', path: '/parent-portal' },
        { icon: Wallet, label: language === 'ar' ? 'رسومي' : 'My Fees', path: '/my-fees' },
        { icon: CreditCard, label: language === 'ar' ? 'بوابة الرسوم والاشتراك' : 'Fee Portal & Subscription', path: '/parent-fees' },
        { icon: MessageSquare, label: language === 'ar' ? 'المنتدى' : 'Forum', path: '/forum' },
        { icon: Inbox, label: language === 'ar' ? 'رسائل المدرب' : 'Coach Messages', path: '/player-locker-room' },
        { icon: Trophy, label: language === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard', path: '/leaderboard' },
        { icon: Gift, label: language === 'ar' ? 'المكافآت' : 'Rewards', path: '/rewards' },
        { icon: Flame, label: language === 'ar' ? 'سلسلة الإنجازات اليومية' : 'Daily Streak', path: '/streak' },
        { icon: Trophy, label: language === 'ar' ? 'مركز الألعاب والتحديات' : 'Gamification Hub', path: '/gamification-hub' },
        { icon: Users2, label: language === 'ar' ? 'سوق الانتقالات' : 'Transfer Market', path: '/transfer-market' },
        { icon: UserCircle, label: language === 'ar' ? 'لوحة ولي الأمر المحسّنة' : 'Enhanced Parent Dashboard', path: '/enhanced-parent-dashboard' },
      ]
    },
    // ── 14. ADMIN (yellow main tab) — Parent Notifications moved here per Excel ──
    {
      id: 'admin',
      label: language === 'ar' ? 'الإدارة' : 'Admin',
      icon: Settings,
      isMainTab: true,
      items: [
        { icon: User, label: language === 'ar' ? 'ملفي الشخصي' : 'My Profile', path: '/profile' },
        { icon: Settings, label: language === 'ar' ? 'الإعدادات' : 'Settings', path: '/settings' },
        { icon: LayoutDashboard, label: language === 'ar' ? 'لوحة التحكم الرئيسية' : 'Control Panel', path: '/admin/control-panel' },
        { icon: Users, label: language === 'ar' ? 'إدارة المستخدمين' : 'User Management', path: '/user-management' },
        { icon: Shield, label: language === 'ar' ? 'صلاحيات الأدوار' : 'Role Permissions', path: '/admin/role-permissions' },
        { icon: LayoutDashboard, label: language === 'ar' ? 'إدارة قاعدة البيانات' : 'Data Management', path: '/admin/data-management' },
        { icon: FileText, label: language === 'ar' ? 'محتوى الصفحة الرئيسية' : 'Home Content', path: '/admin/home-content' },
        { icon: Users2, label: language === 'ar' ? 'تعيين اللاعبين للفرق' : 'Team Assignment', path: '/admin/team-assignment' },
        { icon: Users, label: language === 'ar' ? 'تعيين المدربين للفرق' : 'Coach Assignment', path: '/admin/coach-assignment' },
        { icon: Users2, label: language === 'ar' ? 'إدارة الفرق والمجموعات' : 'Team Management', path: '/admin/team-management' },
        { icon: UserCog, label: language === 'ar' ? 'الجهاز الفني والإداري' : 'Staff Management', path: '/admin/staff-management' },
        { icon: UserCog, label: language === 'ar' ? 'تسجيل المدرب' : 'Coach Registration', path: '/coach-registration' },
        { icon: Users2, label: language === 'ar' ? 'دليل الكادر الفني' : 'Staff Directory', path: '/staff-directory' },
        { icon: Users2, label: language === 'ar' ? 'قوائم وتشكيلات الفرق' : 'Team Rosters', path: '/team-rosters' },
        { icon: BarChart2, label: language === 'ar' ? 'مقارنة الفرق العمرية' : 'Cross-Team Benchmarking', path: '/cross-team-benchmarking' },
        { icon: BarChart3, label: language === 'ar' ? 'لوحة القيادة التنفيذية' : 'Executive Dashboard', path: '/executive-dashboard' },
        { icon: GitBranch, label: language === 'ar' ? 'تخطيط التعاقب' : 'Succession Planning', path: '/succession-planning' },
        { icon: BellRing, label: language === 'ar' ? 'إشعارات أولياء الأمور' : 'Parent Notifications', path: '/parent-notification-center' },
        { icon: MessageSquare, label: language === 'ar' ? 'إدارة الشات بوت' : 'Chatbot Q&A', path: '/admin/chatbot-qa' },
        { icon: Star, label: language === 'ar' ? 'إدارة التوصيات' : 'Testimonials', path: '/admin/testimonials' },
        { icon: Award, label: language === 'ar' ? 'إدارة الشارات' : 'Badge Management', path: '/admin/badge-management' },
      ]
    },
    // ── 15. FINANCE (yellow main tab — split from Admin per Excel spec) ──
    {
      id: 'finance',
      label: language === 'ar' ? 'المالية' : 'Finance',
      icon: Wallet,
      isMainTab: true,
      items: [
        { icon: Wallet, label: language === 'ar' ? 'الإدارة المالية' : 'Finance Overview', path: '/finance' },
        { icon: CreditCard, label: language === 'ar' ? 'خطط الاشتراك' : 'Subscription Plans', path: '/billing/plans' },
        { icon: TrendingUp, label: language === 'ar' ? 'تكاليف الموظفين' : 'Staff Cost Tracking', path: '/staff-costs' },
        { icon: Award, label: language === 'ar' ? 'إدارة المنح الدراسية' : 'Scholarship Management', path: '/scholarships' },
      ]
    },
  ];

  return baseModules;
};

// Get modules based on user role and team assignment
const getModulesForRole = (
  role: string, 
  t: (key: string) => string, 
  language: string,
  userTeamType?: string | null
) => {
  const allModules = getModules(t, language, userTeamType);
  
  if (role === 'admin') {
    // Admin sees all modules
    return allModules;
  } else if (role === 'coach') {
    // Coach sees only relevant modules — exclude admin, team dashboards, staff tools, community, finance
    const coachModules = allModules.filter(m => !['admin', 'main-team', 'academy-team', 'staff', 'community', 'finance', 'education'].includes(m.id));
    // Replace dashboard module items with coach-specific links
    return coachModules.map(m => {
      if (m.id === 'dashboard') {
        return {
          ...m,
          items: [
            // '/coach/my-teams' and '/suspensions' already appear in the Training
            // and Matches modules, both of which coaches also see.
            { icon: LayoutDashboard, label: language === 'ar' ? 'الرئيسية' : 'Overview', path: '/coach/home' },
          ]
        };
      }
      return m;
    });
  } else if (['nutritionist', 'mental_coach', 'physical_trainer'].includes(role)) {
    // Staff sees limited modules plus both team modules
    return allModules.filter(m => 
      ['dashboard', 'main-team', 'academy-team', 'players', 'staff', 'community'].includes(m.id)
    );
  } else if (role === 'parent') {
    // Parent sees only their child's team module
    if (userTeamType === 'main') {
      return allModules.filter(m => ['dashboard', 'main-team', 'community'].includes(m.id));
    } else if (userTeamType === 'academy') {
      return allModules.filter(m => ['dashboard', 'academy-team', 'community'].includes(m.id));
    }
    // If no team assigned, show both
    return allModules.filter(m => ['dashboard', 'main-team', 'academy-team', 'community'].includes(m.id));
  } else if (role === 'player') {
    // Player sees only their team module
    if (userTeamType === 'main') {
      return allModules.filter(m => ['dashboard', 'main-team', 'training', 'community'].includes(m.id));
    } else if (userTeamType === 'academy') {
      return allModules.filter(m => ['dashboard', 'academy-team', 'training', 'community'].includes(m.id));
    }
    // If no team assigned, show both
    return allModules.filter(m => ['dashboard', 'main-team', 'academy-team', 'training', 'community'].includes(m.id));
  }
  
  return [allModules[0]]; // Dashboard only for unknown roles
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const RECENTLY_USED_KEY = 'ai_recently_used';
const MAX_RECENT = 3;

function ModuleNavigation({ modules, currentPath }: { modules: ReturnType<typeof getModules>, currentPath: string }) {
  const [openModules, setOpenModules] = useState<string[]>(['dashboard']);
  const [, navigate] = useLocation();
  const currentSearch = useSearch();
  const { language } = useLanguage();

  // Recently used AI tools — persisted in localStorage
  const [recentlyUsed, setRecentlyUsed] = useState<{label: string; path: string; iconName: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENTLY_USED_KEY) || '[]'); } catch { return []; }
  });

  // Auto-open module containing current path + track recently used AI tools
  useEffect(() => {
    const currentModule = modules.find(m => m.items.some(item => {
      // Check if path matches (ignoring query params)
      const itemBasePath = item.path.split('?')[0];
      const currentBasePath = currentPath.split('?')[0];
      return itemBasePath === currentBasePath || item.path === currentPath;
    }));
    if (currentModule && !openModules.includes(currentModule.id)) {
      setOpenModules(prev => [...prev, currentModule.id]);
    }
    // Track recently used AI tools
    const aiModule = modules.find(m => m.id === 'ai');
    if (aiModule) {
      const matchedItem = aiModule.items.find(item => {
        const itemBase = item.path.split('?')[0];
        const curBase = currentPath.split('?')[0];
        return itemBase === curBase;
      });
      if (matchedItem) {
        setRecentlyUsed(prev => {
          const filtered = prev.filter(r => r.path !== matchedItem.path);
          const next = [{ label: matchedItem.label, path: matchedItem.path, iconName: 'Brain' }, ...filtered].slice(0, MAX_RECENT);
          try { localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
      }
    }
  }, [currentPath, modules]);

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Team-scoped entries share a route and differ only by ?team=, so matching on
  // the bare path alone lit up every copy at once (Main Team / Academy Team /
  // Training all highlighted together). Compare the query too.
  const isItemActive = (itemPath: string) => {
    const [itemBasePath, itemQuery = ''] = itemPath.split('?');
    if (itemBasePath !== currentPath.split('?')[0]) return false;
    return itemQuery === currentSearch.replace(/^\?/, '');
  };

  return (
    <div className="space-y-0.5 px-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Recently Used Advanced Tools */}
      {recentlyUsed.length > 0 && (
        <div className="mb-2">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
            language === 'ar' ? 'flex-row-reverse' : ''
          )}>
            <span>{language === 'ar' ? 'مستخدم مؤخراً' : 'Recently Used'}</span>
          </div>
          {recentlyUsed.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "sidebar-sub-item",
                language === 'ar' ? 'pr-4 pl-2' : 'pl-4 pr-2',
                isItemActive(item.path) && "active"
              )}
            >
              <span className="truncate text-xs">{item.label}</span>
            </button>
          ))}
          <div className="border-b border-border/40 mx-2 mt-1 mb-1" />
        </div>
      )}
      {modules.map((module) => (
        <Collapsible
          key={module.id}
          open={openModules.includes(module.id)}
          onOpenChange={() => toggleModule(module.id)}
        >
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "sidebar-module-header",
                openModules.includes(module.id) && "active",
                // Yellow background for main section headers (per Excel spec)
                (module as any).isMainTab && "bg-yellow-400/20 hover:bg-yellow-400/30 border-l-2 border-yellow-400 text-yellow-700 dark:text-yellow-300 font-semibold"
              )}
            >
              <span className="flex-1 truncate">{module.label}</span>
              {openModules.includes(module.id) ? (
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-0.5 mb-1">
            {module.items.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "sidebar-sub-item",
                  language === 'ar' ? 'pr-8 pl-2' : 'pl-8 pr-2',
                  isItemActive(item.path) && "active"
                )}
              >
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sidebar uses default 16rem width from CSS
  const { loading, user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isMobile = useIsMobile();
  const { selectedChildId, setSelectedChildId } = useParentChild();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  
  // Get player info for the current user to determine their team
  const { data: playerInfo } = trpc.players.getByUserId.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user && (user.role === 'player') }
  );
  
  // Get parent's children to determine team for parent users
  const { data: parentChildren } = trpc.players.getForParent.useQuery(
    undefined,
    { enabled: !!user && user.role === 'parent' }
  );
  
  // Get team info to determine team type
  const { data: teams } = trpc.teams.getAll.useQuery(undefined, {
    enabled: !!user
  });

  // Get role-based nav permissions from DB
  const { data: rolePermConfig } = trpc.rolePermissions.getByRole.useQuery(
    { role: user?.role ?? '' },
    { enabled: !!user }
  );

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-hero">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center">
              {language === 'ar' ? 'منصة أكاديمية كرة القدم' : 'Football Academy Platform'}
            </h1>
            <p className="text-muted-foreground text-center">
              {language === 'ar' 
                ? 'سجل الدخول للوصول إلى منصة تطوير اللاعبين وتتبع رحلتك نحو التميز.'
                : 'Sign in to access the player development platform and track your journey to excellence.'}
            </p>
          </div>
          <Button 
            onClick={() => { try { (window.top || window).location.href = getLoginUrl(); } catch { window.open(getLoginUrl(), '_top'); } }}
            className="w-full"
            size="lg"
          >
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Button>
        </div>
      </div>
    );
  }

  // Determine user's team type
  let userTeamType: string | null = null;
  
  if (user.role === 'player' && playerInfo?.teamId && teams) {
    const playerTeam = teams.find(t => t.id === playerInfo.teamId);
    userTeamType = playerTeam?.teamType || null;
  } else if (user.role === 'parent' && parentChildren && parentChildren.length > 0 && teams) {
    // For parents, use the first child's team
    const firstChild = parentChildren[0];
    if (firstChild?.teamId) {
      const childTeam = teams.find(t => t.id === firstChild.teamId);
      userTeamType = childTeam?.teamType || null;
    }
  }

  // Apply DB role permission config on top of the role-based defaults
  const baseModules = getModulesForRole(user.role, t, language, userTeamType);
  const permConfig = rolePermConfig ? (rolePermConfig as any).config as { modules: Record<string, boolean>; items: Record<string, boolean> } : null;
  const modules = permConfig
    ? baseModules
        .filter(m => permConfig.modules[m.id] !== false)
        .map(m => ({
          ...m,
          items: m.items.filter(item => permConfig.items[item.path] !== false),
        }))
        .filter(m => m.items.length > 0)
    : baseModules;

  return (
    <SidebarProvider defaultOpen={true} style={{ '--sidebar-width': '16rem' } as CSSProperties}>
      <div className="flex min-h-screen w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Sidebar
          side={language === 'ar' ? 'right' : 'left'}
          className={language === 'ar' ? 'border-l' : 'border-r'}
        >
          <SidebarHeader className="border-b px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }} className="flex items-center justify-center flex-shrink-0 rounded-full bg-red-700 p-0.5">
                <img src="/logo-transparent.png" alt="Future Stars" style={{ width: '26px', height: '26px', maxWidth: '26px', maxHeight: '26px', objectFit: 'contain' }} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold text-sm leading-tight truncate">
                  {language === 'ar' ? 'أكاديمية النجوم المستقبلية' : 'Future Stars Academy'}
                </span>
                <span className="text-xs text-muted-foreground capitalize leading-tight">
                  {user.role === 'admin' ? (language === 'ar' ? 'مدير' : 'Admin') :
                   user.role === 'coach' ? (language === 'ar' ? 'مدرب' : 'Coach') :
                   user.role === 'parent' ? (language === 'ar' ? 'ولي أمر' : 'Parent') :
                   user.role === 'player' ? (language === 'ar' ? 'لاعب' : 'Player') :
                   user.role}
                </span>
              </div>
              <button
                onClick={() => navigate('/')}
                title={language === 'ar' ? 'الصفحة الرئيسية' : 'Public Home'}
                className="flex-shrink-0 p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <Home className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                title={language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                className="flex-shrink-0 p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="py-2">
            <UserProfileWidget />
            <ModuleNavigation modules={modules} currentPath={location} />
          </SidebarContent>
          
          <SidebarFooter className="border-t p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleTheme?.()}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              >
                <Globe className="h-4 w-4 mr-1" />
                {language === 'ar' ? 'EN' : 'عربي'}
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col items-start text-sm">
                    <span className="w-full truncate font-medium">{user.name}</span>
                    <span className="w-full truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'الملف الشخصي' : 'My Profile'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'الإعدادات' : 'Settings'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1 bg-background min-w-0 overflow-x-hidden">
          <header className="flex h-14 items-center gap-2 sm:gap-4 border-b bg-card px-3 sm:px-4 lg:px-6 shadow-sm">
            <SidebarTrigger className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <GlobalSearch />
            </div>
            {/* Events quick-access tab - hidden on mobile */}
            <Link
              href="/events-calendar"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground flex-shrink-0"
            >
              <PartyPopper className="w-3.5 h-3.5 text-primary" />
              <span>{language === 'ar' ? 'الفعاليات' : 'Events'}</span>
            </Link>
            {/* TeamSwitcher - hidden on mobile to save space */}
            {['coach', 'admin'].includes(user.role) && (
              <div className="hidden sm:block flex-shrink-0">
                <TeamSwitcher />
              </div>
            )}
            {/* Tutorial button - hidden on mobile */}
            <button
              onClick={() => setTutorialOpen(true)}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-sm font-bold flex-shrink-0"
              title="Platform Tutorial"
            >
              ?
            </button>
            <div className="flex-shrink-0">
              <NotificationBell />
            </div>
            {user.role === 'parent' && (
              <div className="flex-shrink-0">
                <ChildSelector
                  selectedChildId={selectedChildId ?? ''}
                  onChildChange={(id: string) => setSelectedChildId(id || null)}
                />
              </div>
            )}
            <PlatformTutorial open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
          </header>
          
          <main id="main-content" className="flex-1 p-3 sm:p-4 lg:p-6 pb-20 md:pb-6" role="main" aria-label="Main content">
            <Breadcrumb />
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </SidebarInset>
      </div>
      
      {/* Onboarding Tour - auto-shows on first login */}
      <OnboardingTour />

      {/* AI Chat Widget */}
      <AIChatWidget />
      {/* PWA Install & Push Notification Banners */}
      <PWAInstallBanner />
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </SidebarProvider>
  );
}
