import { useState, useEffect } from 'react';
import Chatbot from '@/components/Chatbot';
import { Link, useLocation } from 'wouter';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const NAV_LINKS = ['Home','Features','Gallery','News','Pricing','Testimonials','Enroll','Contact'];

// Academy team photos — real photos from the Stars Academy (Egyptian Stars Championship)
const HERO_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/_DSC3607_9717f7f3.webp';
const ACADEMY_PHOTO_1 = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/645416912_1361634609317606_6269294764819225093_n_9b0e89c3.jpg';
const ACADEMY_PHOTO_2 = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/645500313_1361631912651209_2241632664693131871_n_42ba55cd.jpg';
const STADIUM_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/656086811_1380857347395332_8464477083659316272_n_ac7a3c75.jpg';
const FIELD_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/ea162d51-50b1-4c54-a51e-9daae3b69036_fa76c5bf.jpg';
const COACH_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/646935491_1361633929317674_551292786635891851_n_beaca805.jpg';
const YOUTH_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/_DSC1951_0f67c08c.webp';
const COACH_DIRECTING = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/644218157_1361633249317742_6480002850924410596_n_e1c7bb3a.jpg';
const BEST_PLAYER_AWARD = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/655857068_1380857450728655_7610104573536396946_n_5c50ae03.jpg';
const MEDAL_WITH_COACH = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/656174529_1380857054062028_966486968491683669_n_aa234720.jpg';
const MEDAL_CEREMONY = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/654946875_1380856957395371_8300668602372635608_n_af021757.jpg';
const ACADEMY_TEAM_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/academy-team-photo_1779d745.jpg';
const ACADEMY_TRAINING_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/academy-training-photo_f448e066.jpg';
const ACADEMY_VIDEO_1 = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/academy-video1_5146e227.mp4';
const ACADEMY_VIDEO_2 = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/academy-video2_d93081c7.mp4';
// New media — Apr 2026
const TEAM_PHOTO_NEW_1 = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/5980967093731969141(1)_58984ef0.jpg';
const TEAM_PHOTO_NEW_2 = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/b77066c1-11b8-4798-acb0-ae5d3b971ce0_f837f4be.jpg';
const TRAINING_VIDEO_NEW = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031075609/WH9WgP4dQPFH4Fcti7mkSc/WhatsAppVideo2025-10-10at3.26.20PM_7c2b93f1.mp4';

// Ordered gallery photo list for lightbox navigation
const GALLERY_PHOTOS = [
  { src: ACADEMY_PHOTO_1, label: 'Academy Players in Match Action', tag: 'ESC Championship' },
  { src: ACADEMY_PHOTO_2, label: 'Competitive Match Play', tag: 'Match Day' },
  { src: FIELD_PHOTO, label: 'Official Team Photo', tag: 'Team' },
  { src: ACADEMY_TRAINING_PHOTO, label: 'Academy Training Session', tag: 'Training' },
  { src: COACH_PHOTO, label: 'Coach & Player Moments', tag: 'Coaching' },
  { src: STADIUM_PHOTO, label: 'Championship Celebrations', tag: 'Achievements' },
  { src: YOUTH_PHOTO, label: 'Youth Team Training', tag: 'Training' },
  { src: COACH_DIRECTING, label: 'Coach Directing from Sideline', tag: 'Coaching' },
  { src: MEDAL_CEREMONY, label: 'Medal Presentation Ceremony', tag: 'ESC Ceremony' },
  { src: BEST_PLAYER_AWARD, label: 'Best Player of the Tournament', tag: 'Best Player' },
  { src: MEDAL_WITH_COACH, label: 'Coach with Medal Winners', tag: 'Ceremony' },
  { src: TEAM_PHOTO_NEW_1, label: 'Academy Team with Coaches — Etisalat Kit', tag: 'Team' },
  { src: TEAM_PHOTO_NEW_2, label: 'Young Stars — Training Session', tag: 'Training' },
];

