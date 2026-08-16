import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const WHATSAPP_NUMBER = "201004186970"; // Future Stars Academy WhatsApp

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  messageAr?: string;
}

// Floating WhatsApp button (bottom-right corner)
export default function WhatsAppButton({ 
  phoneNumber = WHATSAPP_NUMBER,
  message = "Hello! I'm interested in Future Stars Academy. Can you provide more information?",
  messageAr = "مرحباً! أنا مهتم بأكاديمية Future Stars Academy. هل يمكنكم تزويدي بمزيد من المعلومات؟"
}: WhatsAppButtonProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const finalMessage = isRTL ? messageAr : message;
  const encodedMessage = encodeURIComponent(finalMessage);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-7 h-7 fill-current" />
      
      {/* Tooltip */}
      <span className={`absolute ${isRTL ? 'left-full ml-3' : 'right-full mr-3'} px-3 py-2 bg-foreground text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none`}>
        {isRTL ? 'تواصل معنا عبر واتساب' : 'Chat with us on WhatsApp'}
      </span>
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
    </a>
  );
}

// Inline WhatsApp button for use in pages
interface WhatsAppInlineButtonProps {
  phoneNumber?: string;
  message?: string;
  messageAr?: string;
  label?: string;
  labelAr?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline';
}

export function WhatsAppInlineButton({
  phoneNumber = WHATSAPP_NUMBER,
  message = "Hello! I'm interested in Future Stars Academy. Can you provide more information?",
  messageAr = "مرحباً! أنا مهتم بأكاديمية Future Stars Academy. هل يمكنكم تزويدي بمزيد من المعلومات؟",
  label = "Chat on WhatsApp",
  labelAr = "تواصل عبر واتساب",
  className = "",
  size = 'md',
  variant = 'solid'
}: WhatsAppInlineButtonProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const finalMessage = isRTL ? messageAr : message;
  const finalLabel = isRTL ? labelAr : label;
  const encodedMessage = encodeURIComponent(finalMessage);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    solid: 'bg-[#25D366] hover:bg-[#20BD5A] text-white',
    outline: 'border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-foreground'
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-300 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <MessageCircle className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
      {finalLabel}
    </a>
  );
}

// WhatsApp link for footer or text areas
interface WhatsAppLinkProps {
  phoneNumber?: string;
  message?: string;
  messageAr?: string;
  children?: React.ReactNode;
  className?: string;
}

export function WhatsAppLink({
  phoneNumber = WHATSAPP_NUMBER,
  message = "Hello! I'm interested in Future Stars Academy.",
  messageAr = "مرحباً! أنا مهتم بأكاديمية Future Stars Academy.",
  children,
  className = ""
}: WhatsAppLinkProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const finalMessage = isRTL ? messageAr : message;
  const encodedMessage = encodeURIComponent(finalMessage);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-[#25D366] hover:underline ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      {children || (isRTL ? '+20 100 418 6970' : '+20 100 418 6970')}
    </a>
  );
}
