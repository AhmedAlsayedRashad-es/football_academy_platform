import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  tip?: string;
}

interface TutorialSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  steps: TutorialStep[];
}

const TUTORIALS: TutorialSection[] = [
  {
    id: 'dashboard', title: 'Dashboard Overview', icon: '🏠', color: 'bg-blue-500',
    steps: [
      { title: 'Welcome to the Academy Platform', description: 'The Dashboard is your command center. It shows key metrics: total players, active teams, upcoming sessions, and recent activity across all tools.', tip: 'Click any metric card to navigate directly to that section.' },
      { title: 'Navigation Sidebar', description: 'The left sidebar organizes all tools into categories: Team Management, AI Coaching Tools, Player Development, and Analytics. Click any item to navigate.', tip: 'The sidebar collapses on mobile — tap the menu icon to expand it.' },
      { title: 'Quick Actions', description: 'Use the top-right area to access notifications, your profile, and the Help/Tutorial button. The platform auto-saves your work.', tip: 'The Tutorial button (?) is available on every page.' },
    ],
  },
  {
    id: 'teams', title: 'Team Management', icon: '👥', color: 'bg-green-500',
    steps: [
      { title: 'Creating a Team', description: 'Go to Teams → Create Team. Enter the team name, age group (U-7, U-9, U-11, etc.), and assign a head coach. Teams are the foundation for all other tools.', tip: 'Create separate teams for 7v7, 9v9, and 11v11 formats.' },
      { title: 'Adding Players to a Team', description: 'Open a team and click "Add Player". Fill in the player\'s name, position, date of birth, and jersey number. Players can only belong to one team at a time.', tip: 'Use the bulk import feature to add multiple players via CSV.' },
      { title: 'Team Roster View', description: 'The roster shows all players with their positions, attendance rate, and development status. Click any player to open their full profile.', tip: 'Filter by position to quickly find specific players.' },
    ],
  },
  {
    id: 'training', title: 'Training Sessions', icon: '📅', color: 'bg-orange-500',
    steps: [
      { title: 'Calendar View', description: 'The Training page shows a monthly calendar. Each colored block represents a session: Blue=Technical, Purple=Tactical, Orange=Physical, Red=Match, Green=Recovery, Gray=Mixed.', tip: 'Switch between Calendar and List view using the toggle button.' },
      { title: 'Scheduling a Session', description: 'Click any day on the calendar to open the quick-add dialog. Select the team, enter a title, set the time and location, and choose the session type. Click "Create Session" to save.', tip: 'Filter the calendar by team to see only that team\'s sessions.' },
      { title: 'Managing Sessions', description: 'In List View, each session card has Start and Complete buttons. Use these to track session status in real-time. Sessions show attendance count after completion.', tip: 'Add objectives to sessions so players know what to focus on.' },
    ],
  },
  {
    id: 'ai_formation', title: 'AI Formation Simulation', icon: '⚽', color: 'bg-purple-500',
    steps: [
      { title: 'Generating a Simulation', description: 'Select a formation (e.g., 4-3-3) and tactical scenario (Attack, Defense, Counter, Possession). Click "Generate AI Simulation" to create animated player movement keyframes.', tip: 'Add a description of your tactical idea before generating for more specific results.' },
      { title: 'Playback Controls', description: 'Use Play/Pause, Rewind, and Fast Forward to navigate through the animation. Adjust Playback Speed with the slider. The scrubber bar shows your position in the animation.', tip: 'Use the frame counter to reference specific moments when discussing with players.' },
      { title: 'Tactical Annotations', description: 'Click Pen, Arrow, or Circle in the Tactical Annotations panel to draw on the pitch. Choose a color, draw your annotation, then click Save Annotations to preserve it.', tip: 'Use Screenshot to export the pitch with your annotations as a PNG file.' },
      { title: 'Comparison Mode', description: 'Enable Compare Mode to show two formations side-by-side. Generate simulations for both and click "Compare Formations" for AI analysis of the tactical differences.', tip: 'Save frequently used formations as Templates for quick access.' },
    ],
  },
  {
    id: 'set_piece', title: 'Set Piece Simulation', icon: '🎯', color: 'bg-red-500',
    steps: [
      { title: 'Choosing a Scenario', description: 'Select Corner, Penalty, or Free Kick from the tabs on the left. Each category has multiple pre-built scenarios with success rate percentages.', tip: 'Higher success rate scenarios are generally safer but less surprising.' },
      { title: 'Viewing the Simulation', description: 'The canvas shows the pitch with your team (blue), opponents (red), and the goalkeeper (green). Player positions are geometrically accurate for each scenario.', tip: 'Click Replay to re-watch the animation.' },
      { title: 'AI Set-Piece Plan', description: 'Fill in Opponent Info (formation, players on field, scouting notes) and click "Generate AI Set-Piece Plan" for a customized tactical recommendation based on the opponent\'s weaknesses.', tip: 'Add match context (e.g., "85th min, losing 1-0") for more urgent tactical advice.' },
    ],
  },
  {
    id: 'emergency', title: 'AI Emergency Mode', icon: '🚨', color: 'bg-rose-600',
    steps: [
      { title: 'When to Use', description: 'Use AI Emergency Mode during a match when you need an immediate tactical change. Enter the current minute, score, your formation, and how many players you have on the field.', tip: 'Works for 7v7, 9v9, and 11v11 formats — select the appropriate formation.' },
      { title: 'Getting Suggestions', description: 'Click "AI Suggest Formation vs Opponent" for a formation recommendation based on the opponent\'s setup. Then click "Generate Emergency Plan" for a full tactical briefing.', tip: 'Add opponent scouting notes (e.g., "weak right back") for more targeted advice.' },
      { title: 'Reading the Tactical Board', description: 'The pitch diagram shows your team (blue) vs opponent (red). Green = Weak Zone to exploit. Yellow = Target Area for attack. Use this visual to brief players quickly during a timeout.', tip: 'Print or screenshot the tactical board to show players during the break.' },
    ],
  },
  {
    id: 'coach_selection', title: 'AI Coach Selection', icon: '🧑‍💼', color: 'bg-indigo-500',
    steps: [
      { title: 'Setting Team Requirements', description: 'Fill in your team\'s age group, preferred playing style, and select one or more formations (you can choose multiple). Add extra notes for specific requirements like "Arabic-speaking" or "experienced with youth academies".', tip: 'The more specific your requirements, the better the match results.' },
      { title: 'Running the Match', description: 'Click "Find Best Coach Match" to score all coaches in the database against your requirements. The algorithm evaluates formation fit, playing style, skill alignment, and weakness coverage.', tip: 'Scores above 80% indicate an excellent match.' },
      { title: 'Reviewing Results', description: 'Results show each coach\'s overall match percentage, key strengths, and why they\'re a good fit. Click a coach card to see their full profile including career history and coaching philosophy.', tip: 'Use the filter to show only Egyptian coaches or sort by experience level.' },
    ],
  },
  {
    id: 'player_dev', title: 'Player Development Plans', icon: '📈', color: 'bg-teal-500',
    steps: [
      { title: 'Filtering Players', description: 'Use the 3-level filter: first select a Team, then filter by Position (GK, CB, CM, etc.), then search by Player Name. This narrows down the player list to find the right player quickly.', tip: 'Leave Position and Name empty to see all players in a team.' },
      { title: 'Creating Individual Plans', description: 'Select a player and click "Create Development Plan". Add goals with categories (Technical, Physical, Tactical, Mental), priority levels, target dates, and progress tracking.', tip: 'Set realistic target dates — 4-8 weeks per goal is typical for youth players.' },
      { title: 'Group Development Plans', description: 'Switch to "Group Plan" mode to create shared goals for multiple players at once. Select players from the list, define the group goal, and all selected players will have it added to their plans.', tip: 'Group plans are ideal for position-specific training (e.g., all defenders work on aerial duels).' },
    ],
  },
  {
    id: 'team_needs', title: 'Team Needs Analysis', icon: '🔍', color: 'bg-amber-500',
    steps: [
      { title: 'Selecting a Team', description: 'Use the Team filter at the top to analyze a specific team. Each team has its own needs analysis based on the players in its roster and their skill assessments.', tip: 'Run analysis for each team separately to get accurate position-specific gaps.' },
      { title: 'Running the Analysis', description: 'Click "Run Analysis" to generate a skill gap report. The AI analyzes all players\' positions and ratings to identify which positions are weak and need reinforcement.', tip: 'Analysis is most accurate when all players have up-to-date skill ratings.' },
      { title: 'Reading the Results', description: 'Three tabs: Position Gaps (which positions need players), Skill Gap Analysis (specific skills that are below average), and Recruitment Targets (recommended player profiles to recruit).', tip: 'Recruitment Targets include links to Wyscout, Transfermarkt, and BEPRO for scouting.' },
    ],
  },
  {
    id: 'nutrition', title: 'Nutrition AI', icon: '🥗', color: 'bg-lime-500',
    steps: [
      { title: 'Analyzing a Meal', description: 'Upload a photo of a meal (JPG/PNG up to 10MB) or type a description in the text box. Click "Analyze Meal" to get AI-powered nutrition analysis with calories, protein, carbs, fat, fiber, and hydration.', tip: 'Only upload photos of actual food/meals — the AI will reject non-food images.' },
      { title: 'Reading the Analysis', description: 'The Nutrition Score (0-100) rates how suitable the meal is for athletic performance. The AI provides specific recommendations for improving the meal (e.g., "Add olive oil for healthy fats").', tip: 'A score above 70 is good for pre-training meals. Aim for 80+ for recovery meals.' },
      { title: 'Logging Meals', description: 'Click "Log to Diary" to save the meal to the player\'s nutrition history. View the History tab to see all logged meals and track daily calorie/macro intake over time.', tip: 'Set Daily Goals in the Goals tab to track whether players are meeting their nutritional targets.' },
    ],
  },
  {
    id: 'medical', title: 'Player Medical Profile', icon: '🏥', color: 'bg-cyan-500',
    steps: [
      { title: 'Accessing the Profile', description: 'Open any player\'s dashboard and click the "Medical" button in the header. The Medical Profile has 6 tabs: Overview, Physical Tests, Muscle Measurements, Training Load, Medical History, and Blood Markers.', tip: 'Only medical staff and head coaches can edit medical data.' },
      { title: 'Physical Tests & Measurements', description: 'The Physical Tests tab tracks speed (10m/30m sprint), strength (bench press, squat), endurance (VO₂ max, Yo-Yo test), flexibility (sit-and-reach), and agility (Illinois test). Compare against age-group benchmarks.', tip: 'Re-test every 6-8 weeks to track physical development progress.' },
      { title: 'Muscle Measurements & Load', description: 'The Muscle Measurements tab tracks bilateral circumference (left vs right) to detect imbalances. The Training Load tab shows the Acute:Chronic Workload Ratio (A:C) — keep it between 0.8-1.3 to minimize injury risk.', tip: 'A:C ratio above 1.5 means the player is overloaded — reduce training intensity immediately.' },
    ],
  },
  {
    id: 'training_hub', title: 'Smart Training Innovation Hub', icon: '💡', color: 'bg-violet-500',
    steps: [
      { title: 'Choosing Team Format', description: 'Select your team format: 7v7 (U-7/U-9), 9v9 (U-11/U-12), or 11v11 (U-13+). Each format has age-appropriate drills, formations, and training methodologies.', tip: 'The AI adapts all recommendations to the selected team format.' },
      { title: 'AI Session Planner', description: 'Enter your session focus (e.g., "Pressing and high defensive line"), duration, and intensity level. Click "Generate Session Plan" for a complete training session with warm-up, main drills, and cool-down.', tip: 'Include specific weaknesses from the Team Needs Analysis for targeted sessions.' },
      { title: 'Drill Library', description: 'Browse the Drill Library by category (Passing, Shooting, Defending, etc.) and team format. Each drill includes setup instructions, coaching points, and variations for different skill levels.', tip: 'Save favorite drills to your Quick Access list for faster session planning.' },
    ],
  },
  {
    id: 'performance', title: 'Performance Prediction', icon: '📊', color: 'bg-pink-500',
    steps: [
      { title: 'Selecting Prediction Type', description: 'Choose between Team Performance (predicts the team\'s upcoming match performance) or Player Performance (predicts an individual player\'s performance). Select the team or player from the dropdown.', tip: 'Predictions are most accurate when the team has match history and player ratings.' },
      { title: 'Generating a Prediction', description: 'Click "Generate Prediction" to run the AI analysis. The system analyzes recent form, player fitness, tactical patterns, and historical data to generate a confidence-rated forecast.', tip: 'A confidence level above 70% means the prediction is based on sufficient data.' },
      { title: 'Reading the Report', description: 'The report includes: Overall Prediction, Performance Trend (improving/declining), Key Factors (what\'s driving the prediction), Recommendations (what to work on), and Risk Factors (potential issues).', tip: 'Use the recommendations to plan your next training session focus areas.' },
    ],
  },
];

