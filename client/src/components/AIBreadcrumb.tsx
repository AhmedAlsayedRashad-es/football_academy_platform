import { useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronRight, Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

interface AIBreadcrumbProps {
  /** The label of the current AI tool page */
  toolLabel: string;
  /** Optional extra crumbs between "AI Dashboard" and the tool */
  extraCrumbs?: { label: string; path: string }[];
  className?: string;
}

export function AIBreadcrumb({ toolLabel, extraCrumbs, className }: AIBreadcrumbProps) {
  const [location, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  // Fire usage tracking silently on mount
  const trackUsage = trpc.tactical.trackAIToolUsage.useMutation();
  useEffect(() => {
    trackUsage.mutate({ toolPath: location, toolLabel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crumbs = [
    { label: isRTL ? 'الرئيسية' : 'Dashboard', path: '/dashboard', icon: Home },
    { label: isRTL ? 'أدوات الذكاء الاصطناعي' : 'AI Dashboard', path: '/ai-dashboard', icon: Sparkles },
    ...(extraCrumbs || []).map(c => ({ ...c, icon: undefined })),
    { label: toolLabel, path: null, icon: undefined },
  ];

  const Separator = () => (
    <ChevronRight
      className={cn("h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0", isRTL && "rotate-180")}
    />
  );

  return (
    <nav
      aria-label="breadcrumb"
      className={cn(
        "flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap",
        isRTL && "flex-row-reverse",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        const Icon = crumb.icon;
        return (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && <Separator />}
            {isLast ? (
              <span className="font-medium text-foreground flex items-center gap-1">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {crumb.label}
              </span>
            ) : (
              <button
                onClick={() => crumb.path && navigate(crumb.path)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
