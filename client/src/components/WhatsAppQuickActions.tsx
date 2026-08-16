import { MessageCircle, Calendar, DollarSign, UserPlus, MapPin, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const WHATSAPP_NUMBER = "201004186970";

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  labelEn: string;
  labelAr: string;
  messageEn: string;
  messageAr: string;
}

const quickActions: QuickAction[] = [
  {
    id: "trial",
    icon: <Calendar className="w-5 h-5" />,
    labelEn: "Schedule a Trial",
    labelAr: "حجز تجربة",
    messageEn: "Hello! I'd like to schedule a trial session for my child at Future Stars Academy. What dates are available?",
    messageAr: "مرحباً! أود حجز جلسة تجريبية لطفلي في أكاديمية Future Stars Academy. ما هي المواعيد المتاحة؟"
  },
  {
    id: "pricing",
    icon: <DollarSign className="w-5 h-5" />,
    labelEn: "Ask About Pricing",
    labelAr: "الاستفسار عن الأسعار",
    messageEn: "Hello! I'm interested in learning about the membership plans and pricing at Future Stars Academy. Can you share the details?",
    messageAr: "مرحباً! أنا مهتم بمعرفة خطط العضوية والأسعار في أكاديمية Future Stars Academy. هل يمكنكم مشاركة التفاصيل؟"
  },
  {
    id: "register",
    icon: <UserPlus className="w-5 h-5" />,
    labelEn: "Register My Child",
    labelAr: "تسجيل طفلي",
    messageEn: "Hello! I want to register my child at Future Stars Academy. What are the requirements and next steps?",
    messageAr: "مرحباً! أريد تسجيل طفلي في أكاديمية Future Stars Academy. ما هي المتطلبات والخطوات التالية؟"
  },
  {
    id: "visit",
    icon: <MapPin className="w-5 h-5" />,
    labelEn: "Visit the Academy",
    labelAr: "زيارة الأكاديمية",
    messageEn: "Hello! I'd like to visit Future Stars Academy to see the facilities. When can I schedule a visit?",
    messageAr: "مرحباً! أود زيارة أكاديمية Future Stars Academy لرؤية المرافق. متى يمكنني تحديد موعد للزيارة؟"
  },
  {
    id: "general",
    icon: <HelpCircle className="w-5 h-5" />,
    labelEn: "General Inquiry",
    labelAr: "استفسار عام",
    messageEn: "Hello! I have a question about Future Stars Academy.",
    messageAr: "مرحباً! لدي سؤال حول أكاديمية Future Stars Academy."
  }
];

interface WhatsAppQuickActionsProps {
  className?: string;
  variant?: 'grid' | 'list' | 'compact';
  showTitle?: boolean;
  actions?: string[]; // Filter to show only specific actions by id
}

export default function WhatsAppQuickActions({
  className = "",
  variant = 'grid',
  showTitle = true,
  actions
}: WhatsAppQuickActionsProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const filteredActions = actions 
    ? quickActions.filter(action => actions.includes(action.id))
    : quickActions;

  const getWhatsAppUrl = (action: QuickAction) => {
    const message = isRTL ? action.messageAr : action.messageEn;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const containerClasses = {
    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3",
    list: "flex flex-col gap-2",
    compact: "flex flex-wrap gap-2"
  };

  const buttonClasses = {
    grid: "flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-[#25D366] transition-all duration-300 group",
    list: "flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-[#25D366] transition-all duration-300 group",
    compact: "flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-card hover:bg-[#25D366] hover:text-foreground hover:border-[#25D366] transition-all duration-300 text-sm"
  };

  return (
    <div className={className}>
      {showTitle && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-[#25D366] mb-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">
              {isRTL ? 'تواصل معنا عبر واتساب' : 'Quick Contact via WhatsApp'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isRTL 
              ? 'اختر موضوع استفسارك للتواصل السريع'
              : 'Select your inquiry topic for quick assistance'}
          </p>
        </div>
      )}
      
      <div className={containerClasses[variant]}>
        {filteredActions.map((action) => (
          <a
            key={action.id}
            href={getWhatsAppUrl(action)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses[variant]}
          >
            <span className={`${variant === 'compact' ? '' : 'text-[#25D366] group-hover:scale-110 transition-transform'}`}>
              {action.icon}
            </span>
            <span className={`font-medium ${variant === 'grid' ? 'text-center text-sm' : ''}`}>
              {isRTL ? action.labelAr : action.labelEn}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

// Export individual quick action button for use in specific contexts
interface WhatsAppQuickActionButtonProps {
  actionId: 'trial' | 'pricing' | 'register' | 'visit' | 'general';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function WhatsAppQuickActionButton({
  actionId,
  size = 'md',
  showIcon = true,
  className = ""
}: WhatsAppQuickActionButtonProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const action = quickActions.find(a => a.id === actionId);
  if (!action) return null;

  const message = isRTL ? action.messageAr : action.messageEn;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center rounded-lg font-medium bg-[#25D366] hover:bg-[#20BD5A] text-white transition-all duration-300 ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <span className={iconSizes[size]}>{action.icon}</span>}
      <span>{isRTL ? action.labelAr : action.labelEn}</span>
    </a>
  );
}
