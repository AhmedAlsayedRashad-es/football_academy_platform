import { useState } from "react";
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHelp } from "@/components/PageHelp";
import { useLocation } from "wouter";
import { BackButton } from '@/components/BackButton';
import {
  Users2,
  Trophy,
  UserCog,
  Stethoscope,
  ArrowLeft,
  ChevronRight,
  Shield,
  Search,
} from 'lucide-react';

export default function AdminTeamManagement() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [teamSearch, setTeamSearch] = useState('');

  const { data: teams } = trpc.teams.getAll.useQuery();

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) { navigate('/'); return null; }

  const mainTeams = teams?.filter(t => t.teamType === 'main') ?? [];
  const academyTeams = teams?.filter(t => t.teamType === 'academy') ?? [];
  const totalTeams = teams?.length ?? 0;

  const filteredTeams = (teams ?? []).filter(t =>
    !teamSearch || t.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const features = [
    {
      icon: UserCog,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      title: isRTL ? 'تعيين الجهاز الفني والإداري' : 'Staff Assignment',
      description: isRTL
        ? 'تعيين المدربين الرئيسيين والمساعدين ومدربي اللياقة والطاقم الطبي والإداري'
        : 'Assign head coaches, assistants, fitness coaches, medical staff & admin',
      path: '/admin/staff-management',
    },
    {
      icon: Users2,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      title: isRTL ? 'قائمة اللاعبين' : 'Player Roster',
      description: isRTL
        ? 'إضافة وإزالة اللاعبين من الفرق وإدارة أرقام القمصان'
        : 'Add/remove players from teams, manage squad numbers',
      path: '/admin/team-assignment',
    },
    {
      icon: Trophy,
      iconColor: 'text-yellow-700 dark:text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      title: isRTL ? 'ملفات الفرق' : 'Team Profiles',
      description: isRTL
        ? 'إنشاء ملفات الفريق الأول وفرق الأكاديمية مع الفئات العمرية'
        : 'Create Main Team and Academy Team profiles with age groups',
      path: '/admin/coach-assignment',
    },
    {
      icon: Stethoscope,
      iconColor: 'text-green-700 dark:text-green-500',
      bgColor: 'bg-green-500/10',
      title: isRTL ? 'التكامل الطبي' : 'Medical Integration',
      description: isRTL
        ? 'ربط الملفات الطبية للاعبين مباشرة من عرض الفريق'
        : 'Link to player medical profiles directly from team view',
      path: '/team-medical-overview',
    },
  ];

  return (
    <>
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
              <BackButton />

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-yellow-700 dark:text-yellow-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">
            {isRTL ? 'إدارة الفرق' : 'Team Management'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL
              ? 'إدارة الفريق الكاملة — الجهاز الفني والإداري'
              : 'Full team & staff management — الجهاز الفني والإداري'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-5 text-center">
            <div className="text-3xl font-bold text-red-500">{mainTeams.length}</div>
            <div className="text-sm text-muted-foreground mt-1">{isRTL ? 'الفريق الأول' : 'Main Teams'}</div>
          </div>
          <div className="rounded-xl border bg-card p-5 text-center">
            <div className="text-3xl font-bold text-blue-500">{academyTeams.length}</div>
            <div className="text-sm text-muted-foreground mt-1">{isRTL ? 'فرق الأكاديمية' : 'Academy Teams'}</div>
          </div>
          <div className="rounded-xl border bg-card p-5 text-center">
            <div className="text-3xl font-bold text-green-700 dark:text-green-500">{totalTeams}</div>
            <div className="text-sm text-muted-foreground mt-1">{isRTL ? 'إجمالي الفرق' : 'Total Teams'}</div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-3">
          {features.map((feature) => (
            <button
              key={feature.title}
              onClick={() => navigate(feature.path)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left group"
            >
              <div className={`w-11 h-11 rounded-lg ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{feature.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{feature.description}</div>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          ))}
        </div>

        {/* Open Team Management CTA */}
        <Button
          onClick={() => navigate('/admin/staff-management')}
          className="w-full h-14 text-base font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl"
        >
          <Users2 className="w-5 h-5 mr-2" />
          {isRTL ? 'فتح إدارة الجهاز الفني' : 'Open Staff Management'}
        </Button>

        {/* Browse Teams */}
        {teams && teams.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{isRTL ? 'استعراض الفرق' : 'Browse Teams'}</h2>
              <span className="text-xs text-muted-foreground">{filteredTeams.length} {isRTL ? 'فريق' : 'teams'}</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'ابحث عن فريق...' : 'Search teams...'}
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredTeams.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/admin/teams/${t.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${t.teamType === 'main' ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}>
                    {t.teamType === 'main'
                      ? <Trophy className="w-4 h-4 text-yellow-700 dark:text-yellow-500" />
                      : <Shield className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.ageGroup}</div>
                  </div>
                  <Badge variant={t.teamType === 'main' ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                    {t.teamType === 'main' ? (isRTL ? 'رئيسي' : 'Main') : (isRTL ? 'أكاديمية' : 'Academy')}
                  </Badge>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <PageHelp pageKey="team-management" />
    </>
  );
}
