import { StreakTracker } from '@/components/StreakTracker';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


export default function StreakPage() {
  const { t, language } = useLanguage();
  const [, navigate] = useLocation();
  return (
    <>
    <div className="container py-8">
      <div className="mb-6">

        <BackButton />
<h1 className="text-3xl font-bold mb-2">Daily Login Streak 🔥</h1>
        <p className="text-muted-foreground">
          Log in every day to maintain your streak and earn rewards!
        </p>
      </div>

      <StreakTracker />
    </div>
    </>
  );
}
