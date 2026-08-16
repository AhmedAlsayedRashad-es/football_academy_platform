import { useState } from "react";
import { HelpCircle, X, ChevronDown, ChevronUp, Users, Zap, BookOpen, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface HelpSection {
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  steps?: string[];
  stepsAr?: string[];
  whoCanUse?: string;
  tip?: string;
  tipAr?: string;
}

interface PageHelpProps {
  // Legacy props (for backward compatibility)
  title?: string;
  description?: string;
  sections?: HelpSection[];
  color?: string;
  // New prop: use a predefined page key
  pageKey?: string;
}

const PAGE_HELP_DATA: Record<string, { title: string; titleAr: string; description: string; descriptionAr: string; sections: HelpSection[] }> = {
  "video-analysis": {
    title: "Match Video Analysis",
    titleAr: "تحليل فيديو المباراة",
    description: "Upload a match video to detect team jersey colors and generate an AI tactical report.",
    descriptionAr: "ارفع فيديو المباراة للكشف عن ألوان قمصان الفرق وإنشاء تقرير تكتيكي بالذكاء الاصطناعي.",
    sections: [
      {
        title: "How to use",
        titleAr: "كيفية الاستخدام",
        steps: [
          "Enter Team 1 and Team 2 names — this ensures the AI correctly identifies each team in the report.",
          "Upload a match video file (MP4, AVI, MOV supported).",
          "Click 'Analyze Video' to detect jersey colors and generate the AI report.",
          "The report covers both teams: formations, strengths, weaknesses, and recommendations.",
          "Report text is displayed in black for readability.",
        ],
        stepsAr: [
          "أدخل اسم الفريق الأول والثاني — هذا يضمن تعرف الذكاء الاصطناعي على كل فريق بشكل صحيح في التقرير.",
          "ارفع ملف فيديو المباراة (يدعم MP4 و AVI و MOV).",
          "انقر على 'تحليل الفيديو' للكشف عن ألوان القمصان وإنشاء التقرير.",
          "يغطي التقرير كلا الفريقين: التشكيلات والنقاط القوية والضعيفة والتوصيات.",
          "يُعرض نص التقرير باللون الأسود لسهولة القراءة.",
        ],
        whoCanUse: "Coaches, Analysts, Admins",
        tip: "For best results, use a video where both teams are clearly visible and wearing distinct jersey colors.",
        tipAr: "للحصول على أفضل النتائج، استخدم فيديو يظهر فيه كلا الفريقين بوضوح ويرتديان ألوان قمصان مختلفة.",
      },
    ],
  },
  "team-management": {
    title: "Team Management",
    titleAr: "إدارة الفرق",
    description: "Create and manage teams, assign players, and organize your academy structure.",
    descriptionAr: "إنشاء وإدارة الفرق وتعيين اللاعبين وتنظيم هيكل الأكاديمية.",
    sections: [
      {
        title: "Creating a Team",
        titleAr: "إنشاء فريق",
        steps: [
          "Click '+ Create New Team' in the top right.",
          "Enter the team name, select the age group, and choose Main Team or Academy Team.",
          "Add an optional description and click 'Create Team'.",
        ],
        stepsAr: [
          "انقر على '+ إنشاء فريق جديد' في أعلى اليمين.",
          "أدخل اسم الفريق، واختر الفئة العمرية، وحدد الفريق الأول أو فريق الأكاديمية.",
          "أضف وصفاً اختيارياً وانقر على 'إنشاء الفريق'.",
        ],
        whoCanUse: "Admins only",
      },
      {
        title: "Assigning Players to a Team",
        titleAr: "تعيين اللاعبين للفريق",
        steps: [
          "On any team card, click 'Assign Players'.",
          "Search for players by name and select them from the list.",
          "Click 'Save' to confirm the assignment.",
        ],
        stepsAr: [
          "على أي بطاقة فريق، انقر على 'تعيين لاعبين'.",
          "ابحث عن اللاعبين بالاسم وحددهم من القائمة.",
          "انقر على 'حفظ' لتأكيد التعيين.",
        ],
        whoCanUse: "Admins, Coaches",
      },
      {
        title: "Assigning Staff (الجهاز الفني والإداري)",
        titleAr: "تعيين الطاقم الفني والإداري",
        steps: [
          "Go to Admin → Coach Assignment from the sidebar.",
          "Select the team, then choose the staff member and their role.",
          "Roles: Head Coach, Assistant Coach, Goalkeeper Coach, Fitness Coach, Analyst.",
          "All non-player users (coaches, admins, nutritionists) appear in the staff list.",
        ],
        stepsAr: [
          "اذهب إلى الإدارة ← تعيين المدربين من الشريط الجانبي.",
          "اختر الفريق، ثم اختر عضو الطاقم ودوره.",
          "الأدوار: المدرب الرئيسي، المساعد، مدرب الحراسة، مدرب اللياقة، المحلل.",
          "يظهر في القائمة جميع المستخدمين غير اللاعبين (مدربون، إداريون، أخصائيو تغذية).",
        ],
        whoCanUse: "Admins only",
        tip: "The Coach Assignment page is under Admin menu in the sidebar.",
        tipAr: "صفحة تعيين المدربين موجودة في قائمة الإدارة بالشريط الجانبي.",
      },
    ],
  },
  "nutrition": {
    title: "Nutrition & Meal Plans",
    titleAr: "التغذية وخطط الوجبات",
    description: "Create and manage personalized meal plans for players.",
    descriptionAr: "إنشاء وإدارة خطط وجبات مخصصة للاعبين.",
    sections: [
      {
        title: "Creating a Meal Plan",
        titleAr: "إنشاء خطة وجبات",
        steps: [
          "Click 'Create Meal Plan' and select a player.",
          "Choose a plan duration: Single Day, 1 Week, 2 Weeks, 1 Month, or 3 Months.",
          "For multi-day plans, the system creates breakfast, lunch, and dinner entries for each day.",
          "Fill in nutritional details (calories, protein, carbs, fats, hydration) and click 'Create Plan'.",
          "Long plans (1 month, 3 months) may take a moment to generate all entries.",
        ],
        stepsAr: [
          "انقر على 'إنشاء خطة وجبات' واختر لاعباً.",
          "اختر مدة الخطة: يوم واحد، أسبوع، أسبوعان، شهر، أو 3 أشهر.",
          "للخطط متعددة الأيام، يُنشئ النظام تلقائياً وجبات الإفطار والغداء والعشاء لكل يوم.",
          "أدخل التفاصيل الغذائية (السعرات، البروتين، الكربوهيدرات، الدهون، الترطيب) وانقر على 'إنشاء الخطة'.",
          "قد تستغرق الخطط الطويلة (شهر، 3 أشهر) لحظة لإنشاء جميع الإدخالات.",
        ],
        whoCanUse: "Nutritionists, Coaches, Admins",
        tip: "Use the date picker to view meal plans for any specific day.",
        tipAr: "استخدم منتقي التاريخ لعرض خطط الوجبات لأي يوم محدد.",
      },
    ],
  },
  "coach-assignment": {
    title: "Coach & Staff Assignment",
    titleAr: "تعيين المدربين والطاقم",
    description: "Assign coaches and staff members to teams with specific roles.",
    descriptionAr: "تعيين المدربين وأعضاء الطاقم للفرق بأدوار محددة.",
    sections: [
      {
        title: "How to assign staff",
        titleAr: "كيفية تعيين الطاقم",
        steps: [
          "Select a team from the dropdown at the top.",
          "Choose a staff member from the 'Select Coach/Staff' dropdown.",
          "Select their role (Head Coach, Assistant Coach, Goalkeeper Coach, Fitness Coach, Analyst).",
          "Toggle 'Primary Coach' if this person is the main coach for the team.",
          "Click 'Assign' to save.",
          "To remove an assignment, click the trash icon next to it.",
        ],
        stepsAr: [
          "اختر فريقاً من القائمة المنسدلة في الأعلى.",
          "اختر عضو الطاقم من قائمة 'اختر المدرب/الموظف'.",
          "حدد دوره (المدرب الرئيسي، المساعد، مدرب الحراسة، مدرب اللياقة، المحلل).",
          "فعّل 'المدرب الأساسي' إذا كان هذا الشخص هو المدرب الرئيسي للفريق.",
          "انقر على 'تعيين' للحفظ.",
          "لإزالة تعيين، انقر على أيقونة سلة المهملات بجانبه.",
        ],
        whoCanUse: "Admins only",
        tip: "All users with non-player roles appear in the staff list, including coaches, admins, and nutritionists.",
        tipAr: "يظهر في قائمة الطاقم جميع المستخدمين ذوو الأدوار غير اللاعبين، بما في ذلك المدربون والإداريون وأخصائيو التغذية.",
      },
    ],
  },
};

export function PageHelp({ pageKey }: { pageKey: string }) {
  const [open, setOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const { language } = useLanguage();
  const isAr = language === "ar";

  const helpData = PAGE_HELP_DATA[pageKey];
  if (!helpData) return null;

  const title = isAr ? helpData.titleAr : helpData.title;
  const description = isAr ? helpData.descriptionAr : helpData.description;

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        title={isAr ? "مساعدة" : "Help"}
        aria-label={isAr ? "مساعدة" : "Help"}
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            className="relative bg-background border border-border rounded-xl shadow-2xl w-full sm:w-[420px] max-h-[80vh] overflow-y-auto"
            dir={isAr ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-border sticky top-0 bg-background rounded-t-xl">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-semibold text-foreground">{title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sections */}
            <div className="p-4 space-y-3">
              {helpData.sections.map((section, idx) => (
                <div key={idx} className="border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                  >
                    <span className="font-medium text-sm text-foreground">
                      {isAr && section.titleAr ? section.titleAr : section.title}
                    </span>
                    {expandedSection === idx ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {expandedSection === idx && (
                    <div className="px-3 pb-3 border-t border-border space-y-3">
                      {/* Steps */}
                      {((isAr && section.stepsAr) ? section.stepsAr : section.steps)?.map((step, si) => (
                        <div key={si} className="flex gap-2 mt-2 text-sm text-foreground">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                            {si + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                      {/* Who can use */}
                      {section.whoCanUse && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {isAr ? "من يمكنه الاستخدام: " : "Who can use: "}
                            <span className="text-foreground">{section.whoCanUse}</span>
                          </span>
                        </div>
                      )}
                      {/* Tip */}
                      {(isAr && section.tipAr ? section.tipAr : section.tip) && (
                        <div className="flex items-start gap-1.5 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 mt-2">
                          <Zap className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-yellow-700 dark:text-yellow-300">
                            {isAr && section.tipAr ? section.tipAr : section.tip}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30 rounded-b-xl">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "تواصل مع المسؤول للحصول على مزيد من المساعدة."
                    : "Contact your administrator for further assistance."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Legacy default export for backward compatibility
export default function PageHelpLegacy({ title = "", description = "", sections = [], color = "red" }: PageHelpProps) {
  const [open, setOpen] = useState(false);

  const colorMap: Record<string, { btn: string; header: string }> = {
    red: { btn: "bg-red-700/20 hover:bg-red-700/40 text-red-600 dark:text-red-400 border-red-700/40", header: "bg-red-900/30 border-red-700/30" },
    blue: { btn: "bg-blue-700/20 hover:bg-blue-700/40 text-blue-600 dark:text-blue-400 border-blue-700/40", header: "bg-blue-900/30 border-blue-700/30" },
    green: { btn: "bg-green-700/20 hover:bg-green-700/40 text-green-700 dark:text-green-400 border-green-700/40", header: "bg-green-900/30 border-green-700/30" },
    purple: { btn: "bg-purple-700/20 hover:bg-purple-700/40 text-purple-600 dark:text-purple-400 border-purple-700/40", header: "bg-purple-900/30 border-purple-700/30" },
    orange: { btn: "bg-orange-700/20 hover:bg-orange-700/40 text-orange-700 dark:text-orange-400 border-orange-700/40", header: "bg-orange-900/30 border-orange-700/30" },
  };
  const c = colorMap[color] || colorMap.red;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${c.btn}`}
        title="How to use this page"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Help
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className={`p-5 border-b ${c.header} rounded-t-2xl`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-foreground font-bold text-base">{title}</h2>
                    <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed">{description}</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {sections.map((section, idx) => (
                <div key={idx} className="bg-muted/60 rounded-xl p-4 border border-border/50">
                  <h3 className="text-foreground font-semibold text-sm mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    {section.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-2">{section.description}</p>
                  {section.steps && section.steps.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {section.steps.map((step, si) => (
                        <div key={si} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{si + 1}</span>
                          <span className="text-muted-foreground text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.whoCanUse && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Who can use: <span className="text-muted-foreground">{section.whoCanUse}</span></span>
                    </div>
                  )}
                  {section.tip && (
                    <div className="mt-2 flex items-start gap-1.5 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-2">
                      <Zap className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-yellow-700 dark:text-yellow-300">{section.tip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <div className="bg-muted/40 rounded-xl p-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">Need more help? Contact your system administrator or refer to the academy training manual.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
