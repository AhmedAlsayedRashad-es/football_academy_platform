import { useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export interface BreadcrumbItem {
  label: string;
  labelAr?: string;
  href?: string;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  /** Override language — if omitted, auto-detects from LanguageContext */
  language?: string;
  className?: string;
}

/**
 * PageBreadcrumb — a lightweight breadcrumb trail for deep sub-pages.
 * Automatically reads the active language from LanguageContext so Arabic
 * users see Arabic labels without any extra prop needed.
 *
 * Usage:
 *   <PageBreadcrumb items={[
 *     { label: "Players", labelAr: "اللاعبين", href: "/players" },
 *     { label: "Omar Khaled", labelAr: "عمر خالد", href: "/player/5" },
 *     { label: "Medical Profile", labelAr: "الملف الطبي" },
 *   ]} />
 */
export default function PageBreadcrumb({ items, language, className }: PageBreadcrumbProps) {
  const [, navigate] = useLocation();
  // Always call the hook unconditionally — satisfies React rules of hooks.
  // If the component is rendered outside a LanguageProvider (e.g. tactical
  // pages that use their own dark layout), useLanguage() will throw and we
  // catch it at the ErrorBoundary level; in practice all pages are wrapped.
  const { language: ctxLang } = useLanguage();

  // Explicit prop wins; otherwise use context language
  const activeLanguage = language ?? ctxLang;
  const isAr = activeLanguage === "ar";

  return (
    <nav
      aria-label="breadcrumb"
      className={cn("flex items-center gap-1 text-sm text-muted-foreground flex-wrap", className)}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Always show Home as first crumb */}
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        aria-label={isAr ? "الرئيسية" : "Dashboard"}
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{isAr ? "الرئيسية" : "Home"}</span>
      </button>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const label = isAr && item.labelAr ? item.labelAr : item.label;

        return (
          <span key={idx} className="flex items-center gap-1">
            <ChevronRight className={cn("h-3.5 w-3.5 flex-shrink-0", isAr && "rotate-180")} />
            {isLast || !item.href ? (
              <span
                className={cn(
                  "max-w-[160px] truncate",
                  isLast
                    ? "text-foreground font-medium"
                    : "hover:text-foreground transition-colors cursor-pointer"
                )}
                onClick={!isLast && item.href ? () => navigate(item.href!) : undefined}
                title={label}
              >
                {label}
              </span>
            ) : (
              <button
                onClick={() => navigate(item.href!)}
                className="max-w-[160px] truncate hover:text-foreground transition-colors"
                title={label}
              >
                {label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
