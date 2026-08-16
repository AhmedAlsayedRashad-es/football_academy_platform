import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  User, Activity, Heart, TrendingUp, Calendar, Award, AlertTriangle,
  FileText, Printer, Download, Star, Target, Zap, Shield, Clock,
  CheckCircle, XCircle, BarChart3, Utensils, Dumbbell, ArrowLeft
} from "lucide-react";

// Sample comprehensive player data for the 3 demo players
const PLAYER_REPORTS: Record<string, any> = {
  "1003": {
    profile: {
      id: 1003, name: "Omar Khaled", position: "Central Midfielder", jerseyNumber: 8,
      dob: "2007-04-15", age: 17, nationality: "Egyptian", height: 176, weight: 68,
      foot: "Right", joinDate: "2023-09-01", team: "Future Stars U17",
      status: "active", bloodType: "A+", phone: "+20 100 234 5678",
      parentName: "Khaled Ibrahim", parentPhone: "+20 100 234 5679",
      address: "Nasr City, Cairo", school: "Future Stars FC Secondary School",
    },
    attendance: {
      total: 92, present: 82, absent: 6, late: 4,
      rate: 89.1, matchesPlayed: 8, matchesMissed: 0,
      monthlyBreakdown: [
        { month: "Sep 2024", sessions: 18, present: 16, rate: 88.9 },
        { month: "Oct 2024", sessions: 20, present: 17, rate: 85.0 },
        { month: "Nov 2024", sessions: 18, present: 16, rate: 88.9 },
        { month: "Dec 2024", sessions: 16, present: 15, rate: 93.8 },
        { month: "Jan 2025", sessions: 20, present: 18, rate: 90.0 },
      ]
    },
    performance: {
      matchesPlayed: 8, goals: 3, assists: 5, yellowCards: 1, redCards: 0,
      avgRating: 7.8, minutesPlayed: 680, passAccuracy: 87, tacklesWon: 24,
      distanceCovered: 9.2, topSpeed: 28.4,
      recentMatches: [
        { opponent: "ENPPI U17", date: "2025-03-01", result: "W 3-1", rating: 8.2, goals: 1, assists: 2, minutes: 90 },
        { opponent: "Zamalek U17", date: "2025-02-15", result: "D 1-1", rating: 7.5, goals: 0, assists: 1, minutes: 90 },
        { opponent: "Pyramids U17", date: "2025-02-01", result: "W 2-0", rating: 8.0, goals: 1, assists: 1, minutes: 90 },
        { opponent: "Smouha U17", date: "2025-01-18", result: "W 4-2", rating: 7.8, goals: 1, assists: 1, minutes: 85 },
      ]
    },
    skills: {
      baseline: { passing: 68, dribbling: 65, shooting: 58, defending: 62, speed: 70, stamina: 72, heading: 60, positioning: 65, vision: 70, leadership: 65 },
      current:  { passing: 82, dribbling: 78, shooting: 70, defending: 74, speed: 78, stamina: 82, heading: 68, positioning: 78, vision: 82, leadership: 75 },
      assessmentDates: ["Sep 2023 (Enrollment)", "Mar 2024", "Sep 2024", "Mar 2025"],
    },
    medical: {
      ecgStatus: "Normal sinus rhythm", echoStatus: "Normal cardiac function",
      bloodPressure: "118/76 mmHg", restingHR: 58, vo2Max: 58.2,
      lastMedicalCheck: "2025-01-10", nextMedicalCheck: "2025-07-10",
      bloodMarkers: [
        { test: "Hemoglobin", value: "15.2 g/dL", status: "normal" },
        { test: "Ferritin", value: "42 ng/mL", status: "normal" },
        { test: "Vitamin D", value: "38 ng/mL", status: "normal" },
        { test: "Testosterone", value: "18.2 nmol/L", status: "normal" },
        { test: "CRP", value: "0.8 mg/L", status: "normal" },
      ],
      injuries: [
        { type: "Hamstring Strain (Grade 2)", date: "Oct 2024", recovery: "3 weeks", status: "recovered" },
        { type: "Ankle Sprain (Grade 1)", date: "Jan 2025", recovery: "2 weeks", status: "recovered" },
        { type: "Knee Contusion", date: "Mar 2025", recovery: "1 week", status: "active" },
      ]
    },
    nutrition: {
      avgDailyCalories: 2850, avgProtein: 142, avgCarbs: 340, avgFats: 85,
      hydrationGoal: 3000, complianceRate: 88,
      notes: "Excellent nutritional compliance. Slight iron deficiency risk during high-intensity periods — monitor ferritin levels."
    },
    load: {
      currentACWR: 1.09, riskLevel: "Optimal", avgWeeklyLoad: 2084,
      trend: "stable", recommendation: "Maintain current load. Consider 5% increase in next training block."
    },
    rewards: [
      { title: "Player of the Month", date: "Oct 2024", category: "Performance" },
      { title: "Best Passer Award", date: "Dec 2024", category: "Technical" },
      { title: "100% Attendance Badge", date: "Nov 2024", category: "Commitment" },
    ],
    coachNotes: "Omar has shown remarkable improvement in vision and passing range. His leadership on the pitch has grown significantly. Recommend consideration for team captain role next season. Needs to improve aerial ability and first-touch under pressure."
  },
  "1004": {
    profile: {
      id: 1004, name: "Youssef Mahmoud", position: "Striker", jerseyNumber: 9,
      dob: "2007-08-22", age: 17, nationality: "Egyptian", height: 182, weight: 74,
      foot: "Right", joinDate: "2023-09-01", team: "Future Stars U17",
      status: "caution", bloodType: "B+", phone: "+20 101 345 6789",
      parentName: "Mahmoud Hassan", parentPhone: "+20 101 345 6790",
      address: "Heliopolis, Cairo", school: "Heliopolis Language School",
    },
    attendance: {
      total: 92, present: 78, absent: 10, late: 4,
      rate: 84.8, matchesPlayed: 6, matchesMissed: 2,
      monthlyBreakdown: [
        { month: "Sep 2024", sessions: 18, present: 15, rate: 83.3 },
        { month: "Oct 2024", sessions: 20, present: 14, rate: 70.0 },
        { month: "Nov 2024", sessions: 18, present: 16, rate: 88.9 },
        { month: "Dec 2024", sessions: 16, present: 15, rate: 93.8 },
        { month: "Jan 2025", sessions: 20, present: 18, rate: 90.0 },
      ]
    },
    performance: {
      matchesPlayed: 6, goals: 8, assists: 2, yellowCards: 2, redCards: 0,
      avgRating: 8.1, minutesPlayed: 490, passAccuracy: 74, tacklesWon: 8,
      distanceCovered: 8.8, topSpeed: 31.2,
      recentMatches: [
        { opponent: "ENPPI U17", date: "2025-03-01", result: "W 3-1", rating: 8.8, goals: 2, assists: 0, minutes: 90 },
        { opponent: "Zamalek U17", date: "2025-02-15", result: "D 1-1", rating: 7.2, goals: 1, assists: 0, minutes: 90 },
        { opponent: "Pyramids U17", date: "2025-02-01", result: "W 2-0", rating: 8.5, goals: 2, assists: 0, minutes: 80 },
        { opponent: "Smouha U17", date: "2025-01-18", result: "W 4-2", rating: 8.0, goals: 2, assists: 1, minutes: 75 },
      ]
    },
    skills: {
      baseline: { passing: 60, dribbling: 72, shooting: 75, defending: 45, speed: 80, stamina: 68, heading: 72, positioning: 74, vision: 65, leadership: 58 },
      current:  { passing: 70, dribbling: 84, shooting: 88, defending: 52, speed: 88, stamina: 76, heading: 80, positioning: 85, vision: 74, leadership: 68 },
      assessmentDates: ["Sep 2023 (Enrollment)", "Mar 2024", "Sep 2024", "Mar 2025"],
    },
    medical: {
      ecgStatus: "Normal sinus rhythm", echoStatus: "Normal cardiac function",
      bloodPressure: "122/78 mmHg", restingHR: 55, vo2Max: 62.1,
      lastMedicalCheck: "2025-01-10", nextMedicalCheck: "2025-07-10",
      bloodMarkers: [
        { test: "Hemoglobin", value: "15.8 g/dL", status: "normal" },
        { test: "Ferritin", value: "38 ng/mL", status: "normal" },
        { test: "Vitamin D", value: "28 ng/mL", status: "borderline" },
        { test: "Testosterone", value: "20.1 nmol/L", status: "normal" },
        { test: "CRP", value: "1.2 mg/L", status: "normal" },
      ],
      injuries: [
        { type: "Quadriceps Strain (Grade 3)", date: "Sep 2024", recovery: "7 weeks", status: "recovered" },
        { type: "Ankle Sprain (Grade 2)", date: "Feb 2025", recovery: "3 weeks", status: "recovered" },
        { type: "Patellar Tendinopathy", date: "Mar 2025", recovery: "4 weeks", status: "active" },
      ]
    },
    nutrition: {
      avgDailyCalories: 3100, avgProtein: 165, avgCarbs: 370, avgFats: 92,
      hydrationGoal: 3500, complianceRate: 82,
      notes: "High energy demands as striker. Vitamin D supplementation recommended (1000 IU/day). Increase carbohydrate intake on match days."
    },
    load: {
      currentACWR: 1.47, riskLevel: "Caution Zone", avgWeeklyLoad: 2086,
      trend: "increasing", recommendation: "REDUCE training load by 20-25% this week. Mandatory rest day. No high-intensity sprinting until ACWR drops below 1.3."
    },
    rewards: [
      { title: "Top Scorer Award", date: "Feb 2025", category: "Performance" },
      { title: "Hat-trick Achievement", date: "Jan 2025", category: "Performance" },
    ],
    coachNotes: "Youssef is the team's most clinical finisher. Exceptional in front of goal. Current injury concern with patellar tendinopathy — load management is critical. Needs to improve defensive contribution and work rate off the ball. Vitamin D deficiency should be addressed with supplementation."
  },
  "1001": {
    profile: {
      id: 1001, name: "Ahmed Sayed", position: "Goalkeeper", jerseyNumber: 1,
      dob: "2007-01-10", age: 18, nationality: "Egyptian", height: 188, weight: 82,
      foot: "Right", joinDate: "2023-09-01", team: "Future Stars U17",
      status: "active", bloodType: "O+", phone: "+20 102 456 7890",
      parentName: "Sayed Ahmed", parentPhone: "+20 102 456 7891",
      address: "Maadi, Cairo", school: "Maadi International School",
    },
    attendance: {
      total: 92, present: 88, absent: 3, late: 1,
      rate: 95.7, matchesPlayed: 8, matchesMissed: 0,
      monthlyBreakdown: [
        { month: "Sep 2024", sessions: 18, present: 18, rate: 100.0 },
        { month: "Oct 2024", sessions: 20, present: 19, rate: 95.0 },
        { month: "Nov 2024", sessions: 18, present: 17, rate: 94.4 },
        { month: "Dec 2024", sessions: 16, present: 16, rate: 100.0 },
        { month: "Jan 2025", sessions: 20, present: 18, rate: 90.0 },
      ]
    },
    performance: {
      matchesPlayed: 8, goals: 0, assists: 0, yellowCards: 0, redCards: 0,
      avgRating: 7.9, minutesPlayed: 720, cleanSheets: 4, savePercentage: 78.5,
      distanceCovered: 5.8, topSpeed: 24.1,
      recentMatches: [
        { opponent: "ENPPI U17", date: "2025-03-01", result: "W 3-1", rating: 7.8, saves: 4, cleanSheet: false, minutes: 90 },
        { opponent: "Zamalek U17", date: "2025-02-15", result: "D 1-1", rating: 7.5, saves: 6, cleanSheet: false, minutes: 90 },
        { opponent: "Pyramids U17", date: "2025-02-01", result: "W 2-0", rating: 8.5, saves: 5, cleanSheet: true, minutes: 90 },
        { opponent: "Smouha U17", date: "2025-01-18", result: "W 4-2", rating: 7.8, saves: 3, cleanSheet: false, minutes: 90 },
      ]
    },
    skills: {
      baseline: { reflexes: 72, positioning: 70, distribution: 62, aerialAbility: 68, commanding: 65, shotStopping: 74, footwork: 60, communication: 68, concentration: 72, leadership: 70 },
      current:  { reflexes: 84, positioning: 82, distribution: 76, aerialAbility: 78, commanding: 78, shotStopping: 86, footwork: 72, communication: 80, concentration: 84, leadership: 80 },
      assessmentDates: ["Sep 2023 (Enrollment)", "Mar 2024", "Sep 2024", "Mar 2025"],
    },
    medical: {
      ecgStatus: "Normal sinus rhythm", echoStatus: "Normal cardiac function",
      bloodPressure: "116/74 mmHg", restingHR: 52, vo2Max: 54.8,
      lastMedicalCheck: "2025-01-10", nextMedicalCheck: "2025-07-10",
      bloodMarkers: [
        { test: "Hemoglobin", value: "16.1 g/dL", status: "normal" },
        { test: "Ferritin", value: "52 ng/mL", status: "normal" },
        { test: "Vitamin D", value: "44 ng/mL", status: "normal" },
        { test: "Testosterone", value: "17.8 nmol/L", status: "normal" },
        { test: "CRP", value: "0.6 mg/L", status: "normal" },
      ],
      injuries: [
        { type: "Right Index Finger Fracture", date: "Nov 2024", recovery: "9 weeks", status: "recovered" },
        { type: "Lower Back Strain", date: "Feb 2025", recovery: "2 weeks", status: "recovered" },
      ]
    },
    nutrition: {
      avgDailyCalories: 2950, avgProtein: 148, avgCarbs: 320, avgFats: 98,
      hydrationGoal: 3200, complianceRate: 94,
      notes: "Excellent nutritional discipline. All blood markers within optimal range. Continue current nutrition plan."
    },
    load: {
      currentACWR: 0.94, riskLevel: "Slightly Underloaded", avgWeeklyLoad: 2086,
      trend: "stable", recommendation: "Consider 5-8% load increase in next training block. Current load is slightly below optimal."
    },
    rewards: [
      { title: "Best Goalkeeper Award", date: "Dec 2024", category: "Performance" },
      { title: "Perfect Attendance Award", date: "Sep 2024", category: "Commitment" },
      { title: "Clean Sheet Record (4 consecutive)", date: "Jan 2025", category: "Performance" },
      { title: "Most Improved Player", date: "Mar 2025", category: "Development" },
    ],
    coachNotes: "Ahmed is the most consistent player in the squad. Exceptional work ethic and attitude. His distribution has improved dramatically — now comfortable with feet. Recommend consideration for Egyptian U18 national team trials. The finger fracture recovery was handled excellently."
  }
};

