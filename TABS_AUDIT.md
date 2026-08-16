# Football Academy Platform - Tabs & Pages Audit

## Current State Analysis

### Total Routes: 98 pages

---

## DUPLICATES IDENTIFIED

### 1. AI Emergency Mode (DUPLICATE)
- `/ai-emergency-mode` → AIEmergencyModeEnhanced
- `/ai-emergency-mode-enhanced` → AIEmergencyModeEnhanced
**Action: Remove `/ai-emergency-mode-enhanced` - same component**

### 2. Video Analysis (3 VERSIONS - CONFUSING)
- `/video-analysis` → VideoAnalysis
- `/video-analysis-advanced` → VideoAnalysisAdvanced
- `/coach/ai-video-analysis` → AIVideoAnalysis
- `/tactical-video-analysis` → TacticalVideoAnalysis
- `/opponent-video-analysis` → OpponentVideoAnalysis
**Action: Consolidate into 2 max - General Video Analysis + AI Video Analysis**

### 3. AI Coach/Assistant (MULTIPLE VERSIONS)
- `/coach/ai-assistant` → CoachAIAssistant
- `/ai-coach` → AICoachAssistant (Enhanced)
- `/ai-match-coach` → AIMatchCoach
**Action: Keep only AI Coach Assistant (main) + AI Match Coach (live)**

### 4. Tactical Board (4 VERSIONS!)
- `/professional-tactical-board` → ProfessionalTacticalBoard
- `/tactical-board-2d` → TacticalBoard2D
- `/formation-builder` → FormationBuilder
- `/tactical-simulation` → TacticalSimulation
- `/tactical-simulation-lab` → TacticalSimulationLab
- `/ai-tactical-planner` → AITacticalPlanner
**Action: Keep Professional Tactical Board + Formation Builder only**

### 5. Player Dashboard (DUPLICATE)
- `/player/:id` → PlayerDashboard
- `/player-dashboard` → PlayerDashboard
**Action: Remove `/player-dashboard` - use `/player/:id` only**

### 6. Coach Dashboard (SIMILAR)
- `/coach-dashboard` → CoachDashboard
- `/coach-progress` → CoachProgressDashboard
**Action: Merge into one Coach Dashboard**

---

## LOW VALUE / INCOMPLETE PAGES

### 1. Pages with No Real Functionality
- `/explore` → Explore (placeholder)
- `/talent-portal` → TalentPortal (placeholder)
- `/session-comparison` → SessionComparison (limited use)
- `/match-review-3d` → MatchReview3D (not working properly)
- `/attack-sequence` → AttackSequenceAnimator (complex, rarely used)

### 2. Redundant Analytics
- `/analytics` → Analytics
- `/data-analysis-pro` → DataAnalysisPro
- `/xg-analytics` → XGAnalytics
**Action: Merge into one Analytics Hub**

---

## PROPOSED MODULE STRUCTURE

### Module 1: Dashboard & Overview
- `/dashboard` - Main Dashboard
- `/coach-dashboard` - Coach Overview (merged)

### Module 2: Player Management
- `/players` - All Players List
- `/player/:id` - Player Profile
- `/players/:id/scorecard` - Player Scorecard

### Module 3: Training & Development
- `/training` - Training Sessions
- `/training-library` - Training Drills Library
- `/coach/training-planner` - AI Training Planner
- `/skill-assessment` - Skill Assessment

### Module 4: Match & Tactics
- `/matches` - Match Management
- `/coach/live-match` - Live Match Mode
- `/professional-tactical-board` - Tactical Board
- `/formation-builder` - Formation Builder
- `/set-piece-designer` - Set Piece Designer
- `/match-event-recording` - Record Match Events

### Module 5: Video & Analysis
- `/videos` - Video Library
- `/video-clip-library` - Video Clips
- `/coach/ai-video-analysis` - AI Video Analysis
- `/professional-heatmap` - Heatmap Analysis
- `/pass-network` - Pass Network

