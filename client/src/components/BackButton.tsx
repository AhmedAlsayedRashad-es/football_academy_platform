import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

// Route-to-parent mapping for deterministic back navigation
const PARENT_ROUTES: Record<string, string> = {
  // Player-related
  '/player-progress-dashboard': '/players',
  '/player-scorecard': '/players',
  '/player-fifa-card': '/players',
  '/player-card': '/players',
  '/player-full-report': '/players',
  '/player-development-plan': '/players',
  '/player-medical-profile': '/players',
  '/player-documents': '/players',
  '/player-attachments': '/players',
  '/player-scouting-report': '/players',
  '/player-video-analysis': '/players',
  '/public-player-profile': '/players',
  '/full-player-report': '/analytics',
  '/age-group-benchmarking': '/analytics',
  '/idp': '/players',
  '/skill-assessment': '/players',
  '/points-management': '/players',
  '/live-match': '/matches',
  '/match-record': '/matches',
  '/player-comparison': '/analytics',
  '/coach-registration': '/staff',

  // Training
  '/training-session-planner': '/training',
  '/training-session-manager': '/training',
  '/training-session-recorder': '/training',
  '/session-execution': '/training',
  '/session-comparison': '/training',
  '/drill-assignment-system': '/training',
  '/drill-video-library': '/training',
  '/training-innovation-hub': '/training',
  '/load-management': '/training',
  '/microcycle-planner': '/training',

  // Matches
  '/match-reports': '/matches',
  '/match-fixtures': '/matches',
  '/match-event-recording': '/matches',
  '/match-video-detection': '/matches',
  '/match-video-tagger': '/matches',
  '/match-report-generator': '/matches',
  '/multi-match-comparison': '/matches',
  '/realtime-match-tracking': '/matches',
  '/live-match-mode': '/matches',
  '/live-match-notes': '/matches',
  '/season-stats': '/matches',
  '/league': '/matches',

  // Tactics
  '/formation-builder': '/tactics',
  '/animated-tactical-board': '/tactics',
  '/set-piece-designer': '/tactics',
  '/set-piece-simulation': '/tactics',
  '/tactical-simulation': '/tactics',
  '/tactical-simulation-lab': '/tactics',
  '/professional-tactical-board': '/tactics',
  '/advanced-tactical-hub': '/tactics',
  '/pass-network-viewer': '/tactics',
  '/professional-heatmap': '/tactics',
  '/opposition-analysis': '/tactics',
  '/opponent-management': '/tactics',

  // Video
  '/video-clip-library': '/video-analysis',
  '/create-video-clip': '/video-analysis',
  '/video-telestration': '/video-analysis',
  '/video-management': '/video-analysis',
  '/skills-videos': '/video-analysis',
  '/opponent-video-analysis': '/video-analysis',
  '/ai-video-analysis': '/video-analysis',
  '/ai-video-recommendations': '/video-analysis',

  // Advanced Tools / AI
  '/coach/ai-assistant': '/ai',
  '/ai-formation-recommendation': '/ai',
  '/ai-formation-simulation': '/ai',
  '/ai-tactical-planner': '/ai',
  '/coach/performance-prediction': '/ai',
  '/ai-dashboard': '/ai',
  '/coach/ai-calendar': '/ai',
  '/features-hub': '/ai',
  '/ai-match-coach': '/ai',
  '/ai-emergency-mode': '/ai',
  '/voice-coach': '/ai',
  '/xg-analytics': '/analytics',
  '/data-analysis-pro': '/analytics',
  '/cross-team-benchmarking': '/analytics',
  '/team-needs-analysis': '/analytics',
  '/succession-planning': '/analytics',
  '/performance-prediction': '/analytics',
  '/performance': '/players',
  '/attendance': '/players',
  '/attendance-tracking': '/players',

  // Medical / Staff
  '/medical-status-dashboard': '/staff',
  '/medical-trends': '/staff',
  '/team-doctor': '/staff',
  '/injury-tracking': '/staff',
  '/injury-prevention': '/staff',
  '/mental': '/staff',
  '/physical': '/staff',
  '/nutrition': '/staff',
  '/nutrition-ai': '/staff',
  '/nutrition-plan-assignment': '/staff',
  '/gps-tracker': '/staff',
  '/team-progress-comparison': '/staff',
  '/team-management': '/staff',
  '/weekly-report-scheduler': '/staff',
  '/staff-attendance': '/staff',
  '/staff-directory': '/staff',
  '/staff-cost-tracking': '/staff',
  '/load-management-dashboard': '/staff',

  // Education
  '/coach-education/laws': '/education',
  '/coach-education/courses': '/education',
  '/coach-education/videos': '/education',
  '/coach-assessment': '/education',
  '/coaching-courses': '/education',
  '/course-detail': '/education',
  '/lesson-viewer': '/education',
  '/quiz-taker': '/education',
  '/quiz-review': '/education',
  '/fifa-video-library': '/education',

  // Community
  '/forum': '/community',
  '/events': '/community',
  '/events-calendar': '/community',
  '/leaderboard': '/community',
  '/rewards': '/community',
  '/streak': '/community',

  // Admin
  '/admin/blog': '/admin',
  '/admin/enrollments': '/admin',
  '/admin/staff': '/admin',
  '/admin/teams': '/admin',
  '/admin/data': '/admin',
  '/admin/coach-assignment': '/admin',
  '/role-permission-manager': '/admin',
  '/user-management': '/admin',
  '/location-management': '/admin',
  '/scholarship-management': '/admin',

  // Finance
  '/my-fees': '/finance',
  '/billing-success': '/dashboard',
  '/subscription-plans': '/dashboard',
  '/pricing': '/',

  // Scouting
  '/scout-network': '/ai',
  '/talent-portal': '/ai',
  '/team-scouting-overview': '/ai',
  '/coach-selection-tool': '/ai',
  '/coach-database': '/ai',

  // Parent
  '/parent-portal': '/dashboard',
  '/parent-fee-portal': '/dashboard',
  '/parent-notification-center': '/dashboard',
  '/my-bookings': '/dashboard',
  '/book-private-session': '/private-training',
  '/private-training': '/training',

  // Settings / Profile
  '/settings': '/dashboard',
  '/profile': '/dashboard',
  '/messages': '/dashboard',
};