function SkillBar({ label, baseline, current }: { label: string; baseline: number; current: number }) {
  const improvement = current - baseline;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">Base: {baseline}</span>
          <span className="font-bold text-gray-900">Now: {current}</span>
          <span className={`font-bold ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {improvement > 0 ? '+' : ''}{improvement}
          </span>
        </span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute h-full bg-gray-300 rounded-full" style={{ width: `${baseline}%` }} />
        <div className="absolute h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full opacity-80" style={{ width: `${current}%` }} />
      </div>
    </div>
  );
}

export default function PlayerFullReport() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("1003");
  const [dateFrom, setDateFrom] = useState("2024-09-01");
  const [dateTo, setDateTo] = useState("2025-03-24");

  const player = PLAYER_REPORTS[selectedPlayerId];
  if (!player) return null;

  const getStatusColor = (status: string) => {
    if (status === "active" || status === "normal") return "text-green-600 bg-green-50";
    if (status === "caution" || status === "borderline") return "text-yellow-600 bg-yellow-50";
    if (status === "recovered") return "text-blue-600 bg-blue-50";
    return "text-red-600 bg-red-50";
  };

  const handlePrint = () => window.print();

  return (
    <>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <PageBreadcrumb
                items={[
                  { label: "Players", labelAr: "اللاعبين", href: "/players" },
                  { label: "Full Player Report", labelAr: "تقرير اللاعب الكامل" },
                ]}
                className="mb-1"
              />
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-red-600" />
                Full Player Report
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Comprehensive player data across all categories</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1003">Omar Khaled</SelectItem>
                <SelectItem value="1004">Youssef Mahmoud</SelectItem>
                <SelectItem value="1001">Ahmed Sayed</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 h-9 text-xs" />
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 h-9 text-xs" />
            </div>
            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" /> Print Report
            </Button>
          </div>
        </div>

        {/* Player Header Card */}
        <Card className="brand-gradient text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  #{player.profile.jerseyNumber}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{player.profile.name}</h2>
                  <p className="text-red-200">{player.profile.position} · {player.profile.team}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={`text-xs ${player.profile.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                      {player.profile.status === 'active' ? '✓ Available' : 'Caution'}
                    </Badge>
                    <Badge className="bg-white/20 text-white text-xs">Age {player.profile.age}</Badge>
                    <Badge className="bg-white/20 text-white text-xs">{player.profile.nationality}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-red-600 dark:text-red-300">Height:</span> <span className="font-bold">{player.profile.height} cm</span></div>
                <div><span className="text-red-600 dark:text-red-300">Weight:</span> <span className="font-bold">{player.profile.weight} kg</span></div>
                <div><span className="text-red-600 dark:text-red-300">Blood Type:</span> <span className="font-bold">{player.profile.bloodType}</span></div>
                <div><span className="text-red-600 dark:text-red-300">Joined:</span> <span className="font-bold">{player.profile.joinDate}</span></div>
                <div><span className="text-red-600 dark:text-red-300">Foot:</span> <span className="font-bold">{player.profile.foot}</span></div>
                <div><span className="text-red-600 dark:text-red-300">DOB:</span> <span className="font-bold">{player.profile.dob}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 h-auto">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
            <TabsTrigger value="skills" className="text-xs">Skills</TabsTrigger>
            <TabsTrigger value="medical" className="text-xs">Medical</TabsTrigger>
            <TabsTrigger value="nutrition" className="text-xs">Nutrition</TabsTrigger>
            <TabsTrigger value="load" className="text-xs">Load</TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs">Rewards</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{player.attendance.rate}%</div>
                <div className="text-xs text-muted-foreground mt-1">Attendance Rate</div>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{player.performance.avgRating}</div>
                <div className="text-xs text-muted-foreground mt-1">Avg Match Rating</div>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{player.load.currentACWR}</div>
                <div className="text-xs text-muted-foreground mt-1">Current ACWR</div>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{player.rewards.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Awards Earned</div>
              </CardContent></Card>
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Coach Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">{player.coachNotes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Player Phone:</span> <span className="font-medium">{player.profile.phone}</span></div>
                  <div><span className="text-muted-foreground">Parent/Guardian:</span> <span className="font-medium">{player.profile.parentName}</span></div>
                  <div><span className="text-muted-foreground">Parent Phone:</span> <span className="font-medium">{player.profile.parentPhone}</span></div>
                  <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{player.profile.address}</span></div>
                  <div><span className="text-muted-foreground">School:</span> <span className="font-medium">{player.profile.school}</span></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ATTENDANCE TAB */}
          <TabsContent value="attendance" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Total Sessions", value: player.attendance.total, color: "text-gray-700" },
                { label: "Present", value: player.attendance.present, color: "text-green-600" },
                { label: "Absent", value: player.attendance.absent, color: "text-red-600" },
                { label: "Late", value: player.attendance.late, color: "text-yellow-600" },
                { label: "Attendance Rate", value: `${player.attendance.rate}%`, color: "text-blue-600" },
              ].map((stat, i) => (
                <Card key={i}><CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Attendance Breakdown</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2">Month</th>
                    <th className="text-center py-2">Sessions</th>
                    <th className="text-center py-2">Present</th>
                    <th className="text-center py-2">Rate</th>
                    <th className="text-right py-2">Status</th>
                  </tr></thead>
                  <tbody>
                    {player.attendance.monthlyBreakdown.map((m: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{m.month}</td>
                        <td className="py-2 text-center">{m.sessions}</td>
                        <td className="py-2 text-center text-green-600 font-medium">{m.present}</td>
                        <td className="py-2 text-center font-bold">{m.rate}%</td>
                        <td className="py-2 text-right">
                          <Badge className={`text-xs ${m.rate >= 90 ? 'bg-green-100 text-green-700' : m.rate >= 80 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {m.rate >= 90 ? 'Excellent' : m.rate >= 80 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PERFORMANCE TAB */}
          <TabsContent value="performance" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {player.profile.position === "Goalkeeper" ? (
                <>
                  <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{player.performance.matchesPlayed}</div><div className="text-xs text-muted-foreground">Matches Played</div></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{player.performance.cleanSheets}</div><div className="text-xs text-muted-foreground">Clean Sheets</div></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{player.performance.savePercentage}%</div><div className="text-xs text-muted-foreground">Save %</div></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{player.performance.avgRating}</div><div className="text-xs text-muted-foreground">Avg Rating</div></CardContent></Card>
                </>
              ) : (
                <>
                  <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{player.performance.goals}</div><div className="text-xs text-muted-foreground">Goals</div></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{player.performance.assists}</div><div className="text-xs text-muted-foreground">Assists</div></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{player.performance.avgRating}</div><div className="text-xs text-muted-foreground">Avg Rating</div></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{player.performance.minutesPlayed}'</div><div className="text-xs text-muted-foreground">Minutes Played</div></CardContent></Card>
                </>
              )}
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Match History</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2">Opponent</th>
                    <th className="text-center py-2">Date</th>
                    <th className="text-center py-2">Result</th>
                    <th className="text-center py-2">Rating</th>
                    {player.profile.position !== "Goalkeeper" ? (
                      <><th className="text-center py-2">Goals</th><th className="text-center py-2">Assists</th></>
                    ) : (
                      <><th className="text-center py-2">Saves</th><th className="text-center py-2">Clean Sheet</th></>
                    )}
                    <th className="text-right py-2">Minutes</th>
                  </tr></thead>
                  <tbody>
                    {player.performance.recentMatches.map((m: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{m.opponent}</td>
                        <td className="py-2 text-center text-muted-foreground">{m.date}</td>
                        <td className="py-2 text-center">
                          <Badge className={`text-xs ${m.result.startsWith('W') ? 'bg-green-100 text-green-700' : m.result.startsWith('D') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {m.result}
                          </Badge>
                        </td>
                        <td className="py-2 text-center font-bold">{m.rating}</td>
                        {player.profile.position !== "Goalkeeper" ? (
                          <><td className="py-2 text-center text-green-600 font-bold">{m.goals}</td><td className="py-2 text-center text-blue-600 font-bold">{m.assists}</td></>
                        ) : (
                          <><td className="py-2 text-center font-bold">{m.saves}</td><td className="py-2 text-center">{m.cleanSheet ? <CheckCircle className="h-4 w-4 text-green-600 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />}</td></>
                        )}
                        <td className="py-2 text-right text-muted-foreground">{m.minutes}'</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SKILLS TAB */}
          <TabsContent value="skills" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Skill Progression: Enrollment Baseline vs Current
                </CardTitle>
                <p className="text-xs text-muted-foreground">Assessment dates: {player.skills.assessmentDates.join(" → ")}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(player.skills.baseline).map(([skill, baseline]) => (
                  <SkillBar
                    key={skill}
                    label={skill.charAt(0).toUpperCase() + skill.slice(1).replace(/([A-Z])/g, ' $1')}
                    baseline={baseline as number}
                    current={player.skills.current[skill] as number}
                  />
                ))}
              </CardContent>
            </Card>
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {Math.round(Object.values(player.skills.baseline as Record<string, number>).reduce((a, b) => a + b, 0) / Object.keys(player.skills.baseline).length)}
                  </div>
                  <div className="text-xs text-muted-foreground">Enrollment Avg</div>
                </CardContent>
              </Card>
              <Card className="text-center bg-green-50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(Object.values(player.skills.current as Record<string, number>).reduce((a, b) => a + b, 0) / Object.keys(player.skills.current).length)}
                  </div>
                  <div className="text-xs text-muted-foreground">Current Avg</div>
                </CardContent>
              </Card>
              <Card className="text-center bg-blue-50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    +{Math.round(
                      Object.values(player.skills.current as Record<string, number>).reduce((a, b) => a + b, 0) / Object.keys(player.skills.current).length -
                      Object.values(player.skills.baseline as Record<string, number>).reduce((a, b) => a + b, 0) / Object.keys(player.skills.baseline).length
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Improvement</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* MEDICAL TAB */}
          <TabsContent value="medical" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "ECG", value: player.medical.ecgStatus, icon: Heart },
                { label: "Echo", value: player.medical.echoStatus, icon: Activity },
                { label: "Blood Pressure", value: player.medical.bloodPressure, icon: Zap },
                { label: "VO2 Max", value: `${player.medical.vo2Max} ml/kg/min`, icon: TrendingUp },
              ].map((item, i) => (
                <Card key={i}><CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-800">{item.value}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Blood Markers (FIFA/UEFA PCMA Protocol)</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2">Test</th>
                    <th className="text-center py-2">Result</th>
                    <th className="text-right py-2">Status</th>
                  </tr></thead>
                  <tbody>
                    {player.medical.bloodMarkers.map((m: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{m.test}</td>
                        <td className="py-2 text-center">{m.value}</td>
                        <td className="py-2 text-right">
                          <Badge className={`text-xs ${m.status === 'normal' ? 'bg-green-100 text-green-700' : m.status === 'borderline' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {m.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Injury History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {player.medical.injuries.map((inj: any, i: number) => (
                    <div key={i} className={`flex items-start justify-between p-3 rounded-lg ${inj.status === 'active' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                      <div>
                        <p className="font-medium text-sm">{inj.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">Date: {inj.date} · Recovery: {inj.recovery}</p>
                      </div>
                      <Badge className={`text-xs ${inj.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {inj.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NUTRITION TAB */}
          <TabsContent value="nutrition" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Daily Calories", value: `${player.nutrition.avgDailyCalories} kcal`, color: "text-orange-600" },
                { label: "Protein", value: `${player.nutrition.avgProtein}g/day`, color: "text-blue-600" },
                { label: "Carbohydrates", value: `${player.nutrition.avgCarbs}g/day`, color: "text-green-600" },
                { label: "Plan Compliance", value: `${player.nutrition.complianceRate}%`, color: "text-purple-600" },
              ].map((s, i) => (
                <Card key={i}><CardContent className="p-4 text-center">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Utensils className="h-4 w-4" />Nutritionist Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{player.nutrition.notes}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LOAD TAB */}
          <TabsContent value="load" className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className={`${player.load.riskLevel.includes('Caution') ? 'border-yellow-400 bg-yellow-50' : player.load.riskLevel.includes('Optimal') ? 'border-green-400 bg-green-50' : 'border-blue-400 bg-blue-50'}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-gray-800">{player.load.currentACWR}</div>
                  <div className="text-xs text-muted-foreground mt-1">Current ACWR</div>
                  <Badge className={`mt-2 text-xs ${player.load.riskLevel.includes('Caution') ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                    {player.load.riskLevel}
                  </Badge>
                </CardContent>
              </Card>
              <Card><CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{player.load.avgWeeklyLoad.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Avg Weekly Load (AU)</div>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 capitalize">{player.load.trend}</div>
                <div className="text-xs text-muted-foreground mt-1">Load Trend</div>
              </CardContent></Card>
            </div>
            <Card className={`${player.load.riskLevel.includes('Caution') ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-300'}`}>
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" /> Load Management Recommendation
                </p>
                <p className="text-sm text-gray-700">{player.load.recommendation}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REWARDS TAB */}
          <TabsContent value="rewards" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {player.rewards.map((r: any, i: number) => (
                <Card key={i} className="border-l-4 border-l-yellow-400">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.date} · {r.category}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {player.rewards.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No awards yet in the selected period</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