### Module 6: AI Tools
- `/ai-coach` - AI Coach Assistant
- `/ai-match-coach` - AI Match Coach (Live)
- `/ai-emergency-mode` - Emergency Tactical AI
- `/coach/performance-prediction` - Performance Prediction
- `/coach/ai-formation-simulation` - Formation Simulation

### Module 7: Analytics & Reports
- `/analytics` - Performance Analytics
- `/xg-analytics` - xG Analytics
- `/match-reports` - Match Reports
- `/coach/match-report-generator` - AI Report Generator

### Module 8: Staff Tools
- `/mental` - Mental Coaching
- `/physical` - Physical Training
- `/nutrition` - Nutrition Planning
- `/coach/injury-tracking` - Injury Tracking
- `/gps-tracker` - GPS Tracking
- `/playermaker` - PlayerMaker Integration

### Module 9: Education
- `/coach-education/laws` - Football Laws
- `/coach-education/courses` - Coaching Courses
- `/coach-education/videos` - Training Videos
- `/coach-assessment` - Coach Assessment

### Module 10: Communication & Portal
- `/parent-portal` - Parent Portal
- `/forum` - Community Forum
- `/rewards` - Rewards & Gamification
- `/streak` - Daily Streaks

### Module 11: Admin
- `/settings` - Settings
- `/user-management` - User Management
- `/admin/data-management` - Data Management
- `/admin/role-management` - Role Management
- `/admin/home-content` - Home Page Editor
- `/admin/cache` - Cache Management

---

## PAGES TO REMOVE (15 pages)

1. `/ai-emergency-mode-enhanced` - Duplicate
2. `/player-dashboard` - Duplicate
3. `/video-analysis` - Merge with AI Video Analysis
4. `/video-analysis-advanced` - Merge with AI Video Analysis
5. `/tactical-video-analysis` - Merge with AI Video Analysis
6. `/tactical-board-2d` - Keep Professional only
7. `/tactical-simulation` - Merge with Tactical Board
8. `/tactical-simulation-lab` - Merge with Tactical Board
9. `/ai-tactical-planner` - Merge with AI Coach
10. `/coach/ai-assistant` - Keep /ai-coach only
11. `/coach-progress` - Merge with Coach Dashboard
12. `/data-analysis-pro` - Merge with Analytics
13. `/explore` - No value
14. `/talent-portal` - Incomplete
15. `/attack-sequence` - Complex, rarely used

---

## AI TOOLS STATUS

| Tool | Route | Status | Real AI? |
|------|-------|--------|----------|
| AI Coach Assistant | /ai-coach | ✅ Working | ✅ Yes |
| AI Match Coach | /ai-match-coach | ✅ Working | ✅ Yes |
| AI Emergency Mode | /ai-emergency-mode | ✅ Working | ✅ Yes |
| AI Video Analysis | /coach/ai-video-analysis | ✅ Working | ✅ Yes |
| AI Training Planner | /coach/training-planner | ✅ Working | ✅ Yes |
| AI Report Generator | /coach/match-report-generator | ✅ Working | ✅ Yes |
| AI Formation Simulation | /coach/ai-formation-simulation | ✅ Working | ✅ Yes |
| Performance Prediction | /coach/performance-prediction | ✅ Working | ✅ Yes |
| Player Comparison | /coach/player-comparison | ✅ Working | ✅ Yes |
| AI Calendar | /coach/ai-calendar | ✅ Working | ✅ Yes |
| AI Dashboard | /coach/ai-dashboard | ✅ Working | ✅ Yes |

**All AI tools use real LLM (invokeLLM) - NOT fake/hardcoded**

---

## BILINGUAL STATUS

### Pages with Arabic Support ✅
- Home Page
- Dashboard
- Some AI Tools

### Pages Missing Arabic ❌
- Most sub-pages
- Admin pages
- Coach Education
- Video Analysis pages
- Tactical pages

---

## NEXT STEPS

1. Remove 15 duplicate/low-value pages
2. Reorganize sidebar into 11 modules
3. Add Arabic translations to all remaining pages
4. Test all AI tools
5. Create unified navigation experience