// Section label mapping for breadcrumb display
const SECTION_LABELS: Record<string, string> = {
  '/players': 'Players',
  '/training': 'Training',
  '/matches': 'Matches',
  '/tactics': 'Tactics & Formations',
  '/video-analysis': 'Video Analysis',
  '/ai': 'Advanced Tools',
  '/analytics': 'Analytics & Reports',
  '/staff': 'Staff Tools',
  '/education': 'Education',
  '/community': 'Community',
  '/admin': 'Admin',
  '/finance': 'Finance',
  '/dashboard': 'Dashboard',
  '/': 'Home',
};

interface BackButtonProps {
  /** Override the auto-detected parent route */
  to?: string;
  /** Override the label shown next to the arrow */
  label?: string;
  className?: string;
  /** Show the section name as a breadcrumb label (default: true) */
  showLabel?: boolean;
}

export function BackButton({ to, label, className = '', showLabel = true }: BackButtonProps) {
  const [location, navigate] = useLocation();

  const handleBack = () => {
    // 1. Use explicit override if provided
    if (to) {
      navigate(to);
      return;
    }

    // 2. Check the route map (strip query params for matching)
    const basePath = location.split('?')[0];
    const parent = PARENT_ROUTES[basePath];
    if (parent) {
      navigate(parent);
      return;
    }

    // 3. Check dynamic routes (e.g. /players/123, /team-dashboard?team=u12)
    // Strip trailing ID segments
    const withoutId = basePath.replace(/\/\d+$/, '');
    const parentOfBase = PARENT_ROUTES[withoutId];
    if (parentOfBase) {
      navigate(parentOfBase);
      return;
    }

    // 4. Fallback to browser history
    window.history.back();
  };

  // Determine display label
  const basePath = location.split('?')[0];
  const parentRoute = to || PARENT_ROUTES[basePath] || PARENT_ROUTES[basePath.replace(/\/\d+$/, '')];
  const sectionLabel = label || (parentRoute ? SECTION_LABELS[parentRoute] : null) || 'Back';

  return (
    <button
      onClick={handleBack}
      className={`group flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ${className}`}
      aria-label={`Back to ${sectionLabel}`}
    >
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/60 group-hover:bg-muted transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </span>
      {showLabel && (
        <span className="hidden sm:inline">{sectionLabel}</span>
      )}
    </button>
  );
}
