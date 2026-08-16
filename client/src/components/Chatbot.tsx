import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { 
  MessageCircle, X, Send, Bot, User, Loader2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Chatbot() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: qaPool = [] } = trpc.chatbotQA.getActive.useQuery();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: '1',
        role: 'assistant',
        content: isRTL 
          ? 'مرحباً! أنا مساعد أكاديمية فيوتشر ستارز. كيف يمكنني مساعدتك اليوم؟ يمكنني الإجابة على أسئلتك حول:\n\n• التسجيل والأسعار\n• جداول التدريب\n• الفئات العمرية\n• المدربين والمرافق\n• الفعاليات والبطولات'
          : "Hello! I'm the Future Stars Academy assistant. How can I help you today? I can answer questions about:\n\n• Registration & Pricing\n• Training Schedules\n• Age Groups\n• Coaches & Facilities\n• Events & Tournaments",
        timestamp: new Date()
      }]);
    }
  }, [isOpen, isRTL]);

  const getResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    // Check dynamic Q&A pool first
    if (qaPool.length > 0) {
      for (const qa of qaPool) {
        const keywords = (qa.keywords || '').split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
        const questionWords = qa.question.toLowerCase().split(/\s+/);
        const allTerms = [...keywords, ...questionWords];
        const matchScore = allTerms.filter(term => term.length > 2 && lowerMessage.includes(term)).length;
        if (matchScore >= 2 || (keywords.length > 0 && keywords.some(k => k.length > 3 && lowerMessage.includes(k)))) {
          return qa.answer;
        }
      }
    }
    
    // Pricing questions
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('سعر') || lowerMessage.includes('تكلفة') || lowerMessage.includes('اسعار')) {
      return isRTL 
        ? 'أسعارنا:\n• شهري: 1,250 جنيه\n• 3 أشهر: 3,000 جنيه (وفر 750)\n• 6 أشهر: 5,000 جنيه (وفر 2,500)\n• سنوي: 9,000 جنيه (وفر 6,000)\n\nالأسعار لا تشمل الزي الرياضي أو الفعاليات الخاصة. هل تريد معرفة المزيد؟'
        : 'Our pricing:\n• Monthly: 1,250 EGP\n• 3 Months: 3,000 EGP (Save 750)\n• 6 Months: 5,000 EGP (Save 2,500)\n• Annual: 9,000 EGP (Save 6,000)\n\nPrices exclude football kits and special events. Would you like to know more?';
    }
    
    // Registration questions
    if (lowerMessage.includes('register') || lowerMessage.includes('join') || lowerMessage.includes('تسجيل') || lowerMessage.includes('انضمام')) {
      return isRTL
        ? 'للتسجيل في الأكاديمية:\n1. قم بزيارة صفحة التسجيل\n2. اختر الفئة العمرية المناسبة\n3. أكمل نموذج التسجيل\n4. احضر جلسة التجربة المجانية\n\nهل تريد أن أساعدك في التسجيل؟'
        : 'To register at the academy:\n1. Visit our registration page\n2. Select the appropriate age group\n3. Complete the registration form\n4. Attend a free trial session\n\nWould you like me to help you with registration?';
    }
    
    // Schedule questions
    if (lowerMessage.includes('schedule') || lowerMessage.includes('time') || lowerMessage.includes('جدول') || lowerMessage.includes('موعد') || lowerMessage.includes('وقت')) {
      return isRTL
        ? 'جداول التدريب حسب الفئة العمرية:\n• تحت 8: السبت والثلاثاء 4-5:30 مساءً\n• تحت 10: الأحد والأربعاء 4-5:30 مساءً\n• تحت 12: الاثنين والخميس 5-7 مساءً\n• تحت 14: السبت والثلاثاء والخميس 5-7:30 مساءً\n• تحت 16: يومياً ما عدا الجمعة 4-7 مساءً'
        : 'Training schedules by age group:\n• U-8: Sat & Tue 4-5:30 PM\n• U-10: Sun & Wed 4-5:30 PM\n• U-12: Mon & Thu 5-7 PM\n• U-14: Sat, Tue & Thu 5-7:30 PM\n• U-16: Daily except Fri 4-7 PM';
    }
    
    // Age groups
    if (lowerMessage.includes('age') || lowerMessage.includes('عمر') || lowerMessage.includes('سن') || lowerMessage.includes('فئة')) {
      return isRTL
        ? 'الفئات العمرية المتاحة:\n• تحت 8 سنوات (6-8)\n• تحت 10 سنوات (8-10)\n• تحت 12 سنة (10-12)\n• تحت 14 سنة (12-14)\n• تحت 16 سنة (14-16)\n\nكل فئة لها برنامج تدريبي مخصص. ما هو عمر طفلك؟'
        : 'Available age groups:\n• Under 8 (6-8 years)\n• Under 10 (8-10 years)\n• Under 12 (10-12 years)\n• Under 14 (12-14 years)\n• Under 16 (14-16 years)\n\nEach group has a customized training program. What is your child\'s age?';
    }
    
    // Location
    if (lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('address') || lowerMessage.includes('موقع') || lowerMessage.includes('عنوان') || lowerMessage.includes('اين')) {
      return isRTL
        ? 'موقعنا: ذا سكوير كومباوند، التجمع الخامس، القاهرة الجديدة\n\nنحن في قلب القاهرة الجديدة مع مرافق تدريب حديثة. يمكنك العثور علينا بسهولة عبر خرائط جوجل.'
        : 'Our location: The Square Compound, 5th Settlement, New Cairo\n\nWe\'re in the heart of New Cairo with modern training facilities. You can easily find us on Google Maps.';
    }
    
    // Contact
    if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('whatsapp') || lowerMessage.includes('تواصل') || lowerMessage.includes('هاتف') || lowerMessage.includes('واتساب')) {
      return isRTL
        ? 'للتواصل معنا:\n• واتساب: اضغط على زر الواتساب الأخضر\n• صفحة التواصل: /contact\n• زيارة الأكاديمية: ذا سكوير كومباوند، القاهرة الجديدة\n\nفريقنا متاح للرد على استفساراتكم!'
        : 'Contact us:\n• WhatsApp: Click the green WhatsApp button\n• Contact page: /contact\n• Visit: The Square Compound, New Cairo\n\nOur team is available to answer your questions!';
    }
    
    // Trial
    if (lowerMessage.includes('trial') || lowerMessage.includes('try') || lowerMessage.includes('تجربة') || lowerMessage.includes('اختبار')) {
      return isRTL
        ? 'نعم! نقدم جلسة تجربة مجانية لجميع اللاعبين الجدد.\n\nخلال الجلسة:\n• تقييم مستوى اللاعب\n• التعرف على المدربين\n• تجربة أسلوب التدريب\n\nللحجز، تواصل معنا عبر الواتساب أو صفحة التواصل.'
        : 'Yes! We offer a free trial session for all new players.\n\nDuring the session:\n• Player level assessment\n• Meet the coaches\n• Experience our training style\n\nTo book, contact us via WhatsApp or the contact page.';
    }
    
    // Default response
    return isRTL
      ? 'شكراً لسؤالك! للحصول على معلومات أكثر تفصيلاً، يمكنك:\n• زيارة صفحة الأسعار\n• التواصل معنا عبر الواتساب\n• ملء نموذج التواصل\n\nهل هناك شيء آخر يمكنني مساعدتك به؟'
      : 'Thanks for your question! For more detailed information, you can:\n• Visit our pricing page\n• Contact us via WhatsApp\n• Fill out the contact form\n\nIs there anything else I can help you with?';
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = getResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 ${isRTL ? 'left-6' : 'right-6'} z-50 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-100px)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-card to-background text-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                <Bot className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {isRTL ? 'مساعد فيوتشر ستارز' : 'Future Stars FC Assistant'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'متصل الآن' : 'Online now'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-gold text-foreground' 
                      : 'bg-card text-foreground'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gold text-foreground'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-card text-foreground flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
                className="flex-1"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className="bg-card hover:bg-muted"
              >
                <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
