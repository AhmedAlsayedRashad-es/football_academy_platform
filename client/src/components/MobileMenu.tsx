import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, Calendar, Users, Trophy, DollarSign, Phone, LogIn, LayoutDashboard, User, Gift, Video, Lightbulb, Globe, Dumbbell } from 'lucide-react';
import LanguageToggle from './LanguageToggle';

interface MobileMenuProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export function MobileMenu({ isLoggedIn, userName }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Public navigation items (always visible)
  const publicNavItems = [
    { href: '/', label: isRTL ? 'الرئيسية' : 'Home', icon: Home },
    { href: '/#features', label: t('nav.features'), icon: Trophy },
    { href: '/#gallery', label: t('nav.gallery'), icon: Users },
    { href: '/events', label: t('nav.events'), icon: Calendar },
    { href: '/pricing', label: t('nav.pricing'), icon: DollarSign },
    { href: '/team', label: t('nav.team'), icon: Users },
    { href: '/contact', label: t('nav.contact'), icon: Phone },
    { href: '/parent-portal', label: isRTL ? 'بوابة الوالدين' : 'Parent Portal', icon: Users },
  ];
  
  // Authenticated navigation items (only when logged in)
  const authenticatedNavItems = [
    { href: '/team-players', label: isRTL ? 'فرق الأكاديمية' : 'Academy Teams', icon: Users },
    { href: '/player-dashboard', label: isRTL ? 'لوحة اللاعب' : 'Player Dashboard', icon: User },
    { href: '/rewards', label: isRTL ? 'المكافآت' : 'Rewards', icon: Gift },
    { href: '/video-analysis', label: isRTL ? 'تحليل الفيديو' : 'Video Analysis', icon: Video },
    { href: '/explore', label: isRTL ? 'استكشف' : 'Explore', icon: Lightbulb },
    { href: '/training-library', label: isRTL ? 'مكتبة التمارين' : 'Training Library', icon: Dumbbell },
    { href: '/talent-portal', label: isRTL ? 'بوابة المواهب' : 'Talent Portal', icon: Globe },
  ];
  
  // Combine nav items based on login status
  const navItems = isLoggedIn ? [...publicNavItems, ...authenticatedNavItems] : publicNavItems;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-50"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-gray-700 dark:text-gray-200" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700 dark:text-gray-200" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-80 max-w-[85vw] bg-white dark:bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen 
            ? 'translate-x-0' 
            : isRTL 
              ? '-translate-x-full' 
              : 'translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10 w-10" />
            <span className="font-bold text-foreground dark:text-white">Future Stars Academy</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* User Info */}
        {isLoggedIn && userName && (
          <div className="p-4 bg-muted dark:bg-card border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              {isRTL ? 'مرحباً' : 'Welcome'}
            </p>
            <p className="font-semibold text-foreground dark:text-white">{userName}</p>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-muted dark:bg-card text-foreground dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-background">
          <div className="flex items-center justify-between mb-4">
            <LanguageToggle />
          </div>
          
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button className="w-full bg-background hover:bg-card text-foreground">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button className="w-full bg-gold hover:bg-gold text-foreground">
                <LogIn className="h-4 w-4 mr-2" />
                {isRTL ? 'سجل الآن' : 'Register Now'}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

export default MobileMenu;
