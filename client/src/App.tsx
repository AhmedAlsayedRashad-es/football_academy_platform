import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { Route, Switch, useLocation, useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// ==================== PAGE IMPORTS ====================

// Public Pages
import Home from "./pages/Home";
import Register from "./pages/Register";
import UserRegistration from "./pages/UserRegistration";
import PendingApproval from "./pages/PendingApproval";
import ParentOnboarding from "./pages/ParentOnboarding";
const Events = React.lazy(() => import('./pages/Events'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Team = React.lazy(() => import('./pages/Team'));
const Careers = React.lazy(() => import('./pages/Careers'));
// Dashboard
import Dashboard from "./pages/Dashboard";
const CoachDashboard = React.lazy(() => import('./pages/CoachDashboard'));
const CoachMyTeams = React.lazy(() => import('./pages/CoachMyTeams'));
const CoachHome = React.lazy(() => import('./pages/CoachHome'));
const CoachPlayerReport = React.lazy(() => import('./pages/CoachPlayerReport'));
const TeamDashboard = React.lazy(() => import('./pages/TeamDashboard'));
const FeaturesHub = React.lazy(() => import('./pages/FeaturesHub'));
const ScoutNetwork = React.lazy(() => import('./pages/ScoutNetwork'));
const NutritionAI = React.lazy(() => import('./pages/NutritionAI'));
const InjuryPrevention = React.lazy(() => import('./pages/InjuryPrevention'));
// Player Management
const Players = React.lazy(() => import('./pages/Players'));
const PlayerScorecard = React.lazy(() => import('./pages/PlayerScorecard'));
const PlayerDashboard = React.lazy(() => import('./pages/PlayerDashboard'));
const Performance = React.lazy(() => import('./pages/Performance'));
const PerformanceDashboard = React.lazy(() => import('./pages/PerformanceDashboard'));
const SkillAssessment = React.lazy(() => import('./pages/SkillAssessment'));
const PlayerComparison = React.lazy(() => import('./pages/PlayerComparison'));
// Training
const Training = React.lazy(() => import('./pages/Training'));
const TrainingLibrary = React.lazy(() => import('./pages/TrainingLibrary'));
const TrainingSessionPlanner = React.lazy(() => import('./pages/TrainingSessionPlanner'));
const TrainingSessionManager = React.lazy(() => import('./pages/TrainingSessionManager'));
const PrivateTraining = React.lazy(() => import('./pages/PrivateTraining'));
const CoachSchedule = React.lazy(() => import('./pages/CoachSchedule'));
const CoachCalendar = React.lazy(() => import('./pages/CoachCalendar'));
const MyBookings = React.lazy(() => import('./pages/MyBookings'));
const Explore = React.lazy(() => import('./pages/Explore'));
// Match & Tactics
const Matches = React.lazy(() => import('./pages/Matches'));
const League = React.lazy(() => import('./pages/League'));
const LiveMatchMode = React.lazy(() => import('./pages/LiveMatchMode'));
const ProfessionalTacticalBoard = React.lazy(() => import('./pages/ProfessionalTacticalBoardNew'));
const FormationBuilder = React.lazy(() => import('./pages/FormationBuilder'));
const SetPieceDesigner = React.lazy(() => import('./pages/SetPieceDesigner'));
const SetPieceSimulation = React.lazy(() => import('./pages/SetPieceSimulation'));
const MatchEventRecording = React.lazy(() => import('./pages/MatchEventRecording'));
const AIMatchCoach = React.lazy(() => import('./pages/AIMatchCoach'));
const OpponentManagement = React.lazy(() => import('./pages/OpponentManagement'));
const OppositionAnalysis = React.lazy(() => import('./pages/OppositionAnalysis'));
const LiveMatchNotes = React.lazy(() => import('./pages/LiveMatchNotes'));
// Video Analysis
const Videos = React.lazy(() => import('./pages/Videos'));
const VideoClipLibrary = React.lazy(() => import('./pages/VideoClipLibrary'));
const SkillsVideos = React.lazy(() => import('./pages/SkillsVideos'));
const CreateVideoClip = React.lazy(() => import('./pages/CreateVideoClip'));
const AIVideoAnalysis = React.lazy(() => import('./pages/AIVideoAnalysis'));
const VoiceCoach = React.lazy(() => import('./pages/VoiceCoach'));
const MatchVideoDetection = React.lazy(() => import('./pages/MatchVideoDetection'));
const ProfessionalHeatmap = React.lazy(() => import('./pages/ProfessionalHeatmap'));
const PassNetworkViewer = React.lazy(() => import('./pages/PassNetworkViewer'));
const VideoManagement = React.lazy(() => import('./pages/VideoManagement'));
const TacticalVideoAnalysisHub = React.lazy(() => import('./pages/TacticalVideoAnalysisHub'));
const EnhancedParentDashboard = React.lazy(() => import('./pages/EnhancedParentDashboard'));
const PlayerBenchmarkingHub = React.lazy(() => import('./pages/PlayerBenchmarkingHub'));
const InjuryEarlyWarning = React.lazy(() => import('./pages/InjuryEarlyWarning'));
const InternalTransferMarket = React.lazy(() => import('./pages/InternalTransferMarket'));
const GamificationHub = React.lazy(() => import('./pages/GamificationHub'));
const AutoReportsHub = React.lazy(() => import('./pages/AutoReportsHub'));
const SmartSchedulingHub = React.lazy(() => import('./pages/SmartSchedulingHub'));
// Advanced Tools
const AICoachAssistant = React.lazy(() => import('./pages/AICoachAssistantEnhanced'));
const AIEmergencyMode = React.lazy(() => import('./pages/AIEmergencyMode'));
const PerformancePrediction = React.lazy(() => import('./pages/PerformancePrediction'));
const AIFormationSimulation = React.lazy(() => import('./pages/AIFormationSimulation'));
const AICalendar = React.lazy(() => import('./pages/AICalendar'));
const AITacticalPlanner = React.lazy(() => import('./pages/AITacticalPlanner'));
const AIDashboard = React.lazy(() => import('./pages/AIDashboard'));
// Analytics & Reports
const Analytics = React.lazy(() => import('./pages/AnalyticsImproved'));
const XGAnalytics = React.lazy(() => import('./pages/XGAnalytics'));
const MatchReports = React.lazy(() => import('./pages/MatchReports'));
const MatchReportGenerator = React.lazy(() => import('./pages/MatchReportGenerator'));
// Staff Tools
const Mental = React.lazy(() => import('./pages/Mental'));
const Physical = React.lazy(() => import('./pages/Physical'));
const Nutrition = React.lazy(() => import('./pages/Nutrition'));
const InjuryTracking = React.lazy(() => import('./pages/InjuryTracking'));
const GpsTracker = React.lazy(() => import('./pages/GpsTracker'));
// Education
const FootballLaws = React.lazy(() => import('./pages/FootballLaws'));
const CoachingCourses = React.lazy(() => import('./pages/CoachingCourses'));
const CourseContent = React.lazy(() => import('./pages/CourseContent'));
const FIFAVideoLibrary = React.lazy(() => import('./pages/FIFAVideoLibrary'));
const AIVideoRecommendations = React.lazy(() => import('./pages/AIVideoRecommendations'));
const CoachAssessment = React.lazy(() => import('./pages/CoachAssessment'));
const QuizReview = React.lazy(() => import('./pages/QuizReview'));
// Community & Portal
const ParentPortal = React.lazy(() => import('./pages/ParentPortal'));
const CourseDetail = React.lazy(() => import('./pages/CourseDetail'));
const LessonViewer = React.lazy(() => import('./pages/LessonViewer'));
const QuizTaker = React.lazy(() => import('./pages/QuizTaker'));
const ParentDashboard = React.lazy(() => import('./pages/ParentDashboard'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Forum = React.lazy(() => import('./pages/Forum'));
const Rewards = React.lazy(() => import('./pages/Rewards'));
const StreakPage = React.lazy(() => import('./pages/StreakPage'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
// Admin
const Settings = React.lazy(() => import('./pages/Settings'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const AdminDataManagement = React.lazy(() => import('./pages/AdminDataManagement'));
const RoleManagement = React.lazy(() => import('@/pages/admin/RoleManagement'));
const RolePermissionManager = React.lazy(() => import('@/pages/RolePermissionManager'));
const HomePageContentManagement = React.lazy(() => import('@/pages/admin/HomePageContentManagement'));
const HomeContentEditor = React.lazy(() => import('@/pages/admin/HomeContentEditor'));
const HomePageEditor = React.lazy(() => import('./pages/admin/HomePageEditor'));
const CacheManagement = React.lazy(() => import('@/pages/admin/CacheManagement'));
const TestimonialsManagement = React.lazy(() => import('./pages/admin/TestimonialsManagement'));
const ChatbotQAManagement = React.lazy(() => import('./pages/admin/ChatbotQAManagement'));
const BadgeManagement = React.lazy(() => import('./pages/admin/BadgeManagement'));
const AdminControlPanel = React.lazy(() => import('./pages/admin/AdminControlPanel'));
const AdminEnrollments = React.lazy(() => import('@/pages/AdminEnrollments'));
const AdminBlog = React.lazy(() => import('@/pages/AdminBlog'));
const AdminCoachAssignment = React.lazy(() => import('@/pages/AdminCoachAssignment'));
const AdminTeamManagement = React.lazy(() => import('@/pages/AdminTeamManagement'));
const AdminStaffManagement = React.lazy(() => import('@/pages/AdminStaffManagement'));
const StaffDirectory = React.lazy(() => import('@/pages/StaffDirectory'));
const TeamDetailPage = React.lazy(() => import('@/pages/TeamDetailPage'));
const CareerApplications = React.lazy(() => import('@/pages/admin/CareerApplications'));
const AdminCourseManagement = React.lazy(() => import('@/pages/admin/AdminCourseManagement'));
const QuizManagement = React.lazy(() => import('@/pages/admin/QuizManagement'));
const CertificateGallery = React.lazy(() => import('@/pages/parent/CertificateGallery'));
const CoachAvailabilityManagement = React.lazy(() => import('@/pages/CoachAvailabilityManagement'));
const TeamAssignment = React.lazy(() => import('@/pages/TeamAssignment'));
const TeamRosters = React.lazy(() => import('@/pages/TeamRosters'));
// Other
const IDP = React.lazy(() => import('./pages/IDP'));
const AcademyTeams = React.lazy(() => import('./pages/AcademyTeams'));
const TeamPlayers = React.lazy(() => import('./pages/TeamPlayers'));
const PointsManagement = React.lazy(() => import('./pages/PointsManagement'));
const PlayerFIFACard = React.lazy(() => import('./pages/PlayerFIFACard'));
const AttendanceTracking = React.lazy(() => import('./pages/AttendanceTracking'));
const StaffAttendanceTracker = React.lazy(() => import('./pages/StaffAttendanceTracker'));
const LocationManagement = React.lazy(() => import('./pages/LocationManagement'));
const BookingManagement = React.lazy(() => import('./pages/BookingManagement'));
const CoachReminders = React.lazy(() => import('./pages/CoachReminders'));
const TalentPortal = React.lazy(() => import('./pages/TalentPortal'));
const EnrollmentForm = React.lazy(() => import('./pages/EnrollmentForm'));
const EnrollmentAdmin = React.lazy(() => import('./pages/EnrollmentAdmin'));
const PlayerVideoAnalysis = React.lazy(() => import('./pages/PlayerVideoAnalysis'));
const VideoAnalysis = React.lazy(() => import('./pages/VideoAnalysis'));
const AIAssistant = React.lazy(() => import('./pages/coach/AIAssistant'));
const CoachPerformanceDashboard = React.lazy(() => import('./pages/CoachPerformanceDashboard'));
const MatchFixtures = React.lazy(() => import('./pages/MatchFixtures'));
const TacticalSimulationLab = React.lazy(() => import('./pages/TacticalSimulationLab'));
const DataAnalysisPro = React.lazy(() => import('./pages/DataAnalysisPro'));
const CoachProgressDashboard = React.lazy(() => import('./pages/CoachProgressDashboard'));
const TeamScheduleCalendar = React.lazy(() => import('./pages/TeamScheduleCalendar'));
const PlayerAttachments = React.lazy(() => import('./pages/PlayerAttachments'));
const AdvancedTacticalHub = React.lazy(() => import('./pages/AdvancedTacticalHub'));
const CoachSelectionTool = React.lazy(() => import('./pages/CoachSelectionTool'));
const TeamNeedsAnalysis = React.lazy(() => import('./pages/TeamNeedsAnalysis'));
const CoachDatabase = React.lazy(() => import('./pages/CoachDatabase'));
const TrainingInnovationHub = React.lazy(() => import('./pages/TrainingInnovationHub'));
const PlayerDevelopmentPlan = React.lazy(() => import('./pages/PlayerDevelopmentPlan'));
const PlayerScoutingReport = React.lazy(() => import('./pages/PlayerScoutingReport'));
const TeamScoutingOverview = React.lazy(() => import('./pages/TeamScoutingOverview'));
const MedicalStatusDashboard = React.lazy(() => import('./pages/MedicalStatusDashboard'));
const PlayerProgressReport = React.lazy(() => import('./pages/PlayerProgressReport'));
const AIFormationRecommendation = React.lazy(() => import('./pages/AIFormationRecommendation'));
const SuspensionsManagement = React.lazy(() => import('./pages/SuspensionsManagement'));
const PlayerMedicalProfile = React.lazy(() => import('./pages/PlayerMedicalProfile'));
const TeamManagement = React.lazy(() => import('./pages/TeamManagement'));
const LoadManagementDashboard = React.lazy(() => import('./pages/LoadManagementDashboard'));
const TrainingSessionRecorder = React.lazy(() => import('./pages/TrainingSessionRecorder'));
const PlayerProgressDashboard = React.lazy(() => import('./pages/PlayerProgressDashboard'));
const TeamProgressComparison = React.lazy(() => import('./pages/TeamProgressComparison'));
const DrillVideoLibrary = React.lazy(() => import('./pages/DrillVideoLibrary'));
const TeamMedicalOverview = React.lazy(() => import('./pages/TeamMedicalOverview'));
const MatchVideoTagger = React.lazy(() => import('./pages/MatchVideoTagger'));
const DrillAssignmentSystem = React.lazy(() => import('./pages/DrillAssignmentSystem'));
const PlayerFullReport = React.lazy(() => import('./pages/PlayerFullReport'));
const CoachRegistration = React.lazy(() => import('./pages/CoachRegistration'));
const PlayerDocuments = React.lazy(() => import('./pages/PlayerDocuments'));
const FullPlayerReport = React.lazy(() => import('./pages/FullPlayerReport'));
const TeamDoctorDashboard = React.lazy(() => import('./pages/TeamDoctorDashboard'));
const MultiMatchComparison = React.lazy(() => import('./pages/MultiMatchComparison'));
const ParentNotificationCenter = React.lazy(() => import('./pages/ParentNotificationCenter'));
const WeeklyReportScheduler = React.lazy(() => import('./pages/WeeklyReportScheduler'));
const MedicalTrendsPage = React.lazy(() => import('./pages/MedicalTrendsPage'));
const VideoTelestration = React.lazy(() => import('./pages/VideoTelestration'));
const AgeGroupBenchmarking = React.lazy(() => import('./pages/AgeGroupBenchmarking'));
const AnimatedTacticalBoard = React.lazy(() => import('./pages/AnimatedTacticalBoard'));
const TacticalHub = React.lazy(() => import('./pages/TacticalHub'));
const SeasonStatsDashboard = React.lazy(() => import('./pages/SeasonStatsDashboard'));
const NutritionPlanAssignment = React.lazy(() => import('./pages/NutritionPlanAssignment'));
const TacticalSimulation = React.lazy(() => import('./pages/TacticalSimulation'));
const RealtimeMatchTracking = React.lazy(() => import('./pages/RealtimeMatchTracking'));
const AcademyRoster = React.lazy(() => import('./pages/AcademyRoster'));
const SessionComparison = React.lazy(() => import('./pages/SessionComparison'));
const OpponentVideoAnalysis = React.lazy(() => import('./pages/OpponentVideoAnalysis'));
const ProMatchAnalysis = React.lazy(() => import('./pages/ProMatchAnalysis'));
const MatchAnalysisEngine = React.lazy(() => import('./pages/MatchAnalysisEngine'));
const SkillsLibrary = React.lazy(() => import('./pages/SkillsLibrary'));
const CoachTrainingPlanBuilder = React.lazy(() => import('./pages/CoachTrainingPlanBuilder'));
const GoalkeeperAcademy = React.lazy(() => import('./pages/GoalkeeperAcademy'));
const BookPrivateSession = React.lazy(() => import('./pages/BookPrivateSession'));
const Finance = React.lazy(() => import('./pages/Finance'));
const ExecutiveDashboard = React.lazy(() => import('./pages/ExecutiveDashboard'));
const ScholarshipManagement = React.lazy(() => import('./pages/ScholarshipManagement'));
const StaffCostTracking = React.lazy(() => import('./pages/StaffCostTracking'));
const SubscriptionPlans = React.lazy(() => import('./pages/SubscriptionPlans'));
const BillingSuccess = React.lazy(() => import('./pages/BillingSuccess'));
const SessionExecution = React.lazy(() => import('./pages/SessionExecution'));
const TrainingHub = React.lazy(() => import('./pages/TrainingHub'));
const SuccessionPlanning = React.lazy(() => import('./pages/SuccessionPlanning'));
const Profile = React.lazy(() => import('./pages/Profile'));
const MyFees = React.lazy(() => import('./pages/MyFees'));
const ParentFeePortal = React.lazy(() => import('./pages/ParentFeePortal'));
const CrossTeamBenchmarking = React.lazy(() => import('./pages/CrossTeamBenchmarking'));
const EventsCalendar = React.lazy(() => import('./pages/EventsCalendar'));
const PublicPlayerProfile = React.lazy(() => import('./pages/PublicPlayerProfile'));
const SharedAnalysisReport = React.lazy(() => import('./pages/SharedAnalysisReport'));
const DeviceIntegrationHub = React.lazy(() => import('./pages/DeviceIntegrationHub'));
const Punishments = React.lazy(() => import('./pages/Punishments'));
const DigitalLockerRoom = React.lazy(() => import('./pages/DigitalLockerRoom'));
const PlayerLockerRoom = React.lazy(() => import('./pages/PlayerLockerRoom'));
const ProClubHub = React.lazy(() => import('./pages/ProClubHub'));
const MatchIntelligenceHub = React.lazy(() => import('./pages/MatchIntelligenceHub'));
// Redirect /player/:id/:extra to /player/:id (handles malformed URLs like /player/1003/-1)
function PlayerRedirect() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (id) navigate(`/player/${id}`, { replace: true });
  }, [id]);
  return null;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}><Switch>
      {/* ==================== PUBLIC PAGES ==================== */}
      <Route path="/" component={Home} />
      <Route path="/team" component={Team} />
      <Route path="/register" component={Register} />
      <Route path="/user-registration" component={UserRegistration} />
      <Route path="/pending-approval" component={PendingApproval} />
      <Route path="/parent-onboarding" component={ParentOnboarding} />
      <Route path="/events" component={Events} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/careers" component={Careers} />
      <Route path="/public/player/:id" component={PublicPlayerProfile} />
      <Route path="/shared-report/:token" component={SharedAnalysisReport} />

      {/* Everything below renders inside ONE persistent DashboardLayout.
          The sidebar and header mount once and survive route changes; only the
          inner Suspense swaps, so navigating no longer blanks the whole screen. */}
      <Route>
        <DashboardLayout>
          <Suspense fallback={<ContentLoader />}>
            <Switch>

      {/* ==================== DASHBOARD ==================== */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/coach-dashboard" component={CoachDashboard} />
      <Route path="/coach/my-teams" component={CoachMyTeams} />
      <Route path="/coach/home" component={CoachHome} />
      <Route path="/coach/player-report/:playerId" component={CoachPlayerReport} />
      <Route path="/team-dashboard" component={TeamDashboard} />
      <Route path="/performance-dashboard" component={PerformanceDashboard} />
      <Route path="/features-hub" component={FeaturesHub} />
      <Route path="/scout-network" component={ScoutNetwork} />
      <Route path="/nutrition-ai" component={NutritionAI} />
      <Route path="/injury-prevention" component={InjuryPrevention} />

      {/* ==================== PLAYER MANAGEMENT ==================== */}
      <Route path="/players" component={Players} />
      <Route path="/player/:id/scouting" component={PlayerScoutingReport} />
      <Route path="/player/:id/medical" component={PlayerMedicalProfile} />
      <Route path="/player/:id/progress" component={PlayerProgressDashboard} />
      <Route path="/player/:id/report" component={PlayerProgressReport} />
      <Route path="/player/:id" component={PlayerDashboard} />
      <Route path="/player/:id/:extra" component={PlayerRedirect} />
      <Route path="/team/:teamId/scouting" component={TeamScoutingOverview} />
      <Route path="/player-progress/:playerId" component={PlayerProgressDashboard} />
      <Route path="/team-progress-comparison" component={TeamProgressComparison} />
      <Route path="/drill-video-library" component={DrillVideoLibrary} />
      <Route path="/team-medical-overview" component={TeamMedicalOverview} />
      <Route path="/medical-status-dashboard" component={MedicalStatusDashboard} />
      <Route path="/ai-formation-recommendation" component={AIFormationRecommendation} />
      <Route path="/suspensions" component={SuspensionsManagement} />
      <Route path="/match-video-tagger" component={MatchVideoTagger} />
      <Route path="/drill-assignment-system" component={DrillAssignmentSystem} />
      <Route path="/players/:id/scorecard" component={PlayerScorecard} />
      <Route path="/performance" component={Performance} />
      <Route path="/skill-assessment" component={SkillAssessment} />
      <Route path="/coach/player-comparison" component={PlayerComparison} />

      {/* ==================== TRAINING ==================== */}
      <Route path="/training" component={Training} />
      <Route path="/training-library" component={TrainingLibrary} />
      <Route path="/coach/training-planner" component={TrainingSessionPlanner} />
      <Route path="/coach/training-manager" component={TrainingSessionManager} />
      <Route path="/private-training" component={PrivateTraining} />
      <Route path="/my-bookings" component={MyBookings} />
      <Route path="/explore" component={Explore} />
      <Route path="/coach-schedule" component={CoachSchedule} />
      <Route path="/coach/calendar" component={CoachCalendar} />

      {/* ==================== MATCH & TACTICS ==================== */}
      <Route path="/matches" component={Matches} />
      <Route path="/fixtures" component={MatchFixtures} />
      <Route path="/enrollment" component={EnrollmentForm} />
      <Route path="/enrollment-admin" component={EnrollmentAdmin} />
      <Route path="/video-analysis-player" component={PlayerVideoAnalysis} />
      <Route path="/video-analysis" component={VideoAnalysis} />
      <Route path="/coach-performance" component={CoachPerformanceDashboard} />
      <Route path="/league" component={League} />
      <Route path="/coach/live-match" component={LiveMatchMode} />
      <Route path="/professional-tactical-board" component={ProfessionalTacticalBoard} />
      <Route path="/formation-builder" component={FormationBuilder} />
      <Route path="/set-piece-designer" component={SetPieceDesigner} />
      <Route path="/set-piece-simulation" component={SetPieceSimulation} />
      <Route path="/match-event-recording" component={MatchEventRecording} />
      <Route path="/ai-match-coach" component={AIMatchCoach} />
      <Route path="/opponent-management" component={OpponentManagement} />
      <Route path="/opposition-analysis" component={OppositionAnalysis} />
      <Route path="/live-match-notes" component={LiveMatchNotes} />

      {/* ==================== VIDEO ANALYSIS ==================== */}
      <Route path="/videos" component={Videos} />
      <Route path="/ai-video-recommendations" component={AIVideoRecommendations} />
      <Route path="/video-clip-library" component={VideoClipLibrary} />
      <Route path="/skills-videos" component={SkillsVideos} />
      <Route path="/create-video-clip" component={CreateVideoClip} />
      <Route path="/coach/ai-video-analysis" component={AIVideoAnalysis} />
      <Route path="/coach/voice-coach" component={VoiceCoach} />
      <Route path="/voice-coach" component={VoiceCoach} />
      <Route path="/match-video-detection" component={MatchVideoDetection} />
      <Route path="/professional-heatmap" component={ProfessionalHeatmap} />
      <Route path="/pass-network" component={PassNetworkViewer} />
      <Route path="/video-management" component={VideoManagement} />
      <Route path="/tactical-video-analysis" component={TacticalVideoAnalysisHub} />
      <Route path="/pro-match-analysis" component={ProMatchAnalysis} />
      <Route path="/skills-library" component={SkillsLibrary} />
      <Route path="/training-plan-builder" component={CoachTrainingPlanBuilder} />
      <Route path="/goalkeeper-academy" component={GoalkeeperAcademy} />
      <Route path="/enhanced-parent-dashboard" component={EnhancedParentDashboard} />
      <Route path="/benchmarking-hub" component={PlayerBenchmarkingHub} />
      <Route path="/injury-early-warning" component={InjuryEarlyWarning} />
      <Route path="/transfer-market" component={InternalTransferMarket} />
      <Route path="/gamification-hub" component={GamificationHub} />
      <Route path="/auto-reports" component={AutoReportsHub} />
      <Route path="/smart-scheduling" component={SmartSchedulingHub} />

      {/* ==================== AI TOOLS ==================== */}
      <Route path="/ai-coach" component={AICoachAssistant} />
      <Route path="/coach/ai-assistant" component={AIAssistant} />
      <Route path="/ai-emergency-mode" component={AIEmergencyMode} />
      <Route path="/coach/performance-prediction" component={PerformancePrediction} />
      <Route path="/coach/ai-formation-simulation" component={AIFormationSimulation} />
      <Route path="/ai-formation-simulation" component={AIFormationSimulation} />
      <Route path="/coach/ai-calendar" component={AICalendar} />
      <Route path="/ai-calendar" component={AICalendar} />
      <Route path="/coach/ai-dashboard" component={AIDashboard} />
      <Route path="/ai-dashboard" component={AIDashboard} />
      <Route path="/ai-tactical-planner" component={AITacticalPlanner} />
      <Route path="/coach/ai-tactical-planner" component={AITacticalPlanner} />

      {/* ==================== ANALYTICS & REPORTS ==================== */}
      <Route path="/analytics" component={Analytics} />
      <Route path="/xg-analytics" component={XGAnalytics} />
      <Route path="/match-reports" component={MatchReports} />
      <Route path="/coach/match-report-generator" component={MatchReportGenerator} />

      {/* ==================== STAFF TOOLS ==================== */}
      <Route path="/mental" component={Mental} />
      <Route path="/physical" component={Physical} />
      <Route path="/nutrition" component={Nutrition} />
      <Route path="/coach/injury-tracking" component={InjuryTracking} />
      <Route path="/gps-tracker" component={GpsTracker} />
      {/* ==================== EDUCATION ==================== */}
      <Route path="/coach-education/laws" component={FootballLaws} />
      <Route path="/coach-education/courses" component={CoachingCourses} />
      <Route path="/coach-education/course/:level" component={CourseContent} />
      <Route path="/coach-education/videos" component={FIFAVideoLibrary} />
      <Route path="/coach-assessment" component={CoachAssessment} />
      <Route path="/quiz-review/:attemptId" component={QuizReview} />

      {/* ==================== COMMUNITY & PORTAL ==================== */}
      <Route path="/parent-portal" component={ParentPortal} />
      <Route path="/parent-portal/course/:id" component={CourseDetail} />
      <Route path="/parent-portal/lesson/:id" component={LessonViewer} />
      <Route path="/parent-portal/quiz/:courseId" component={QuizTaker} />
      <Route path="/parent-dashboard" component={ParentDashboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/forum" component={Forum} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/streak" component={StreakPage} />
      <Route path="/leaderboard" component={Leaderboard} />

      {/* ==================== ADMIN ==================== */}
      <Route path="/admin">{() => { const [, nav] = useLocation(); useEffect(() => nav('/settings', { replace: true }), []); return null; }}</Route>
      <Route path="/settings" component={Settings} />
      <Route path="/user-management" component={UserManagement} />
      <Route path="/admin/data-management" component={AdminDataManagement} />
      <Route path="/admin/role-management" component={RoleManagement} />
      <Route path="/admin/role-permissions" component={RolePermissionManager} />
      <Route path="/admin/home-content" component={HomePageContentManagement} />
      <Route path="/admin/home-editor" component={HomeContentEditor} />
      <Route path="/admin/home-page-editor" component={HomePageEditor} />
      <Route path="/admin/cache" component={CacheManagement} />
      <Route path="/admin/testimonials" component={TestimonialsManagement} />
      <Route path="/admin/chatbot-qa" component={ChatbotQAManagement} />
      <Route path="/admin/badge-management" component={BadgeManagement} />
      <Route path="/admin/control-panel" component={AdminControlPanel} />
      <Route path="/admin/enrollments" component={AdminEnrollments} />
      <Route path="/admin/blog" component={AdminBlog} />
      <Route path="/admin/coach-assignment" component={AdminCoachAssignment} />
      <Route path="/admin/team-management" component={AdminTeamManagement} />
      <Route path="/admin/staff-management" component={AdminStaffManagement} />
      <Route path="/admin/staff-directory" component={StaffDirectory} />
      <Route path="/admin/teams/:id" component={TeamDetailPage} />
      <Route path="/admin/career-applications" component={CareerApplications} />
      <Route path="/admin/courses" component={AdminCourseManagement} />
      <Route path="/admin/quiz-management" component={QuizManagement} />
      <Route path="/parent/certificates" component={CertificateGallery} />
      <Route path="/coach-availability" component={CoachAvailabilityManagement} />
      <Route path="/admin/team-assignment" component={TeamAssignment} />
      <Route path="/team-rosters" component={TeamRosters} />
      <Route path="/finance" component={Finance} />
      <Route path="/executive-dashboard" component={ExecutiveDashboard} />
      <Route path="/scholarships" component={ScholarshipManagement} />
      <Route path="/staff-costs" component={StaffCostTracking} />
      <Route path="/billing/plans" component={SubscriptionPlans} />
      <Route path="/billing/success" component={BillingSuccess} />
      <Route path="/training-hub" component={TrainingHub} />
      <Route path="/session-execution" component={SessionExecution} />
      <Route path="/succession-planning" component={SuccessionPlanning} />
      <Route path="/profile" component={Profile} />
      <Route path="/my-fees" component={MyFees} />
      <Route path="/parent-fees" component={ParentFeePortal} />
      <Route path="/cross-team-benchmarking" component={CrossTeamBenchmarking} />
      <Route path="/events-calendar" component={EventsCalendar} />

      {/* ==================== OTHER ==================== */}
      <Route path="/idp" component={IDP} />
      <Route path="/academy-teams" component={AcademyTeams} />
      <Route path="/team-players" component={TeamPlayers} />
      <Route path="/academy-roster" component={AcademyRoster} />
      <Route path="/session-comparison" component={SessionComparison} />
      <Route path="/opponent-video-analysis" component={OpponentVideoAnalysis} />
      <Route path="/book-private-session" component={BookPrivateSession} />
      <Route path="/points-management" component={PointsManagement} />
      <Route path="/player-card" component={PlayerFIFACard} />
      <Route path="/attendance" component={AttendanceTracking} />
      <Route path="/staff-attendance" component={StaffAttendanceTracker} />
      <Route path="/location-management" component={LocationManagement} />
      <Route path="/booking-management" component={BookingManagement} />
      <Route path="/coach-reminders" component={CoachReminders} />
      <Route path="/talent-portal" component={TalentPortal} />
      <Route path="/tactical-simulation-lab" component={TacticalSimulationLab} />
      <Route path="/data-analysis-pro" component={DataAnalysisPro} />
      <Route path="/coach-progress" component={CoachProgressDashboard} />
      <Route path="/team-schedule" component={TeamScheduleCalendar} />
      <Route path="/player-attachments" component={PlayerAttachments} />
      <Route path="/advanced-tactical-hub" component={AdvancedTacticalHub} />
      <Route path="/coach-selection" component={CoachSelectionTool} />
      <Route path="/team-needs-analysis" component={TeamNeedsAnalysis} />
      <Route path="/coach-database" component={CoachDatabase} />
      <Route path="/training-innovation-hub" component={TrainingInnovationHub} />
      <Route path="/player-development-plan" component={PlayerDevelopmentPlan} />

      <Route path="/team-management" component={TeamManagement} />
      <Route path="/load-management" component={LoadManagementDashboard} />
      <Route path="/training-session-recorder" component={TrainingSessionRecorder} />
      <Route path="/player-full-report" component={PlayerFullReport} />
      <Route path="/full-player-report" component={FullPlayerReport} />
      <Route path="/team-doctor" component={TeamDoctorDashboard} />
      <Route path="/multi-match-comparison" component={MultiMatchComparison} />
      <Route path="/parent-notification-center" component={ParentNotificationCenter} />
      <Route path="/weekly-report-scheduler" component={WeeklyReportScheduler} />
      <Route path="/coach-registration" component={CoachRegistration} />
      <Route path="/player-documents" component={PlayerDocuments} />
      <Route path="/medical-trends" component={MedicalTrendsPage} />
      <Route path="/video-telestration" component={VideoTelestration} />
      <Route path="/age-group-benchmarking" component={AgeGroupBenchmarking} />
      <Route path="/animated-tactical-board" component={AnimatedTacticalBoard} />

      {/* ==================== FALLBACK ==================== */}
      <Route path="/season-stats" component={SeasonStatsDashboard} />
      <Route path="/nutrition-plan-assignment" component={NutritionPlanAssignment} />

      {/* ==================== ROUTE ALIASES (fix 404s) ==================== */}
      {/* Staff Directory: nav links to /staff-directory but route is /admin/staff-directory */}
      <Route path="/staff-directory" component={StaffDirectory} />
      {/* Player Scouting Report: nav links to /player-scouting-report */}
      <Route path="/player-scouting-report" component={PlayerScoutingReport} />
      {/* Player Progress Dashboard: nav links to /player-progress-dashboard */}
      <Route path="/player-progress-dashboard" component={PlayerProgressDashboard} />
      {/* Tactical Hub: back arrows from FormationBuilder/SetPieceDesigner link to /tactical-hub */}
      <Route path="/tactical-hub" component={AdvancedTacticalHub} />
      {/* Orphaned pages now activated */}
      <Route path="/tactical-simulation" component={TacticalSimulation} />
      <Route path="/realtime-match-tracking" component={RealtimeMatchTracking} />
      <Route path="/device-integration" component={DeviceIntegrationHub} />
      <Route path="/punishments" component={Punishments} />
      <Route path="/locker-room" component={DigitalLockerRoom} />
      <Route path="/player-locker-room" component={PlayerLockerRoom} />
      <Route path="/pro-club-hub" component={ProClubHub} />
      <Route path="/match-intelligence" component={MatchIntelligenceHub} />
      <Route path="/match-analysis-engine" component={MatchAnalysisEngine} />
      {/* /admin redirect to Settings */}
      <Route path="/admin">{() => { const [, nav] = useLocation(); useEffect(() => nav('/settings', { replace: true }), []); return null; }}</Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />

            </Switch>
          </Suspense>
        </DashboardLayout>
      </Route>
    </Switch></Suspense>
  );
}


/* Full-screen loader — only used for public pages, which have no persistent chrome. */
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

/* Content-area loader — sits inside DashboardLayout so the sidebar and header
   stay on screen while the next page's chunk loads. */
const ContentLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <>
      {/* Skip to main content - accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:font-medium"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
    </>
  );
}

export default App;