export default function Home() {
  const { t, language } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const openLightbox = (src: string) => {
    const idx = GALLERY_PHOTOS.findIndex(p => p.src === src);
    setLightboxIdx(idx >= 0 ? idx : 0);
  };
  const closeLightbox = () => setLightboxIdx(null);
  const prevPhoto = () => setLightboxIdx(i => i === null ? null : (i - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length);
  const nextPhoto = () => setLightboxIdx(i => i === null ? null : (i + 1) % GALLERY_PHOTOS.length);

  const HERO_SLIDES = [
    {
      image: HERO_PHOTO,
      subtitle: 'Egyptian Stars Championship',
      title: 'Future Stars Football',
      titleAccent: 'Academy',
      desc: "Developing Egypt's next generation of football champions through world-class training, advanced technology, and professional coaching.",
    },
    {
      image: '/manus-storage/stadium-hero_850ccdcb.jpg',
      subtitle: 'Future Stars Academy',
      title: 'World-Class',
      titleAccent: 'Facilities',
      desc: 'Train at world-class facilities designed to develop the next generation of Egyptian football champions.',
    },
    {
      image: ACADEMY_PHOTO_1,
      subtitle: 'Match Experience',
      title: 'Compete at the',
      titleAccent: 'Highest Level',
      desc: 'Our players compete in official tournaments including the Egyptian Stars Championship, gaining real match experience from an early age.',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? (i + 1) % GALLERY_PHOTOS.length : null);
      if (e.key === 'ArrowLeft') setLightboxIdx(i => i !== null ? (i - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length : null);
      if (e.key === 'Escape') setLightboxIdx(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIdx]);

  const [darkMode, setDarkMode] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
  const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } };
  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setContactSent(true);
      toast.success('Message sent successfully! We will contact you within 24 hours.');
    },
    onError: (err) => {
      toast.error('Failed to send message. Please try again.');
    },
  });
  const { data: dbTestimonials = [] } = trpc.testimonials.getApproved.useQuery();
  const FALLBACK_TESTIMONIALS = [
    { testimonial: "Future Stars Academy transformed my son's football skills. The coaches are professional and truly care about each player's development.", name: 'Fatima Ahmed', role: 'Parent', rating: 5 },
    { testimonial: "Excellent facilities and world-class coaching. My daughter has improved tremendously and gained confidence both on and off the pitch.", name: 'Mohamed Hassan', role: 'Parent', rating: 5 },
    { testimonial: "The best football academy in Egypt. Professional staff, modern training methods, and a real pathway to professional football.", name: 'Layla Ibrahim', role: 'Parent', rating: 5 },
  ];
  const displayTestimonials = dbTestimonials.length > 0 ? dbTestimonials.slice(0, 6) : FALLBACK_TESTIMONIALS;
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const user = meQuery.data ?? null;
  const [, navigate] = useLocation();

  const bg = darkMode ? '#0d1117' : '#ffffff';
  const text = darkMode ? '#f0f0f0' : '#1a1a1a';
  const muted = darkMode ? '#9ca3af' : '#6b7280';
  const cardBg = darkMode ? '#161b22' : '#f9fafb';
  const border = darkMode ? '#30363d' : '#e5e7eb';
  const RED = '#8B0000';
  const GOLD = '#D4AF37';
  const DARK_NAV = '#111827';

  const pricingPlans = [
    {
      name: 'Monthly',
      nameAr: 'شهري',
      price: 900,
      period: 'month',
      duration: '1 Month',
      icon: '⚡',
      color: '#2563eb',
      popular: false,
      features: ['3 sessions/week', 'Basic performance tracking', 'Group training', 'Parent portal access', 'Player profile card'],
    },
    {
      name: 'Quarterly',
      nameAr: 'ربع سنوي',
      price: 2400,
      period: '3 months',
      duration: '3 Months',
      icon: '⭐',
      color: '#7c3aed',
      popular: false,
      savings: 'Save EGP 300 — 11% off',
      features: ['4 sessions/week', 'Performance analytics', 'Group + private training', 'Parent portal access', 'Monthly progress report', 'Skills radar chart'],
    },
    {
      name: 'Semi-Annual',
      nameAr: 'نصف سنوي',
      price: 4200,
      period: '6 months',
      duration: '6 Months',
      icon: '🏆',
      color: RED,
      popular: true,
      savings: 'Save EGP 1,200 — Most Popular',
      features: ['5 sessions/week', 'Advanced AI analytics', 'Group + private training', 'Parent portal access', 'Bi-weekly progress report', 'Nutrition guidance', 'Mental coaching', 'AI video analysis'],
    },
    {
      name: 'Annual',
      nameAr: 'سنوي',
      price: 7500,
      period: 'year',
      duration: '12 Months',
      icon: '👑',
      color: GOLD,
      popular: false,
      savings: 'Save EGP 3,300 — Best Value',
      features: ['Unlimited sessions', 'Full AI performance suite', 'Private + group training', 'Parent portal access', 'Weekly progress report', 'Nutrition + mental coaching', 'Scholarship evaluation', 'Priority match selection', 'GPS performance tracking'],
    },
  ];

  const newsItems = [
    {
      category: 'Achievements',
      categoryColor: '#16a34a',
      date: 'January 5, 2026',
      title: 'Stars Academy Wins Egyptian Stars Championship',
      desc: 'Our academy players claimed first place at the Egyptian Stars Championship, defeating top academies from across Egypt in an unforgettable final.',
      image: STADIUM_PHOTO,
      link: '/matches',
    },
    {
      category: 'Matches',
      categoryColor: '#2563eb',
      date: 'January 3, 2026',
      title: 'Intense Match Action at ESC Tournament',
      desc: 'Academy players delivered outstanding performances in the Egyptian Stars Championship, showcasing their technical skills and competitive spirit.',
      image: ACADEMY_PHOTO_1,
      link: '/matches',
    },
    {
      category: 'Community',
      categoryColor: '#7c3aed',
      date: 'January 1, 2026',
      title: 'Coach & Player Bond: The Heart of Our Academy',
      desc: 'Our coaching staff builds strong personal connections with every player, providing mentorship both on and off the pitch.',
      image: COACH_PHOTO,
      link: '/forum',
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", backgroundColor: bg, color: text, margin: 0, padding: 0 }}>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        backgroundColor: DARK_NAV,
        boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
        height: '64px', display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <img
              src="/logo-transparent.png"
              alt="Future Stars Academy"
              style={{ width: '46px', height: '46px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px', lineHeight: 1.1 }}>Future Stars</div>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: '11px', letterSpacing: '1px' }}>ACADEMY</div>
            </div>
          </div>

          {/* Desktop Nav — hidden on mobile */}
          <div className="ahly-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'nowrap', overflow: 'hidden' }}>
            {NAV_LINKS.map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} style={{
                color: '#d1d5db', fontSize: '12px', fontWeight: 500,
                padding: '6px 8px', borderRadius: '6px', textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = '#fff'; (e.target as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = '#d1d5db'; (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
              >{link}</a>
            ))}
            <button onClick={() => setDarkMode(!darkMode)} style={{
              background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px', padding: '6px', flexShrink: 0,
            }}>{darkMode ? '☀️' : '🌙'}</button>
            <button
              onClick={() => {
                if (user) { navigate('/dashboard'); }
                else { try { (window.top || window).location.href = getLoginUrl(); } catch { window.open(getLoginUrl(), '_top'); } }
              }}
              style={{ backgroundColor: GOLD, color: '#000', fontWeight: 700, fontSize: '12px', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
            >{user ? 'Dashboard' : 'Login'}</button>
          </div>
          {/* Mobile Hamburger — visible on mobile only */}
          <button className="ahly-mobile-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '26px', cursor: 'pointer', padding: '4px', display: 'none' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div style={{ position: 'absolute', top: '64px', left: 0, right: 0, backgroundColor: DARK_NAV, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 999 }}>
            {NAV_LINKS.map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                style={{ color: '#d1d5db', fontSize: '15px', fontWeight: 500, padding: '12px 0', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {link}
              </a>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', flex: 1 }}>{darkMode ? 'Light' : 'Dark'}</button>
              <button onClick={() => { setMenuOpen(false); if (user) { navigate('/dashboard'); } else { try { (window.top || window).location.href = getLoginUrl(); } catch { window.open(getLoginUrl(), '_top'); } } }}
                style={{ backgroundColor: GOLD, color: '#000', fontWeight: 700, fontSize: '14px', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', flex: 2 }}>
                {user ? 'Dashboard' : 'Login'}
              </button>
            </div>
          </div>
        )}
      </nav>
      {/* Mobile responsiveness styles */}
      <style>{`
        @media (max-width: 768px) {
          .ahly-desktop-nav { display: none !important; }
          .ahly-mobile-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .ahly-mobile-btn { display: none !important; }
        }
      `}</style>

      {/* ===== HERO SECTION (SLIDER) ===== */}
      <section id="home" style={{
        position: 'relative', width: '100%', height: '100vh', minHeight: '600px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Autoplay muted video background (only on first slide) */}
        <video
          key={heroSlide === 0 ? 'hero-video' : 'hidden'}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: heroSlide === 0 ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            zIndex: 0,
          }}
        >
          <source src={ACADEMY_VIDEO_1} type="video/mp4" />
        </video>

        {/* Slide backgrounds (photos for slides 1 and 2) */}
        {HERO_SLIDES.map((slide, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${slide.image})`,
            backgroundSize: 'cover', backgroundPosition: 'center center',
            opacity: heroSlide === i && i !== 0 ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
          }} />
        ))}

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)',
          zIndex: 1,
        }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: '800px' }}>
          <div style={{
            display: 'inline-block', backgroundColor: RED, color: '#fff',
            fontSize: '12px', fontWeight: 700, letterSpacing: '2px',
            padding: '6px 16px', borderRadius: '20px', marginBottom: '24px',
            textTransform: 'uppercase',
          }}>⚽ {HERO_SLIDES[heroSlide].subtitle}</div>

          <h1 style={{
            color: '#ffffff', fontWeight: 900, fontSize: 'clamp(36px, 6vw, 72px)',
            lineHeight: 1.1, marginBottom: '20px', textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            {HERO_SLIDES[heroSlide].title}<br />
            <span style={{ color: GOLD }}>{HERO_SLIDES[heroSlide].titleAccent}</span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(15px, 2vw, 20px)',
            marginBottom: '40px', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 40px',
          }}>
            {HERO_SLIDES[heroSlide].desc}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <a href="#enroll" style={{
              backgroundColor: RED, color: '#fff', fontWeight: 700, fontSize: '15px',
              padding: '14px 32px', borderRadius: '8px', textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(139,0,0,0.5)',
            }}>Get Started</a>
            <a href="#features" style={{
              backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: '15px',
              padding: '14px 32px', borderRadius: '8px', textDecoration: 'none',
              border: '2px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)',
            }}>Learn More</a>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/register" style={{
              backgroundColor: GOLD, color: '#000', fontWeight: 700, fontSize: '14px',
              padding: '12px 28px', borderRadius: '8px', textDecoration: 'none',
            }}>Register as Parent</a>
            <a href="/register" style={{
              backgroundColor: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '14px',
              padding: '12px 28px', borderRadius: '8px', textDecoration: 'none',
            }}>Register as Player</a>
            <a href="/coach-registration" style={{
              backgroundColor: '#059669', color: '#fff', fontWeight: 700, fontSize: '14px',
              padding: '12px 28px', borderRadius: '8px', textDecoration: 'none',
            }}>Join as Coach</a>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
            <a href="/api/guest-login?role=admin" style={{
              backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '13px',
              padding: '10px 24px', borderRadius: '8px', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)',
            }}>Try Demo (Admin)</a>
            <a href="/api/guest-login?role=coach" style={{
              backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '13px',
              padding: '10px 24px', borderRadius: '8px', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)',
            }}>Try Demo (Coach)</a>
            <a href="/api/guest-login?role=parent" style={{
              backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '13px',
              padding: '10px 24px', borderRadius: '8px', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)',
            }}>Try Demo (Parent)</a>
          </div>
        </div>

        {/* Slider dots */}
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 3 }}>
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setHeroSlide(i)} style={{
              width: heroSlide === i ? '28px' : '10px', height: '10px',
              borderRadius: '5px', border: 'none', cursor: 'pointer',
              backgroundColor: heroSlide === i ? GOLD : 'rgba(255,255,255,0.5)',
              transition: 'all 0.3s ease', padding: 0,
            }} />
          ))}
        </div>

        {/* Prev arrow */}
        <button onClick={() => setHeroSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} style={{
          position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
          zIndex: 3, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', width: '44px', height: '44px', borderRadius: '50%',
          fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>

        {/* Next arrow */}
        <button onClick={() => setHeroSlide(prev => (prev + 1) % HERO_SLIDES.length)} style={{
          position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
          zIndex: 3, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', width: '44px', height: '44px', borderRadius: '50%',
          fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>›</button>
      </section>

      {/* ===== STATS BAR ===== */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        style={{ backgroundColor: RED, padding: '32px 24px' }}
      >
        <style>{`@media (max-width: 640px) { .ahly-stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
        <div className="ahly-stats-grid" style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
          {[
            { num: '42+', label: 'Championships' },
            { num: '150+', label: 'Pro Players' },
            { num: '25+', label: 'Years Excellence' },
            { num: '98%', label: 'Player Satisfaction' },
          ].map((s, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <div style={{ color: GOLD, fontSize: '36px', fontWeight: 900 }}>{s.num}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ===== FEATURES ===== */}
      <section id="features" style={{ padding: '80px 24px', backgroundColor: bg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            style={{ textAlign: 'center', marginBottom: '56px' }}
          >
            <div style={{ color: RED, fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>What We Offer</div>
            <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '16px' }}>Academy Programs</h2>
            <p style={{ color: muted, fontSize: '17px', maxWidth: '500px', margin: '0 auto' }}>Comprehensive training designed to develop champions on and off the field</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: '⚽', title: 'Technical Training', desc: 'Master ball control, dribbling, passing and tactical awareness with UEFA-certified coaches.' },
              { icon: '🧠', title: 'Mental Development', desc: 'Build confidence, focus, and psychological resilience for peak performance under pressure.' },
              { icon: '📊', title: 'AI Performance Analysis', desc: 'Advanced video analysis and data-driven insights for continuous measurable improvement.' },
              { icon: '🎯', title: 'Personalized Programs', desc: 'Customized training plans tailored to each player\'s unique strengths, weaknesses and goals.' },
              { icon: '💪', title: 'Physical Conditioning', desc: 'Scientific strength, speed, and agility training with injury prevention protocols.' },
              { icon: '🏆', title: 'Match Experience', desc: 'Regular competitive matches and national tournaments to develop real-game decision making.' },
            ].map((f, i) => (
              <div key={i} style={{
                backgroundColor: cardBg, borderRadius: '16px', padding: '32px',
                border: `1px solid ${border}`,
              }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: RED }}>{f.title}</h3>
                <p style={{ color: muted, lineHeight: 1.6, fontSize: '14px' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PHOTO GALLERY ===== */}
      <section id="gallery" style={{ padding: '80px 24px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: RED, fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Photo Gallery</div>
            <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '16px' }}>Moments from Our Academy</h2>
            <p style={{ color: muted, fontSize: '17px' }}>Training sessions, match days, and championship moments</p>
          </div>

          {/* ── ROW 1: Large hero left + 2 stacked right ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px', marginBottom: '14px' }}>
            {/* Hero cell */}
            <div onClick={() => openLightbox(ACADEMY_PHOTO_1)} style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', minHeight: '400px', cursor: 'pointer' }}>
              <img src={ACADEMY_PHOTO_1} alt="Match Action" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />
              <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                <span style={{ backgroundColor: GOLD, color: '#000', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.5px' }}>ESC Championship</span>
              </div>
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
                <div style={{ color: GOLD, fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Egyptian Stars Championship</div>
                <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800, lineHeight: 1.3 }}>Academy Players in Match Action</div>
              </div>
            </div>
            {/* Right stacked 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { src: ACADEMY_PHOTO_2, label: 'Competitive Match Play', tag: 'Match Day' },
                { src: FIELD_PHOTO, label: 'Official Team Photo', tag: 'Team' },
              ].map((p, i) => (
                <div key={i} onClick={() => openLightbox(p.src)} style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', flex: 1, minHeight: '185px', cursor: 'pointer' }}>
                  <img src={p.src} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)' }} />
                  <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    <span style={{ backgroundColor: RED, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px' }}>{p.tag}</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px' }}>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{p.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── ROW 2: 3 equal columns (Training, Coaching, Achievements) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
            {[
              { src: ACADEMY_TRAINING_PHOTO, label: 'Academy Training Session', tag: 'Training', accent: '#22c55e' },
              { src: COACH_PHOTO, label: 'Coach & Player Moments', tag: 'Coaching', accent: '#3b82f6' },
              { src: STADIUM_PHOTO, label: 'Championship Celebrations', tag: 'Achievements', accent: GOLD },
            ].map((g, i) => (
              <div key={i} onClick={() => openLightbox(g.src)} style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', minHeight: '230px', cursor: 'pointer' }}>
                <img src={g.src} alt={g.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span style={{ backgroundColor: g.accent, color: g.accent === GOLD ? '#000' : '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}>{g.tag}</span>
                </div>
                <div style={{ position: 'absolute', bottom: '14px', left: '14px', right: '14px' }}>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{g.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── ROW 3: 2 medium + 1 wide (Coaching + Youth + Medal) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: '14px', marginBottom: '14px' }}>
            {[
              { src: YOUTH_PHOTO, label: 'Youth Team Training', tag: 'Training', accent: '#22c55e' },
              { src: COACH_DIRECTING, label: 'Coach Directing from Sideline', tag: 'Coaching', accent: '#3b82f6' },
              { src: MEDAL_CEREMONY, label: 'Medal Presentation Ceremony', tag: 'ESC Ceremony', accent: GOLD, subtitle: 'Egyptian Stars Championship' },
            ].map((g, i) => (
              <div key={i} onClick={() => openLightbox(g.src)} style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', minHeight: '240px', cursor: 'pointer' }}>
                <img src={g.src} alt={g.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span style={{ backgroundColor: (g as any).accent, color: (g as any).accent === GOLD ? '#000' : '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}>{g.tag}</span>
                </div>
                <div style={{ position: 'absolute', bottom: '14px', left: '14px', right: '14px' }}>
                  {(g as any).subtitle && <div style={{ color: GOLD, fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{(g as any).subtitle}</div>}
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{g.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── ROW 4: 2 equal columns (Best Player + Coach with Winners) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div onClick={() => openLightbox(BEST_PLAYER_AWARD)} style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', minHeight: '260px', cursor: 'pointer' }}>
              <img src={BEST_PLAYER_AWARD} alt="Best Player Award" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
              <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                <span style={{ backgroundColor: GOLD, color: '#000', fontSize: '10px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px' }}>Best Player</span>
              </div>
              <div style={{ position: 'absolute', bottom: '18px', left: '18px', right: '18px' }}>
                <div style={{ color: GOLD, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>Tournament Award</div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>Best Player of the Tournament</div>
              </div>
            </div>
            <div onClick={() => openLightbox(MEDAL_WITH_COACH)} style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', minHeight: '260px', cursor: 'pointer' }}>
              <img src={MEDAL_WITH_COACH} alt="Coach with Medal Winners" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
              <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                <span style={{ backgroundColor: RED, color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px' }}>Ceremony</span>
              </div>
              <div style={{ position: 'absolute', bottom: '18px', left: '18px', right: '18px' }}>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>Coach with Medal Winners</div>
              </div>
            </div>
          </div>
        </div>
       </section>

      {/* ===== VIDEO SHOWCASE ===== */}
      <section id="videos" style={{ padding: '80px 24px', backgroundColor: bg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ color: RED, fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>In Action</div>
            <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '16px', color: text }}>
              {language === 'ar' ? 'مقاطع من التدريبات' : 'Training Highlights'}
            </h2>
            <p style={{ color: muted, fontSize: '17px' }}>
              {language === 'ar' ? 'شاهد لاعبينا في التدريبات والمباريات الرسمية' : 'Watch our players in training sessions and official matches'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', backgroundColor: '#000' }}>
              <video
                src={ACADEMY_VIDEO_1}
                controls
                poster={ACADEMY_TRAINING_PHOTO}
                style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '16px', backgroundColor: cardBg }}>
                <div style={{ color: RED, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Training Session</div>
                <div style={{ color: text, fontSize: '15px', fontWeight: 700 }}>
                  {language === 'ar' ? 'جلسة تدريبية مكثفة' : 'Intensive Training Session'}
                </div>
              </div>
            </div>
            <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', backgroundColor: '#000' }}>
              <video
                src={ACADEMY_VIDEO_2}
                controls
                poster={ACADEMY_TEAM_PHOTO}
                style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '16px', backgroundColor: cardBg }}>
                <div style={{ color: RED, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Match Highlights</div>
                <div style={{ color: text, fontSize: '15px', fontWeight: 700 }}>
                  {language === 'ar' ? 'أبرز لحظات المباراة' : 'Match Day Highlights'}
                </div>
              </div>
            </div>
            <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', backgroundColor: '#000' }}>
              <video
                src={TRAINING_VIDEO_NEW}
                controls
                poster={TEAM_PHOTO_NEW_1}
                style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '16px', backgroundColor: cardBg }}>
                <div style={{ color: RED, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Academy Session</div>
                <div style={{ color: text, fontSize: '15px', fontWeight: 700 }}>
                  {language === 'ar' ? 'جلسة الأكاديمية' : 'Academy Training — Oct 2025'}
                </div>
              </div>
            </div>
          </div>
          {/* Team photo banner */}
          <div style={{ marginTop: '20px', borderRadius: '16px', overflow: 'hidden', position: 'relative', height: '260px' }}>
            <img src={TEAM_PHOTO_NEW_1} alt="Academy Team" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(139,0,0,0.8), transparent)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '40px', transform: 'translateY(-50%)' }}>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Our Team</div>
              <div style={{ color: '#fff', fontSize: '28px', fontWeight: 900, lineHeight: 1.2 }}>
                {language === 'ar' ? 'فريق النجوم' : 'Stars Academy Team'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginTop: '8px' }}>
                {language === 'ar' ? 'بطولة النجوم المصرية 2025' : 'Egyptian Stars Championship 2025'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NEWS & UPDATES ===== */}
      <section id="news" style={{ padding: '80px 24px', backgroundColor: bg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: RED, fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Latest Updates</div>
            <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '16px' }}>News & Updates</h2>
            <p style={{ color: muted, fontSize: '17px' }}>Latest news and events from our academy</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {newsItems.map((item, i) => (
              <div key={i} style={{
                backgroundColor: cardBg, borderRadius: '16px', overflow: 'hidden',
                border: `1px solid ${border}`,
              }}>
                {/* News image */}
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                  <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    <span style={{ backgroundColor: item.categoryColor, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>{item.category}</span>
                  </div>
                </div>
                {/* News content */}
                <div style={{ padding: '24px' }}>
                  <div style={{ color: muted, fontSize: '12px', marginBottom: '10px' }}>{item.date}</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px', color: text, lineHeight: 1.3 }}>{item.title}</h3>
                  <p style={{ color: muted, fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>{item.desc}</p>
                  <a href={item.link} style={{ color: RED, fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Read More →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" style={{ padding: '80px 24px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: RED, fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Membership Plans</div>
            <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '16px' }}>Choose Your Plan</h2>
            <p style={{ color: muted, fontSize: '17px', maxWidth: '600px', margin: '0 auto' }}>
              All plans include full access to our world-class coaching, facilities, and development programs
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', alignItems: 'start' }}>
            {pricingPlans.map((plan, i) => (
              <div key={i} style={{
                backgroundColor: bg, borderRadius: '20px', padding: '32px 24px',
                border: plan.popular ? `2px solid ${RED}` : `1px solid ${border}`,
                position: 'relative',
                boxShadow: plan.popular ? '0 8px 40px rgba(139,0,0,0.2)' : 'none',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: RED, color: '#fff', fontSize: '11px', fontWeight: 800,
                    padding: '5px 16px', borderRadius: '20px', letterSpacing: '1px', whiteSpace: 'nowrap',
                  }}>MOST POPULAR</div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', flexShrink: 0,
                  }}>{plan.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '18px' }}>{plan.name}</div>
                    <div style={{ color: muted, fontSize: '12px' }}>{plan.duration}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '14px', color: muted, fontWeight: 600 }}>EGP</span>
                    <span style={{ fontSize: '42px', fontWeight: 900, color: plan.popular ? RED : text }}>{plan.price.toLocaleString()}</span>
                  </div>
                  <div style={{ color: muted, fontSize: '13px' }}>/ {plan.period}</div>
                  {plan.savings && (
                    <div style={{ backgroundColor: plan.popular ? 'rgba(139,0,0,0.1)' : 'rgba(37,99,235,0.1)', color: plan.popular ? RED : '#2563eb', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', display: 'inline-block', marginTop: '8px' }}>
                      {plan.savings}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  {plan.features.map((feature, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ color: '#16a34a', fontSize: '16px', flexShrink: 0 }}>✓</span>
                      <span style={{ color: muted, fontSize: '13px' }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <a href="/enrollment" style={{
                  display: 'block', textAlign: 'center', padding: '12px 24px', borderRadius: '10px',
                  backgroundColor: plan.popular ? RED : 'transparent',
                  color: plan.popular ? '#fff' : RED,
                  border: `2px solid ${plan.popular ? RED : RED}`,
                  fontWeight: 700, fontSize: '14px', textDecoration: 'none',
                }}>
                  {plan.popular ? 'Enroll Now' : 'Get Started'}
                </a>
              </div>
            ))}
          </div>


        </div>
      </section>

      {/* ===== COACHES ===== */}
      <section id="training" style={{ padding: '80px 24px', backgroundColor: bg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: RED, fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Our Team</div>
            <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '16px' }}>World-Class Coaches</h2>
            <p style={{ color: muted, fontSize: '17px' }}>International experience and certified expertise</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              { name: 'Coach Hassan', role: 'Head Coach', exp: '20+ years', badge: 'UEFA Pro' },
              { name: 'Coach Mohamed', role: 'Technical Director', exp: '18+ years', badge: 'CAF A' },
              { name: 'Coach Amira', role: 'Fitness Coach', exp: '15+ years', badge: 'FIFA Cert.' },
              { name: 'Coach Karim', role: 'Goalkeeper Coach', exp: '12+ years', badge: 'UEFA B' },
            ].map((c, i) => (
              <div key={i} style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '28px', textAlign: 'center', border: `1px solid ${border}` }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>👤</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{c.name}</h3>
                <p style={{ color: RED, fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>{c.role}</p>
                <div style={{ backgroundColor: GOLD, color: '#000', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '8px' }}>{c.badge}</div>
                <p style={{ color: muted, fontSize: '12px' }}>{c.exp} experience</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" style={{ padding: '80px 24px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: RED, fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Testimonials</div>
            <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '16px' }}>What Families Say</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {displayTestimonials.map((t: any, i: number) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeInUp}
                style={{ backgroundColor: bg, borderRadius: '16px', padding: '32px', border: `1px solid ${border}` }}
              >
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {[...Array(t.rating || 5)].map((_, j) => <span key={j} style={{ color: GOLD, fontSize: '18px' }}>★</span>)}
                </div>
                <p style={{ color: muted, lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic', fontSize: '15px' }}>"{t.testimonial || t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{(t.name || t.author || 'A')[0]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{t.name || t.author}</div>
                    <div style={{ color: muted, fontSize: '12px' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ENROLLMENT ===== */}
      <section id="enroll" style={{ padding: '80px 24px', backgroundColor: RED }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 900, color: '#fff', marginBottom: '16px' }}>Join Future Stars Academy</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '17px' }}>Start your journey to becoming a champion</p>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '40px', backdropFilter: 'blur(10px)' }}>
            <style>{`@media (max-width: 600px) { .ahly-enroll-grid { grid-template-columns: 1fr !important; } }`}</style>
            <div className="ahly-enroll-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <input type="text" placeholder="Student First Name" style={{ padding: '14px 16px', borderRadius: '10px', border: 'none', fontSize: '15px', outline: 'none' }} />
              <input type="text" placeholder="Student Last Name" style={{ padding: '14px 16px', borderRadius: '10px', border: 'none', fontSize: '15px', outline: 'none' }} />
              <input type="email" placeholder="Parent Email" style={{ padding: '14px 16px', borderRadius: '10px', border: 'none', fontSize: '15px', outline: 'none' }} />
              <input type="tel" placeholder="Parent Phone" style={{ padding: '14px 16px', borderRadius: '10px', border: 'none', fontSize: '15px', outline: 'none' }} />
            </div>
            <select style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: 'none', fontSize: '15px', outline: 'none', marginBottom: '16px' }}>
              <option value="">Select Age Group</option>
              <option value="U6">U-6 (Age 5–6)</option>
              <option value="U7">U-7 (Age 6–7)</option>
              <option value="U8">U-8 (Age 7–8)</option>
              <option value="U9">U-9 (Age 8–9)</option>
              <option value="U10">U-10 (Age 9–10)</option>
              <option value="U11">U-11 (Age 10–11)</option>
              <option value="U12">U-12 (Age 11–12)</option>
              <option value="U13">U-13 (Age 12–13)</option>
              <option value="U14">U-14 (Age 13–14)</option>
              <option value="U15">U-15 (Age 14–15)</option>
              <option value="U16">U-16 (Age 15–16)</option>
              <option value="U17">U-17 (Age 16–17)</option>
              <option value="U18">U-18 (Age 17–18)</option>
              <option value="U19">U-19 (Age 18–19)</option>
            </select>
            <button
              onClick={() => window.location.href = '/register'}
              style={{
              width: '100%', padding: '16px', borderRadius: '10px', border: 'none',
              backgroundColor: GOLD, color: '#000', fontWeight: 800, fontSize: '17px', cursor: 'pointer',
            }}>Enroll Now →</button>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="careers" style={{ padding: '80px 24px', backgroundColor: bg }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: RED, fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>FAQ</div>
            <h2 style={{ fontSize: '40px', fontWeight: 900 }}>Common Questions</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { q: 'What is the minimum age to join?', a: 'Players can join from age 5. We have programs for all age groups from U-6 up to U-18.' },
              { q: 'What are the training schedules?', a: 'Training sessions are held 3-5 times per week depending on the age group and membership plan.' },
              { q: 'Do you offer scholarships?', a: 'Yes, we offer merit-based scholarships for talented players who demonstrate exceptional potential.' },
              { q: 'What facilities are available?', a: 'We have professional-grade pitches, gym facilities, video analysis rooms, and medical support.' },
              { q: 'How do I register my child?', a: 'Fill out the enrollment form above or visit our academy office. Our team will contact you within 24 hours.' },
            ].map((item, i) => (
              <details key={i} style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '20px 24px', border: `1px solid ${border}`, cursor: 'pointer' }}>
                <summary style={{ fontWeight: 700, fontSize: '16px', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {item.q} <span style={{ color: RED, fontSize: '20px' }}>+</span>
                </summary>
                <p style={{ color: muted, marginTop: '12px', lineHeight: 1.7, fontSize: '15px' }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" style={{ padding: '80px 24px', backgroundColor: cardBg }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: RED, fontWeight: 700, fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Contact Us</div>
            <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '16px' }}>Get In Touch</h2>
            <p style={{ color: muted, fontSize: '17px' }}>We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
            {/* Contact info */}
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '32px' }}>Contact Information</h3>
              {[
                { icon: '📧', title: 'Email', value: 'info@futurestarsacademy.com', link: 'mailto:info@futurestarsacademy.com' },
                { icon: '📞', title: 'Phone', value: '+20 (0) 100 123 4567', link: 'tel:+201001234567' },
                { icon: '📱', title: 'WhatsApp', value: '+20 (0) 100 123 4567', link: 'https://wa.me/201001234567' },
                { icon: '📍', title: 'Location', value: 'Future Stars Club, Gezira Island, Cairo, Egypt', link: '#' },
                { icon: '🕐', title: 'Office Hours', value: 'Sat–Thu: 8:00 AM – 8:00 PM', link: '#' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{c.title}</div>
                    <a href={c.link} style={{ color: muted, fontSize: '15px', textDecoration: 'none' }}>{c.value}</a>
                  </div>
                </div>
              ))}

              {/* Social media */}
              <div style={{ marginTop: '32px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>Follow Us</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { icon: '📘', label: 'Facebook', color: '#1877f2' },
                    { icon: '📸', label: 'Instagram', color: '#e4405f' },
                    { icon: '🐦', label: 'Twitter', color: '#1da1f2' },
                    { icon: '▶️', label: 'YouTube', color: '#ff0000' },
                  ].map((s, i) => (
                    <a key={i} href="#" style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      backgroundColor: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', textDecoration: 'none',
                    }} title={s.label}>{s.icon}</a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div style={{ backgroundColor: bg, borderRadius: '20px', padding: '40px', border: `1px solid ${border}` }}>
              {contactSent ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Message Sent!</h3>
                  <p style={{ color: muted }}>We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>Send Us a Message</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={contactForm.name}
                      onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                      style={{ padding: '14px 16px', borderRadius: '10px', border: `1px solid ${border}`, fontSize: '15px', outline: 'none', backgroundColor: cardBg, color: text }}
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={contactForm.email}
                      onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                      style={{ padding: '14px 16px', borderRadius: '10px', border: `1px solid ${border}`, fontSize: '15px', outline: 'none', backgroundColor: cardBg, color: text }}
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={contactForm.phone}
                      onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                      style={{ padding: '14px 16px', borderRadius: '10px', border: `1px solid ${border}`, fontSize: '15px', outline: 'none', backgroundColor: cardBg, color: text }}
                    />
                    <textarea
                      placeholder="Your message..."
                      rows={5}
                      value={contactForm.message}
                      onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                      style={{ padding: '14px 16px', borderRadius: '10px', border: `1px solid ${border}`, fontSize: '15px', outline: 'none', backgroundColor: cardBg, color: text, resize: 'vertical' }}
                    />
                    <button
                      onClick={() => {
                        if (contactForm.name && contactForm.email && contactForm.message) {
                          contactMutation.mutate({
                            name: contactForm.name,
                            email: contactForm.email,
                            phone: contactForm.phone || undefined,
                            subject: 'Website Inquiry',
                            message: contactForm.message,
                          });
                        }
                      }}
                      style={{
                        padding: '16px', borderRadius: '10px', border: 'none',
                        backgroundColor: RED, color: '#fff', fontWeight: 800, fontSize: '16px', cursor: 'pointer',
                      }}
                    >
                      Send Message →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ backgroundColor: DARK_NAV, color: '#fff', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <style>{`@media (max-width: 768px) { .ahly-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; } } @media (max-width: 480px) { .ahly-footer-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div className="ahly-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cc0000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', flexShrink: 0 }}>
                  <img src="/logo-transparent.png" alt="Future Stars" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px' }}>Future Stars Academy</div>
                  <div style={{ color: GOLD, fontSize: '11px', letterSpacing: '1px' }}>BUILDING CHAMPIONS SINCE 1999</div>
                </div>
              </div>
              <p style={{ color: '#9ca3af', lineHeight: 1.7, fontSize: '14px', maxWidth: '280px' }}>Egypt's most prestigious football academy, developing the next generation of professional players through world-class coaching and technology.</p>
            </div>
            <div>
              <h4 style={{ color: GOLD, fontWeight: 700, marginBottom: '16px', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>Academy</h4>
              {['Features', 'Gallery', 'News', 'Pricing'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} style={{ display: 'block', color: '#9ca3af', textDecoration: 'none', marginBottom: '8px', fontSize: '14px' }}>{l}</a>
              ))}
            </div>
            <div>
              <h4 style={{ color: GOLD, fontWeight: 700, marginBottom: '16px', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>Programs</h4>
              {['Enroll', 'Testimonials', 'Careers', 'Training'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} style={{ display: 'block', color: '#9ca3af', textDecoration: 'none', marginBottom: '8px', fontSize: '14px' }}>{l}</a>
              ))}
            </div>
            <div>
              <h4 style={{ color: GOLD, fontWeight: 700, marginBottom: '16px', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>Contact</h4>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.7 }}>
                Future Stars Club, Gezira Island<br />
                Cairo, Egypt<br />
                +20 (0) 100 123 4567<br />
                info@futurestarsacademy.com
              </p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #374151', paddingTop: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            2026 Future Stars Academy. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ===== LIGHTBOX OVERLAY ===== */}
      {lightboxIdx !== null && (() => {
        const photo = GALLERY_PHOTOS[lightboxIdx];
        return (
          <div
            onClick={closeLightbox}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              backgroundColor: 'rgba(0,0,0,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Prev arrow */}
            <button
              onClick={e => { e.stopPropagation(); prevPhoto(); }}
              style={{
                position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: '52px', height: '52px', color: '#fff', fontSize: '24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >‹</button>

            {/* Image container */}
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', textAlign: 'center' }}>
              <img
                src={photo.src}
                alt={photo.label}
                style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', display: 'block', margin: '0 auto' }}
              />
              <div style={{ marginTop: '16px' }}>
                <span style={{
                  display: 'inline-block', backgroundColor: '#8b0000', color: '#fff',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: '20px', marginBottom: '8px',
                }}>{photo.tag}</span>
                <p style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: 600 }}>{photo.label}</p>
                <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                  {lightboxIdx + 1} / {GALLERY_PHOTOS.length}
                </p>
              </div>
            </div>

            {/* Next arrow */}
            <button
              onClick={e => { e.stopPropagation(); nextPhoto(); }}
              style={{
                position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: '52px', height: '52px', color: '#fff', fontSize: '24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >›</button>

            {/* Close button */}
            <button
              onClick={closeLightbox}
              style={{
                position: 'absolute', top: '20px', right: '24px',
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: '40px', height: '40px', color: '#fff', fontSize: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        );
      })()}
      {/* Chatbot Widget */}
      <Chatbot />
    </div>
  );
}
