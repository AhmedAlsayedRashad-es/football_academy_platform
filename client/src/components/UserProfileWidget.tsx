import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Shield,
  User,
  Users,
  Star,
  Hash,
  Calendar,
  Activity,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-600 text-white",
  coach: "bg-blue-600 text-white",
  nutritionist: "bg-green-600 text-white",
  mental_coach: "bg-purple-600 text-white",
  physical_trainer: "bg-orange-600 text-white",
  parent: "bg-teal-600 text-white",
  player: "bg-yellow-500 text-black",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: Shield,
  coach: Star,
  nutritionist: Activity,
  mental_coach: Activity,
  physical_trainer: Activity,
  parent: Users,
  player: User,
};

const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  admin: { en: "Admin", ar: "مدير" },
  coach: { en: "Coach", ar: "مدرب" },
  nutritionist: { en: "Nutritionist", ar: "أخصائي تغذية" },
  mental_coach: { en: "Mental Coach", ar: "مدرب نفسي" },
  physical_trainer: { en: "Physical Trainer", ar: "مدرب لياقة" },
  parent: { en: "Parent", ar: "ولي أمر" },
  player: { en: "Player", ar: "لاعب" },
};

const POSITION_LABELS: Record<string, { en: string; ar: string }> = {
  goalkeeper: { en: "GK", ar: "حارس" },
  defender: { en: "DEF", ar: "مدافع" },
  midfielder: { en: "MID", ar: "وسط" },
  forward: { en: "FWD", ar: "مهاجم" },
};

export function UserProfileWidget() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const { data: profile, isLoading } = trpc.auth.profile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading || !profile) {
    return (
      <div className="mx-3 mb-3 rounded-xl border bg-card/50 p-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const RoleIcon = ROLE_ICONS[profile.role] ?? User;
  const roleLabel = ROLE_LABELS[profile.role]?.[language as "en" | "ar"] ?? profile.role;
  const roleColorClass = ROLE_COLORS[profile.role] ?? "bg-gray-600 text-white";
  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const primaryCoachTeam = profile.coachTeams?.find((t) => t.isPrimary) ?? profile.coachTeams?.[0];

  return (
    <div
      className="mx-3 mb-3 rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden cursor-pointer hover:bg-card/80 transition-colors group"
      onClick={() => navigate("/settings")}
      title={language === "ar" ? "عرض الملف الشخصي" : "View Profile"}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${roleColorClass.split(" ")[0]}`} />

      <div className="p-3">
        {/* Avatar + Name + Role */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12 border-2 border-border">
              {(profile.avatarUrl || profile.player?.photoUrl) && (
                <AvatarImage
                  src={profile.avatarUrl || profile.player?.photoUrl || ""}
                  alt={profile.name || ""}
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Role badge on avatar */}
            <span
              className={`absolute -bottom-1 -right-1 rounded-full p-0.5 ${roleColorClass} shadow-sm`}
              style={{ lineHeight: 0 }}
            >
              <RoleIcon className="w-3 h-3" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{profile.name}</p>
            <Badge
              className={`text-[10px] px-1.5 py-0 mt-0.5 font-medium ${roleColorClass} border-0`}
            >
              {roleLabel}
            </Badge>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 text-xs">
          {/* Player-specific info */}
          {profile.player && (
            <>
              {profile.player.academyCode && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="w-3 h-3 flex-shrink-0" />
                  <span className="font-mono font-semibold text-foreground">
                    {profile.player.academyCode}
                  </span>
                  <span className="text-muted-foreground">
                    {language === "ar" ? "كود الأكاديمية" : "Academy Code"}
                  </span>
                </div>
              )}
              {profile.player.jerseyNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-3 h-3 flex-shrink-0 text-center font-bold text-[10px] text-foreground">
                    #{profile.player.jerseyNumber}
                  </span>
                  <span>
                    {profile.player.position
                      ? POSITION_LABELS[profile.player.position]?.[language as "en" | "ar"] ?? profile.player.position
                      : ""}
                  </span>
                  {profile.player.ageGroup && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto">
                      {profile.player.ageGroup}
                    </Badge>
                  )}
                </div>
              )}
              {profile.team && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate text-foreground font-medium">{profile.team.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-auto capitalize">
                    {profile.team.teamType === "main"
                      ? language === "ar" ? "الفريق الأول" : "Main Team"
                      : language === "ar" ? "الأكاديمية" : "Academy"}
                  </Badge>
                </div>
              )}
              {profile.player.status && (
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      profile.player.status === "active"
                        ? "text-green-700 dark:text-green-500"
                        : profile.player.status === "injured"
                        ? "text-red-500"
                        : "text-yellow-700 dark:text-yellow-500"
                    }`}
                  >
                    {profile.player.status === "active"
                      ? language === "ar" ? "نشط" : "Active"
                      : profile.player.status === "injured"
                      ? language === "ar" ? "مصاب" : "Injured"
                      : profile.player.status === "trial"
                      ? language === "ar" ? "تجريبي" : "Trial"
                      : language === "ar" ? "غير نشط" : "Inactive"}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Coach/Staff-specific info */}
          {profile.coachTeams && profile.coachTeams.length > 0 && (
            <>
              {primaryCoachTeam && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate text-foreground font-medium">
                    {primaryCoachTeam.teamName ?? (language === "ar" ? "لا يوجد فريق" : "No Team")}
                  </span>
                  {primaryCoachTeam.isPrimary && (
                    <Badge className="text-[10px] px-1 py-0 ml-auto bg-blue-600 text-white border-0">
                      {language === "ar" ? "رئيسي" : "Primary"}
                    </Badge>
                  )}
                </div>
              )}
              {profile.coachTeams.length > 1 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-[10px]">
                    {language === "ar"
                      ? `+${profile.coachTeams.length - 1} فرق أخرى`
                      : `+${profile.coachTeams.length - 1} more team${profile.coachTeams.length - 1 > 1 ? "s" : ""}`}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Admin info */}
          {profile.role === "admin" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-3 h-3 flex-shrink-0" />
              <span className="text-[10px] text-foreground">
                {language === "ar" ? "وصول كامل للنظام" : "Full System Access"}
              </span>
            </div>
          )}

          {/* Last sign in */}
          {profile.lastSignedIn && (
            <div className="flex items-center gap-2 text-muted-foreground pt-0.5 border-t border-border/50 mt-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="text-[10px]">
                {language === "ar" ? "آخر دخول: " : "Last login: "}
                {new Date(profile.lastSignedIn).toLocaleDateString(
                  language === "ar" ? "ar-EG" : "en-GB",
                  { day: "numeric", month: "short" }
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