interface PlatformTutorialProps {
  open: boolean;
  onClose: () => void;
}

export default function PlatformTutorial({ open, onClose }: PlatformTutorialProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const section = TUTORIALS.find(t => t.id === selectedSection);

  const handleSelectSection = (id: string) => {
    setSelectedSection(id);
    setCurrentStep(0);
  };

  const handleBack = () => {
    setSelectedSection(null);
    setCurrentStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {section ? (
              <span className="flex items-center gap-2">
                <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {section.icon} {section.title}
              </span>
            ) : (
              'Platform Tutorial'
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!section ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Select a section below to learn how to use it step by step.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TUTORIALS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectSection(t.id)}
                    className="flex items-center gap-3 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className={`w-10 h-10 rounded-lg ${t.color} flex items-center justify-center text-xl flex-shrink-0`}>
                      {t.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">{t.title}</div>
                      <div className="text-xs text-muted-foreground">{t.steps.length} steps</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {section.steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-2 rounded-full transition-all ${idx === currentStep ? 'bg-primary w-8' : idx < currentStep ? 'bg-primary/40 w-4' : 'bg-muted w-4'}`}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-auto">
                  Step {currentStep + 1} of {section.steps.length}
                </span>
              </div>

              <div className="rounded-lg border p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${section.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {currentStep + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{section.steps[currentStep].title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {section.steps[currentStep].description}
                    </p>
                  </div>
                </div>
                {section.steps[currentStep].tip && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                    <span className="text-amber-700 dark:text-amber-500 text-sm">💡</span>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Tip:</strong> {section.steps[currentStep].tip}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                {currentStep < section.steps.length - 1 ? (
                  <Button size="sm" onClick={() => setCurrentStep(s => s + 1)}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleBack} className="bg-green-600 hover:bg-green-700 text-white">
                    Done
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
