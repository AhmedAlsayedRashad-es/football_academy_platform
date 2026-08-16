import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, Brain, Zap, Target, Shield, BarChart2, RefreshCw,
  BookOpen, Clock, Users, Star, ChevronRight, ChevronDown,
  Play, Settings, Award, TrendingUp, Activity, Heart,
  Layers, Grid, Calendar, CheckCircle, Info, Lightbulb,
  Dumbbell, Eye, Wind, Cpu, Filter, Upload, Video, Trash2, ExternalLink
} from "lucide-react";

// ─── Training Types Data ──────────────────────────────────────────────────────
const TRAINING_TYPES = [
  {
    id: "rondo",
    name: "Rondo",
    icon: "⚽",
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-900/20 border-yellow-700/40",
    tagColor: "bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    description: "Possession-based circular drills that develop quick passing, movement, and pressing triggers under pressure.",
    origin: "Barcelona / Johan Cruyff",
    benefits: ["Quick decision-making", "First touch quality", "Pressing triggers", "Positional awareness", "Communication"],
    intensity: "Medium",
    duration: "10–20 min",
    players: "6–12",
    teamSizes: ["7v7", "9v9", "11v11"],
    drills: [
      { name: "4v2 Rondo", setup: "10m circle, 4 keep-away vs 2 defenders", objective: "Maintain possession, switch play", coaching: "3rd man runs, body shape open", videoUrl: "https://www.youtube.com/results?search_query=football+rondo+drill+training", teamSize: "all" },
      { name: "Positional Rondo 4-3-3", setup: "Zones matching formation, 3 phases", objective: "Replicate match structure", coaching: "Play through lines, vertical passes", videoUrl: "https://www.youtube.com/results?search_query=football+rondo+drill+training", teamSize: "11v11" },
      { name: "Rondo with End Zones", setup: "30x20m, 2 end zones, 6v3", objective: "Transition from possession to penetration", coaching: "Recognize when to switch from rondo to attack", videoUrl: "https://www.youtube.com/results?search_query=football+rondo+drill+training", teamSize: "all" },
      { name: "Pressing Rondo", setup: "5v2 in 8m circle, 30s pressing windows", objective: "Trigger pressing moments", coaching: "Compactness, cover shadow, press signal", videoUrl: "https://www.youtube.com/results?search_query=football+rondo+drill+training", teamSize: "all" },
      { name: "3v1 Mini Rondo (7v7)", setup: "6m circle, 3v1, max 2 touches", objective: "Quick passing under pressure for small teams", coaching: "One-two combinations, body open to receive", videoUrl: "https://www.youtube.com/results?search_query=football+rondo+drill+training", teamSize: "7v7" },
      { name: "5v2 Positional Rondo (9v9)", setup: "15m square, 5 keep vs 2 press, positional zones", objective: "Positional awareness in 9v9 structure", coaching: "Triangle support, switch play quickly", videoUrl: "https://www.youtube.com/results?search_query=football+rondo+drill+training", teamSize: "9v9" },
    ]
  },
  {
    id: "ssg",
    name: "Small-Sided Games (SSG)",
    icon: "🏟️",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-900/20 border-green-700/40",
    tagColor: "bg-green-900/30 text-green-700 dark:text-green-400",
    description: "Reduced-space games that replicate match demands with higher ball contacts, decisions, and tactical situations per player.",
    origin: "Modern Elite Academies",
    benefits: ["High ball contacts", "Tactical replication", "Aerobic conditioning", "Decision speed", "Creativity"],
    intensity: "High",
    duration: "20–40 min",
    players: "8–16",
    teamSizes: ["7v7", "9v9", "11v11"],
    drills: [
      { name: "3v3+GK", setup: "25x18m, full goals, unlimited touches", objective: "Finishing, 1v1, transitions", coaching: "Immediate press after losing ball", videoUrl: "https://www.youtube.com/results?search_query=football+small+sided+game+training+drill", teamSize: "7v7" },
      { name: "4v4 Transition Game", setup: "30x20m, 2 mini goals each end", objective: "Fast transitions in/out of possession", coaching: "Counter-press within 5 seconds of loss", videoUrl: "https://www.youtube.com/results?search_query=football+small+sided+game+training+drill", teamSize: "7v7" },
      { name: "5v5 with Wide Zones", setup: "40x30m, 2 wide channels for wingers only", objective: "Width, crossing, overlaps", coaching: "Stretch the play, use width before crossing", videoUrl: "https://www.youtube.com/results?search_query=football+small+sided+game+training+drill", teamSize: "9v9" },
      { name: "6v6 Positional SSG (9v9)", setup: "50x35m, positional zones, 2 floaters", objective: "Positional discipline in 9v9 format", coaching: "Stay in zones, create triangles, use floaters", videoUrl: "https://www.youtube.com/results?search_query=football+small+sided+game+training+drill", teamSize: "9v9" },
      { name: "7v7 Positional SSG", setup: "55x40m, zones restrict positions", objective: "Positional discipline, combination play", coaching: "Stay in zones, create triangles", videoUrl: "https://www.youtube.com/results?search_query=football+small+sided+game+training+drill", teamSize: "11v11" },
      { name: "8v8 Transition SSG", setup: "60x45m, 2 full goals, GKs", objective: "Full team transitions, pressing, counter-attack", coaching: "Immediate press after loss, quick counter", videoUrl: "https://www.youtube.com/results?search_query=football+small+sided+game+training+drill", teamSize: "11v11" },
    ]
  },
  {
    id: "tactical-periodization",
    name: "Tactical Periodization",
    icon: "📊",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-900/20 border-blue-700/40",
    tagColor: "bg-blue-900/30 text-blue-600 dark:text-blue-400",
    description: "Vitor Frade's methodology integrating all four game moments (attack, defense, transition) into every training session through specific game principles.",
    origin: "Vitor Frade / FC Porto / José Mourinho",
    benefits: ["Game model alignment", "Tactical intelligence", "Physical integration", "Pattern recognition", "Collective behavior"],
    intensity: "Variable",
    duration: "60–90 min",
    players: "11–22",
    teamSizes: ["9v9", "11v11"],
    drills: [
      { name: "Morphocycle Day 3 (MD-4)", setup: "11v11, full pitch, high intensity", objective: "Tactical organization in all 4 moments", coaching: "Game model principles, collective shape", videoUrl: "https://www.youtube.com/results?search_query=football+training+drill+Morphocycle", teamSize: "11v11" },
      { name: "Activation Day (MD-1)", setup: "Rondos + set pieces, low volume", objective: "Mental activation, set piece rehearsal", coaching: "Light, sharp, confident", videoUrl: "https://www.youtube.com/results?search_query=football+training+drill+Activation+Day", teamSize: "11v11" },
      { name: "Principles of Play Session", setup: "8v8, 60x45m, specific principles", objective: "Reinforce 2-3 tactical principles", coaching: "Stop-freeze-correct method", videoUrl: "https://www.youtube.com/results?search_query=football+training+drill+Principles+of+Play", teamSize: "11v11" },
      { name: "Transition Moments (9v9)", setup: "7v7, 55x40m, transition triggers", objective: "Immediate reaction to ball loss/gain in 9v9", coaching: "Collective pressing trigger, counter-attack shape", videoUrl: "https://www.youtube.com/results?search_query=football+training+drill+Transition+Moments", teamSize: "9v9" },
    ]
  },
  {
    id: "cognitive",
    name: "Cognitive Training",
    icon: "🧠",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-900/20 border-purple-700/40",
    tagColor: "bg-purple-900/30 text-purple-600 dark:text-purple-400",
    description: "Training the brain's processing speed, decision accuracy, and spatial awareness through video-based, sensory, and pattern-recognition exercises.",
    origin: "IntelliGym / FC Barcelona Research",
    benefits: ["Decision speed", "Anticipation", "Spatial awareness", "Scanning frequency", "Pressure handling"],
    intensity: "Low–Medium",
    duration: "15–30 min",
    players: "Individual / Small Groups",
    teamSizes: ["7v7", "9v9", "11v11"],
    drills: [
      { name: "Scanning Drill", setup: "Cones with numbers/colors, player scans before receiving", objective: "Increase scan frequency before receiving", coaching: "Scan 2x before every touch", videoUrl: "https://www.youtube.com/results?search_query=football+scanning+drill", teamSize: "all" },
      { name: "Video Pattern Recognition", setup: "Projector/tablet, freeze-frame game situations", objective: "Read game situations before they develop", coaching: "What do you see? What's the best option?", videoUrl: "https://www.youtube.com/results?search_query=football+video+pattern+recognition", teamSize: "all" },
      { name: "Reaction Ball", setup: "Irregular bounce ball, 1v1 reaction", objective: "Improve reaction time and adaptability", coaching: "Stay on toes, low center of gravity", videoUrl: "https://www.youtube.com/results?search_query=football+reaction+ball+drill", teamSize: "all" },
      { name: "Color-Coded Passing", setup: "Bibs in 3 colors, pass to color called by coach", objective: "Process information while moving", coaching: "Look up, listen, react simultaneously", videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0", teamSize: "all" },
    ]
  },
  {
    id: "gegenpressing",
    name: "Gegenpressing",
    icon: "⚡",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-900/20 border-orange-700/40",
    tagColor: "bg-orange-900/30 text-orange-700 dark:text-orange-400",
    description: "Jürgen Klopp's counter-pressing system: immediately win the ball back within 5 seconds of losing it through coordinated collective pressing.",
    origin: "Jürgen Klopp / Borussia Dortmund / Liverpool",
    benefits: ["Counter-press triggers", "Stamina", "Collective pressing", "Transition speed", "High energy"],
    intensity: "Very High",
    duration: "25–40 min",
    players: "10–18",
    teamSizes: ["9v9", "11v11"],
    drills: [
      { name: "5-Second Press Game", setup: "8v8, 50x35m, 5-second rule after losing ball", objective: "Immediate collective press", coaching: "First player presses, 2nd cuts passing lane, 3rd covers", videoUrl: "https://www.youtube.com/results?search_query=football+5+second+press+game", teamSize: "11v11" },
      { name: "Pressing Trap", setup: "9v9, side channel press trap", objective: "Force ball to sideline, trap and win", coaching: "Trigger: ball played to flank, press from 3 sides", videoUrl: "https://www.youtube.com/results?search_query=football+pressing+trap+drill", teamSize: "11v11" },
      { name: "Transition Intervals", setup: "6v6, 40x30m, 30s on/30s off", objective: "High-intensity press conditioning", coaching: "Maintain shape even when tired", videoUrl: "https://www.youtube.com/results?search_query=football+transition+intervals", teamSize: "9v9" },
      { name: "Gegenpressing Scenarios", setup: "11v11, coach triggers pressing moments", objective: "Recognize pressing triggers in match context", coaching: "Bad touch, back pass, blind side — press now!", videoUrl: "https://www.youtube.com/results?search_query=football+gegenpressing+scenarios", teamSize: "11v11" },
    ]
  },
  {
    id: "positional-play",
    name: "Positional Play",
    icon: "🎯",
    color: "text-teal-700 dark:text-teal-400",
    bg: "bg-teal-900/20 border-teal-700/40",
    tagColor: "bg-teal-900/30 text-teal-700 dark:text-teal-400",
    description: "Pep Guardiola's system of occupying optimal spaces to create numerical, positional, and qualitative superiorities against organized defenses.",
    origin: "Pep Guardiola / Johan Cruyff / FC Barcelona",
    benefits: ["Space occupation", "Third-man combinations", "Numerical superiority", "Ball circulation", "Positional intelligence"],
    intensity: "Medium",
    duration: "30–60 min",
    players: "10–22",
    teamSizes: ["9v9", "11v11"],
    drills: [
      { name: "5 Zones Positional Game", setup: "60x45m divided into 5 zones, positional rules", objective: "Occupy all 5 zones simultaneously", coaching: "No 2 players in same zone, stretch the field", videoUrl: "https://www.youtube.com/results?search_query=football+5+zones+positional+game", teamSize: "11v11" },
      { name: "Half-Space Activation", setup: "8v6, emphasis on half-space penetration", objective: "Use half-spaces to break defensive lines", coaching: "Receive in half-space, turn, play forward", videoUrl: "https://www.youtube.com/results?search_query=football+half+space+activation", teamSize: "11v11" },
      { name: "3rd Man Combinations", setup: "Passing patterns 3v1, 4v2", objective: "Develop 3rd man run timing", coaching: "Dummy, lay-off, 3rd man arrives", videoUrl: "https://www.youtube.com/results?search_query=football+third+man+combinations", teamSize: "all" },
      { name: "Build-Up Under Pressure (9v9)", setup: "GK+8 vs 5 high press, build from back", objective: "Maintain possession under pressure from GK in 9v9", coaching: "GK as extra man, goalkeeper distribution", videoUrl: "https://www.youtube.com/results?search_query=football+build+up+under+pressure", teamSize: "9v9" },
    ]
  },
  {
    id: "physical",
    name: "Physical Conditioning",
    icon: "💪",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-900/20 border-red-700/40",
    tagColor: "bg-red-900/30 text-red-600 dark:text-red-400",
    description: "Integrated physical development combining speed, agility, strength, and endurance within football-specific contexts.",
    origin: "Sports Science / GPS Data Analytics",
    benefits: ["Sprint speed", "Explosive power", "Aerobic capacity", "Injury resilience", "Recovery speed"],
    intensity: "High–Very High",
    duration: "20–45 min",
    players: "Individual / Full Squad",
    teamSizes: ["7v7", "9v9", "11v11"],
    drills: [
      { name: "Speed Gate Intervals", setup: "Timing gates at 10m, 20m, 30m, 3 reps", objective: "Acceleration and max speed development", coaching: "Drive phase 0-10m, upright 10-30m", videoUrl: "https://www.youtube.com/results?search_query=football+speed+gate+intervals", teamSize: "all" },
      { name: "Agility Ladder + Ball", setup: "Ladder + ball receive at end, 5 patterns", objective: "Footwork speed with ball integration", coaching: "Fast feet, soft landing, quality touch", videoUrl: "https://www.youtube.com/results?search_query=football+agility+ladder+ball", teamSize: "all" },
      { name: "Plyometric Circuit", setup: "Box jumps, hurdles, lateral bounds, 3 rounds", objective: "Explosive power and reactive strength", coaching: "Minimal ground contact time", videoUrl: "https://www.youtube.com/results?search_query=football+plyometric+circuit", teamSize: "all" },
      { name: "High-Intensity Interval (HIIT)", setup: "120m shuttles, 15s on/15s off x12", objective: "Match-specific aerobic conditioning", coaching: "Maintain speed in final reps", videoUrl: "https://www.youtube.com/results?search_query=football+HIIT+conditioning", teamSize: "all" },
    ]
  },
  {
    id: "set-pieces",
    name: "Set Piece Mastery",
    icon: "🎪",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-900/20 border-pink-700/40",
    tagColor: "bg-pink-900/30 text-pink-600 dark:text-pink-400",
    description: "Systematic set piece training covering corners, free kicks, throw-ins, and penalty routines with coded trigger movements.",
    origin: "Tony Pulis / Brentford / StatsBomb Data",
    benefits: ["Goal scoring", "Defensive organization", "Coded routines", "Aerial dominance", "Penalty success"],
    intensity: "Low–Medium",
    duration: "20–35 min",
    players: "11–22",
    teamSizes: ["7v7", "9v9", "11v11"],
    drills: [
      { name: "Corner Routine A (Near Post Flick)", setup: "Full 11, near post run + flick-on", objective: "Create near post goal threat", coaching: "Timing of run, attack the ball early", videoUrl: "https://www.youtube.com/results?search_query=football+corner+routine+near+post", teamSize: "11v11" },
      { name: "Free Kick Combinations", setup: "3 players, 2 dummies + 1 shot", objective: "Confuse wall, create shooting lane", coaching: "Dummy run timing, shooter approach angle", videoUrl: "https://www.youtube.com/results?search_query=football+free+kick+combinations", teamSize: "all" },
      { name: "Defensive Set Piece Shape", setup: "Zonal + man-marking hybrid, corner defense", objective: "Eliminate set piece goals conceded", coaching: "Zone responsibility, no ball-watching", videoUrl: "https://www.youtube.com/results?search_query=football+defensive+set+piece+shape", teamSize: "11v11" },
      { name: "Penalty Routine", setup: "Individual + team penalty practice, pressure simulation", objective: "Penalty confidence and technique", coaching: "Pre-kick routine, pick spot early, commit", videoUrl: "https://www.youtube.com/results?search_query=football+penalty+routine+training", teamSize: "all" },
      { name: "7v7 Corner Routine", setup: "7v7 setup, near post + far post runs", objective: "Corner kick effectiveness in small-sided format", coaching: "2 runners: near post decoy, far post target", videoUrl: "https://www.youtube.com/results?search_query=football+7v7+corner+routine", teamSize: "7v7" },
      { name: "9v9 Free Kick Routine", setup: "9v9, 3-player free kick combination", objective: "Effective free kicks in 9v9 format", coaching: "Dummy + shot or layoff + run", videoUrl: "https://www.youtube.com/results?search_query=football+9v9+free+kick", teamSize: "9v9" },
    ]
  },
];

// ─── Team Size Sample Sessions ────────────────────────────────────────────────
const TEAM_SIZE_SESSIONS: Record<string, any[]> = {
  "7v7": [
    {
      title: "7v7 Technical Possession Session",
      ageGroup: "U-10 / U-12",
      duration: "60 min",
      formation: "2-3-1",
      focus: "Technical Skills + Fun-Based Learning",
      load: "Medium",
      phases: [
        { phase: "Warm-Up (10 min)", activities: ["Dynamic movement games", "3v1 Mini Rondo (6m circle, max 2 touches)"], intensity: "Low" },
        { phase: "Technical Block (15 min)", activities: ["Dribbling through cones", "1v1 challenges with finishing"], intensity: "Medium" },
        { phase: "Tactical Block (15 min)", activities: ["2-3-1 formation positioning", "Short passing patterns in 2-3-1 shape"], intensity: "Medium" },
        { phase: "Small-Sided Game (15 min)", activities: ["4v4 game with mini goals", "Encourage dribbling and creativity"], intensity: "High" },
        { phase: "Cool-Down (5 min)", activities: ["Passing circle", "Fun relay race"], intensity: "Low" },
      ],
      keyPrinciples: ["Fun first, technique second", "Encourage creativity and dribbling", "Maximum ball touches per player", "Positive reinforcement only"],
      pitchSize: "40x30m",
      equipment: ["7 balls", "Bibs", "Mini goals x4", "Cones"],
    },
    {
      title: "7v7 Attacking Play Session",
      ageGroup: "U-12 / U-14",
      duration: "60 min",
      formation: "3-2-1",
      focus: "Attacking Movement + Finishing",
      load: "Medium-High",
      phases: [
        { phase: "Warm-Up (10 min)", activities: ["Activation run", "4v2 Rondo (10m circle)"], intensity: "Low-Medium" },
        { phase: "Finishing Block (15 min)", activities: ["Shooting from different angles", "1v1 vs GK finishing"], intensity: "Medium" },
        { phase: "Combination Play (15 min)", activities: ["2v1 overlapping runs", "3v2 attacking combinations"], intensity: "Medium-High" },
        { phase: "Game (15 min)", activities: ["7v7 game with bonus points for combination goals", "Encourage through-balls and runs"], intensity: "High" },
        { phase: "Cool-Down (5 min)", activities: ["Light passing", "Stretching"], intensity: "Low" },
      ],
      keyPrinciples: ["Create goal-scoring opportunities", "Encourage movement off the ball", "Support the ball carrier", "Quick transitions"],
      pitchSize: "45x35m",
      equipment: ["8 balls", "Bibs", "Full goals x2", "Cones"],
    },
    {
      title: "7v7 Defensive Organization Session",
      ageGroup: "U-12 / U-14",
      duration: "60 min",
      formation: "2-3-1",
      focus: "Defensive Shape + Pressing",
      load: "Medium",
      phases: [
        { phase: "Warm-Up (10 min)", activities: ["Pressing Rondo (5v2)", "Defensive positioning exercises"], intensity: "Low-Medium" },
        { phase: "Defensive Shape (15 min)", activities: ["2-3-1 defensive block", "Pressing triggers practice"], intensity: "Medium" },
        { phase: "Transition Defense (15 min)", activities: ["Transition from attack to defense", "Immediate press after losing ball"], intensity: "Medium-High" },
        { phase: "Game (15 min)", activities: ["7v7 with defensive focus", "Point for clean sheet per 5 minutes"], intensity: "High" },
        { phase: "Cool-Down (5 min)", activities: ["Light passing", "Stretching"], intensity: "Low" },
      ],
      keyPrinciples: ["Compact defensive shape", "Press together as a unit", "Cover the central areas", "Quick recovery when out of position"],
      pitchSize: "40x30m",
      equipment: ["6 balls", "Bibs", "Full goals x2", "Cones"],
    },
  ],
  "9v9": [
    {
      title: "9v9 Possession & Build-Up Session",
      ageGroup: "U-13 / U-15",
      duration: "75 min",
      formation: "3-2-3",
      focus: "Ball Retention + Build-Up Play",
      load: "Medium-High",
      phases: [
        { phase: "Warm-Up (12 min)", activities: ["Dynamic stretching", "5v2 Positional Rondo (15m square)"], intensity: "Low" },
        { phase: "Build-Up Patterns (18 min)", activities: ["GK + 8 build-up vs 4 press", "3-2-3 passing patterns from back"], intensity: "Medium" },
        { phase: "Positional Play (20 min)", activities: ["6v6 Positional SSG with floaters", "Zone occupation in 3-2-3 structure"], intensity: "Medium-High" },
        { phase: "Game (20 min)", activities: ["9v9 game with possession bonus points", "Encourage playing through lines"], intensity: "High" },
        { phase: "Cool-Down (5 min)", activities: ["Passing circle", "Stretching"], intensity: "Low" },
      ],
      keyPrinciples: ["Play out from the back", "Use width to create space", "Third man runs", "Maintain shape in possession"],
      pitchSize: "55x40m",
      equipment: ["9 balls", "Bibs", "Full goals x2", "Cones"],
    },
    {
      title: "9v9 Transition & Counter-Attack Session",
      ageGroup: "U-14 / U-16",
      duration: "75 min",
      formation: "3-3-2",
      focus: "Fast Transitions + Counter-Attack",
      load: "High",
      phases: [
        { phase: "Warm-Up (12 min)", activities: ["Activation run", "Pressing Rondo (6v2)"], intensity: "Low-Medium" },
        { phase: "Transition Training (20 min)", activities: ["6v6 Transition Intervals (30s on/30s off)", "Counter-attack patterns 3v2"], intensity: "High" },
        { phase: "Pressing Organization (18 min)", activities: ["9v9 pressing triggers", "Trap and win in wide areas"], intensity: "High" },
        { phase: "Game (20 min)", activities: ["9v9 with counter-attack bonus points", "3 seconds to score after winning ball"], intensity: "Very High" },
        { phase: "Cool-Down (5 min)", activities: ["Rondo (relaxed)", "Stretching"], intensity: "Low" },
      ],
      keyPrinciples: ["Win the ball high", "Immediate counter-attack", "3-2-1 counter-attack shape", "Speed in transition"],
      pitchSize: "60x42m",
      equipment: ["10 balls", "Bibs", "Full goals x2", "Cones"],
    },
    {
      title: "9v9 Tactical Periodization Session",
      ageGroup: "U-15 / U-17",
      duration: "80 min",
      formation: "3-2-3",
      focus: "All 4 Game Moments",
      load: "High",
      phases: [
        { phase: "Warm-Up (12 min)", activities: ["Scanning drill", "Positional activation"], intensity: "Low" },
        { phase: "Defensive Shape (20 min)", activities: ["3-2-3 defensive block", "Transition moments: defense to attack"], intensity: "Medium" },
        { phase: "Attacking Organization (20 min)", activities: ["Build-up under pressure", "Combination play in final third"], intensity: "Medium-High" },
        { phase: "Full Game (23 min)", activities: ["9v9 with all principles applied", "Coach freeze-correct-restart method"], intensity: "High" },
        { phase: "Cool-Down (5 min)", activities: ["Passing patterns", "Stretching"], intensity: "Low" },
      ],
      keyPrinciples: ["Game model consistency", "All 4 moments: attack, defense, transition in/out", "Collective pressing triggers", "Shape maintenance"],
      pitchSize: "58x42m",
      equipment: ["10 balls", "Bibs", "Full goals x2", "Cones"],
    },
  ],
  "11v11": [
    {
      title: "11v11 Possession Mastery Session",
      ageGroup: "U-17 / U-21",
      duration: "90 min",
      formation: "4-3-3",
      focus: "Positional Play + Ball Retention",
      load: "Medium-High",
      phases: [
        { phase: "Warm-Up (15 min)", activities: ["Dynamic stretching with ball", "4v2 Rondo (10 min)"], intensity: "Low" },
        { phase: "Technical Block (20 min)", activities: ["Positional Rondo 4-3-3", "Third-man combination patterns"], intensity: "Medium" },
        { phase: "Tactical Block (30 min)", activities: ["5 Zones Positional Game", "Build-up under pressure vs. high press"], intensity: "Medium-High" },
        { phase: "SSG (20 min)", activities: ["7v7 Positional SSG with zones", "Transition triggers"], intensity: "High" },
        { phase: "Cool-Down (5 min)", activities: ["Passing circle", "Stretching"], intensity: "Low" },
      ],
      keyPrinciples: ["Occupy all 5 zones", "No 2 players in same zone", "Play through lines", "GK as extra player"],
      pitchSize: "Full pitch",
      equipment: ["12 balls", "Bibs", "Full goals x2", "Cones"],
    },
    {
      title: "11v11 Gegenpressing System Session",
      ageGroup: "U-19 / Senior",
      duration: "85 min",
      formation: "4-3-3",
      focus: "Counter-Press + Transitions",
      load: "High",
      phases: [
        { phase: "Warm-Up (15 min)", activities: ["Activation run", "Pressing Rondo (10 min)"], intensity: "Low-Medium" },
        { phase: "Pressing Principles (25 min)", activities: ["5-Second Press Game", "Pressing Trap drill"], intensity: "High" },
        { phase: "Transition Training (25 min)", activities: ["Gegenpressing Scenarios 11v11", "Transition Intervals"], intensity: "Very High" },
        { phase: "SSG (15 min)", activities: ["4v4 Transition Game", "Counter-press focus"], intensity: "High" },
        { phase: "Cool-Down (5 min)", activities: ["Rondo (relaxed)", "Stretching"], intensity: "Low" },
      ],
      keyPrinciples: ["5-second press rule", "First man presses, second cuts lane", "Third man covers", "Immediate counter-attack after winning"],
      pitchSize: "Full pitch",
      equipment: ["14 balls", "Bibs", "Full goals x2", "Cones"],
    },
    {
      title: "11v11 Defensive Organization Session",
      ageGroup: "U-17 / Senior",
      duration: "90 min",
      formation: "4-2-3-1",
      focus: "Defensive Organization + Set Pieces",
      load: "Medium",
      phases: [
        { phase: "Warm-Up (15 min)", activities: ["Scanning drill", "Positional activation"], intensity: "Low" },
        { phase: "Defensive Shape (30 min)", activities: ["Tactical Periodization — defensive principles", "Zonal defense vs. crosses"], intensity: "Medium" },
        { phase: "Set Pieces (20 min)", activities: ["Defensive corner shape", "Free kick defensive wall"], intensity: "Low-Medium" },
        { phase: "SSG (20 min)", activities: ["5v5 with Wide Zones (defensive focus)", "Transition out of possession"], intensity: "High" },
        { phase: "Cool-Down (5 min)", activities: ["Passing patterns", "Stretching"], intensity: "Low" },
      ],
      keyPrinciples: ["Compact 4-4-2 defensive block", "Zonal marking on set pieces", "Cover shadow in pressing", "Defensive transitions"],
      pitchSize: "Full pitch",
      equipment: ["12 balls", "Bibs", "Full goals x2", "Cones"],
    },
  ],
};

// ─── Microcycle Data ──────────────────────────────────────────────────────────
const MICROCYCLE_DAYS = [
  { day: "MD-4", label: "Tactical Day", color: "bg-blue-700", intensity: 85, focus: "Tactical organization, 11v11 principles, game model", volume: "High", sessions: ["Tactical Periodization", "Set Pieces"] },
  { day: "MD-3", label: "Strength Day", color: "bg-red-700", intensity: 90, focus: "Physical conditioning, strength, explosive power", volume: "High", sessions: ["Physical Conditioning", "Gegenpressing"] },
  { day: "MD-2", label: "Speed Day", color: "bg-orange-600", intensity: 75, focus: "Speed, agility, quick combinations", volume: "Medium", sessions: ["SSG", "Rondo"] },
  { day: "MD-1", label: "Activation Day", color: "bg-yellow-600", intensity: 40, focus: "Light activation, set pieces, mental preparation", volume: "Low", sessions: ["Set Pieces", "Cognitive Training"] },
  { day: "MD", label: "Match Day", color: "bg-green-700", intensity: 100, focus: "Competition — full match performance", volume: "Match", sessions: ["Competition"] },
  { day: "MD+1", label: "Recovery Day", color: "bg-gray-600", intensity: 20, focus: "Active recovery, mobility, video analysis", volume: "Very Low", sessions: ["Recovery", "Cognitive Training"] },
];

// ─── AI Session Generator ─────────────────────────────────────────────────────
const SESSION_TEMPLATES: Record<string, any> = {
  "4-3-3_possession_U-21": {
    title: "4-3-3 Possession Mastery — U-21",
    duration: "90 min",
    phases: [
      { phase: "Warm-Up (15 min)", activities: ["Dynamic stretching with ball", "4v2 Rondo (10 min)"], intensity: "Low" },
      { phase: "Technical Block (20 min)", activities: ["Positional Rondo 4-3-3", "Third-man combination patterns"], intensity: "Medium" },
      { phase: "Tactical Block (30 min)", activities: ["5 Zones Positional Game", "Build-up under pressure vs. high press"], intensity: "Medium-High" },
      { phase: "SSG (20 min)", activities: ["7v7 Positional SSG with zones", "Transition triggers"], intensity: "High" },
      { phase: "Cool-Down (5 min)", activities: ["Passing circle", "Stretching"], intensity: "Low" },
    ],
    load: "Medium-High",
    focus: "Positional Play + Ball Retention"
  },
  "4-3-3_pressing_U-21": {
    title: "4-3-3 Gegenpressing System — U-21",
    duration: "85 min",
    phases: [
      { phase: "Warm-Up (15 min)", activities: ["Activation run", "Pressing Rondo (10 min)"], intensity: "Low-Medium" },
      { phase: "Pressing Principles (25 min)", activities: ["5-Second Press Game", "Pressing Trap drill"], intensity: "High" },
      { phase: "Transition Training (25 min)", activities: ["Gegenpressing Scenarios 11v11", "Transition Intervals"], intensity: "Very High" },
      { phase: "SSG (15 min)", activities: ["4v4 Transition Game", "Counter-press focus"], intensity: "High" },
      { phase: "Cool-Down (5 min)", activities: ["Rondo (relaxed)", "Stretching"], intensity: "Low" },
    ],
    load: "High",
    focus: "Counter-Press + Transitions"
  },
  "4-2-3-1_defensive_U-21": {
    title: "4-2-3-1 Defensive Organization — U-21",
    duration: "90 min",
    phases: [
      { phase: "Warm-Up (15 min)", activities: ["Scanning drill", "Positional activation"], intensity: "Low" },
      { phase: "Defensive Shape (30 min)", activities: ["Tactical Periodization — defensive principles", "Zonal defense vs. crosses"], intensity: "Medium" },
      { phase: "Set Pieces (20 min)", activities: ["Defensive corner shape", "Free kick defensive wall"], intensity: "Low-Medium" },
      { phase: "SSG (20 min)", activities: ["5v5 with Wide Zones (defensive focus)", "Transition out of possession"], intensity: "High" },
      { phase: "Cool-Down (5 min)", activities: ["Passing patterns", "Stretching"], intensity: "Low" },
    ],
    load: "Medium",
    focus: "Defensive Organization + Set Pieces"
  },
  "2-3-1_possession_U-12": {
    title: "2-3-1 Technical Possession — U-12 (7v7)",
    duration: "60 min",
    phases: [
      { phase: "Warm-Up (10 min)", activities: ["Fun movement games", "3v1 Mini Rondo"], intensity: "Low" },
      { phase: "Technical Block (15 min)", activities: ["Dribbling circuits", "1v1 challenges"], intensity: "Medium" },
      { phase: "Tactical Block (15 min)", activities: ["2-3-1 passing patterns", "Short combination play"], intensity: "Medium" },
      { phase: "Game (15 min)", activities: ["7v7 game with creativity bonus points", "Encourage dribbling and 1v1s"], intensity: "High" },
      { phase: "Cool-Down (5 min)", activities: ["Fun relay", "Light stretching"], intensity: "Low" },
    ],
    load: "Medium",
    focus: "Technical Skills + Fun"
  },
  "3-2-3_possession_U-15": {
    title: "3-2-3 Possession & Build-Up — U-15 (9v9)",
    duration: "75 min",
    phases: [
      { phase: "Warm-Up (12 min)", activities: ["Dynamic stretching", "5v2 Positional Rondo"], intensity: "Low" },
      { phase: "Build-Up Patterns (18 min)", activities: ["GK + 8 build-up vs 4 press", "3-2-3 passing patterns from back"], intensity: "Medium" },
      { phase: "Positional Play (20 min)", activities: ["6v6 Positional SSG with floaters", "Zone occupation in 3-2-3 structure"], intensity: "Medium-High" },
      { phase: "Game (20 min)", activities: ["9v9 game with possession bonus points", "Encourage playing through lines"], intensity: "High" },
      { phase: "Cool-Down (5 min)", activities: ["Passing circle", "Stretching"], intensity: "Low" },
    ],
    load: "Medium-High",
    focus: "Ball Retention + Build-Up Play"
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TrainingInnovationHub() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"types" | "microcycle" | "ai-planner" | "drill-library" | "team-sessions" | "video-upload">("types");

  // Video upload state
  const [uploadedVideos, setUploadedVideos] = useState<Array<{
    id: string;
    name: string;
    drillName: string;
    category: string;
    teamSize: string;
    notes: string;
    url: string;
    size: string;
    uploadedAt: string;
  }>>([]);
  const [videoForm, setVideoForm] = useState({ drillName: "", category: "rondo", teamSize: "11v11", notes: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null);
  const [teamSizeFilter, setTeamSizeFilter] = useState<"all" | "7v7" | "9v9" | "11v11">("all");

  // AI Planner state
  const [plannerFormation, setPlannerFormation] = useState("4-3-3");
  const [plannerStyle, setPlannerStyle] = useState("possession");
  const [plannerAge, setPlannerAge] = useState("U-21");
  const [plannerTeamSize, setPlannerTeamSize] = useState("11v11");
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  // Team Sessions state
  const [selectedTeamSize, setSelectedTeamSize] = useState<"7v7" | "9v9" | "11v11">("11v11");
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  const getFormationsForSize = (size: string) => {
    if (size === "7v7") return ["2-3-1", "3-2-1", "2-2-2", "1-3-2", "3-1-2"];
    if (size === "9v9") return ["3-2-3", "3-3-2", "2-3-3", "3-2-2-1", "4-2-2"];
    return ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "4-4-2 Diamond"];
  };

  const { toast } = useToast();
  const generateSessionPlanMutation = trpc.ai.generateSessionPlan.useMutation();
  const [generatingMsg, setGeneratingMsg] = useState('');

  const handleGeneratePlan = async () => {
    setGenerating(true);
    const msgs = [
      'Analyzing formation and play style...',
      'Designing training phases...',
      'Selecting optimal drills...',
      'Calculating load and intensity...',
      'Finalizing session plan...',
    ];
    let msgIdx = 0;
    setGeneratingMsg(msgs[0]);
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setGeneratingMsg(msgs[msgIdx]);
    }, 4000);
    try {
      const result = await generateSessionPlanMutation.mutateAsync({
        formation: plannerFormation,
        playStyle: plannerStyle,
        ageGroup: plannerAge,
        teamSize: plannerTeamSize,
      });
      setGeneratedPlan(result);
      toast({ title: 'Session Plan Generated', description: `AI training plan for ${plannerFormation} ${plannerStyle} is ready.` });
    } catch (err) {
      // Fallback to template if AI fails
      const key = `${plannerFormation}_${plannerStyle}_${plannerAge}`;
      const plan = SESSION_TEMPLATES[key] || SESSION_TEMPLATES[`${plannerFormation}_possession_${plannerAge}`] || SESSION_TEMPLATES["4-3-3_possession_U-21"];
      setGeneratedPlan({ ...plan, title: `${plannerFormation} ${plannerStyle.charAt(0).toUpperCase() + plannerStyle.slice(1)} Session — ${plannerAge} (${plannerTeamSize})` });
      toast({ title: 'Using Template', description: 'AI unavailable, using pre-built template.', variant: 'destructive' });
    } finally {
      clearInterval(msgInterval);
      setGenerating(false);
      setGeneratingMsg('');
    }
  };

  const selectedTypeData = TRAINING_TYPES.find(t => t.id === selectedType);

  const filteredDrillTypes = teamSizeFilter === "all"
    ? TRAINING_TYPES
    : TRAINING_TYPES.filter(t => t.teamSizes.includes(teamSizeFilter));

  const handleVideoUpload = async () => {
    if (!selectedFile || !videoForm.drillName) return;
    setUploading(true);
    await new Promise(r => setTimeout(r, 1500));
    const url = URL.createObjectURL(selectedFile);
    setUploadedVideos(prev => [...prev, {
      id: Date.now().toString(),
      name: selectedFile.name,
      drillName: videoForm.drillName,
      category: videoForm.category,
      teamSize: videoForm.teamSize,
      notes: videoForm.notes,
      url,
      size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleDateString(),
    }]);
    setVideoForm({ drillName: "", category: "rondo", teamSize: "11v11", notes: "" });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
  };

  const TABS = [
    { id: "types", label: "Training Types", icon: <Layers size={15}/> },
    { id: "team-sessions", label: "Team Size Sessions", icon: <Users size={15}/> },
    { id: "microcycle", label: "Microcycle Planner", icon: <Calendar size={15}/> },
    { id: "ai-planner", label: "AI Session Planner", icon: <Brain size={15}/> },
    { id: "drill-library", label: "Drill Library", icon: <BookOpen size={15}/> },
    { id: "video-upload", label: "Drill Videos", icon: <Video size={15}/> },
  ];

  const TEAM_SIZE_COLORS: Record<string, string> = {
    "7v7": "bg-green-700 text-white",
    "9v9": "bg-blue-700 text-white",
    "11v11": "bg-red-700 text-white",
  };

  const TEAM_SIZE_AGE: Record<string, string> = {
    "7v7": "U-10 to U-12 (ages 9-12)",
    "9v9": "U-13 to U-15 (ages 12-15)",
    "11v11": "U-16 and above (ages 15+)",
  };

  return (
    <>
    <div className="text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/features-hub")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Lightbulb size={22} className="text-yellow-700 dark:text-yellow-400"/>
              Smart Training Innovation Hub
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              8 training methodologies · 7v7 / 9v9 / 11v11 sessions · AI planner · Microcycle management · Drill library
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-400 bg-teal-900/20 border border-teal-800/40 px-3 py-1.5 rounded-lg">
              <Cpu size={12}/> Inspired by Wyscout · StatsBomb · BEPRO
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card/50 border-b border-border px-6">
        <div className="max-w-7xl mx-auto flex gap-1 pt-2 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-card text-foreground border-t border-l border-r border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── TRAINING TYPES TAB ── */}
        {activeTab === "types" && (
          <div>
            {/* Team Size Filter */}
            <div className="flex items-center gap-3 mb-4">
              <Filter size={14} className="text-muted-foreground"/>
              <span className="text-xs text-muted-foreground">Filter by team size:</span>
              {(["all", "7v7", "9v9", "11v11"] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setTeamSizeFilter(size)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    teamSizeFilter === size
                      ? size === "all" ? "bg-gray-600 text-white" : TEAM_SIZE_COLORS[size]
                      : "bg-muted text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {size === "all" ? "All Formats" : size}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-4">
              {filteredDrillTypes.map(type => (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                  className={`rounded-xl p-4 border cursor-pointer transition-all ${type.bg} ${
                    selectedType === type.id ? "ring-2 ring-white/20" : "hover:brightness-110"
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <h3 className={`font-bold text-sm mb-1 ${type.color}`}>{type.name}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{type.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${type.tagColor}`}>{type.intensity}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{type.duration}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {type.teamSizes.map(s => (
                      <span key={s} className={`text-xs px-1.5 py-0.5 rounded text-white font-bold ${
                        s === "7v7" ? "bg-green-700/60" : s === "9v9" ? "bg-blue-700/60" : "bg-red-700/60"
                      }`}>{s}</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                    <Star size={10}/> {type.origin}
                  </div>
                </div>
              ))}

              {/* Expanded Detail Panel */}
              {selectedTypeData && (
                <div className="col-span-4 bg-card rounded-xl border border-border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className={`text-xl font-bold flex items-center gap-2 ${selectedTypeData.color}`}>
                        <span className="text-2xl">{selectedTypeData.icon}</span>
                        {selectedTypeData.name}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1 max-w-2xl">{selectedTypeData.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Star size={11}/> Origin: {selectedTypeData.origin}</span>
                        <span className="flex items-center gap-1"><Clock size={11}/> {selectedTypeData.duration}</span>
                        <span className="flex items-center gap-1"><Users size={11}/> {selectedTypeData.players} players</span>
                        <span className="flex items-center gap-1"><Activity size={11}/> {selectedTypeData.intensity} intensity</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedType(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {/* Benefits */}
                    <div>
                      <h3 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-700 dark:text-green-400"/> Key Benefits
                      </h3>
                      <div className="space-y-2">
                        {selectedTypeData.benefits.map((b: string) => (
                          <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedTypeData.color.replace("text-","bg-")}`}/>
                            {b}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Drills */}
                    <div className="col-span-2">
                      <h3 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
                        <Play size={14} className="text-blue-600 dark:text-blue-400"/> Sample Drills
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedTypeData.drills.map((drill: any) => (
                          <div
                            key={drill.name}
                            onClick={(e) => { e.stopPropagation(); setExpandedDrill(expandedDrill === drill.name ? null : drill.name); }}
                            className="bg-muted rounded-lg p-3 border border-border cursor-pointer hover:border-gray-500 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-foreground text-sm font-medium">{drill.name}</span>
                              <div className="flex items-center gap-1.5">
                                {drill.teamSize !== "all" && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded text-white font-bold ${
                                    drill.teamSize === "7v7" ? "bg-green-700/60" : drill.teamSize === "9v9" ? "bg-blue-700/60" : "bg-red-700/60"
                                  }`}>{drill.teamSize}</span>
                                )}
                                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${expandedDrill === drill.name ? "rotate-180" : ""}`}/>
                              </div>
                            </div>
                            {expandedDrill === drill.name && (
                              <div className="mt-2 space-y-1.5 text-xs">
                                <div><span className="text-muted-foreground">Setup:</span> <span className="text-muted-foreground">{drill.setup}</span></div>
                                <div><span className="text-muted-foreground">Objective:</span> <span className="text-muted-foreground">{drill.objective}</span></div>
                                <div><span className="text-muted-foreground">Coaching:</span> <span className="text-yellow-700 dark:text-yellow-400">{drill.coaching}</span></div>
                                {drill.videoUrl && (
                                  <a href={drill.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium mt-1">
                                    <Play size={10} className="fill-current"/> Watch Video
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TEAM SIZE SESSIONS TAB ── */}
        {activeTab === "team-sessions" && (
          <div className="space-y-6">
            {/* Team Size Selector */}
            <div className="bg-card rounded-xl p-5 border border-border">
              <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                <Users size={16} className="text-blue-600 dark:text-blue-400"/> Select Team Format
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {(["7v7", "9v9", "11v11"] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => { setSelectedTeamSize(size); setExpandedSession(null); }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedTeamSize === size
                        ? size === "7v7" ? "border-green-500 bg-green-900/20" : size === "9v9" ? "border-blue-500 bg-blue-900/20" : "border-red-500 bg-red-900/20"
                        : "border-border bg-muted hover:border-border"
                    }`}
                  >
                    <div className={`text-2xl font-black mb-1 ${
                      size === "7v7" ? "text-green-700 dark:text-green-400" : size === "9v9" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
                    }`}>{size}</div>
                    <div className="text-foreground text-sm font-semibold">{
                      size === "7v7" ? "Small Format" : size === "9v9" ? "Medium Format" : "Full Format"
                    }</div>
                    <div className="text-muted-foreground text-xs mt-1">{TEAM_SIZE_AGE[size]}</div>
                    <div className="text-muted-foreground text-xs mt-2">
                      {TEAM_SIZE_SESSIONS[size].length} sample sessions available
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Team Size Info */}
            <div className={`rounded-xl p-4 border ${
              selectedTeamSize === "7v7" ? "bg-green-900/20 border-green-700/40" :
              selectedTeamSize === "9v9" ? "bg-blue-900/20 border-blue-700/40" :
              "bg-red-900/20 border-red-700/40"
            }`}>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">Format</div>
                  <div className="text-foreground font-bold text-lg">{selectedTeamSize}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Age Group</div>
                  <div className="text-foreground font-semibold">{TEAM_SIZE_AGE[selectedTeamSize]}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Pitch Size</div>
                  <div className="text-foreground font-semibold">{
                    selectedTeamSize === "7v7" ? "40-50 x 30-40m" :
                    selectedTeamSize === "9v9" ? "55-65 x 40-50m" :
                    "Full pitch (100-110 x 64-75m)"
                  }</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Key Focus</div>
                  <div className="text-foreground font-semibold">{
                    selectedTeamSize === "7v7" ? "Technical skills, fun, creativity" :
                    selectedTeamSize === "9v9" ? "Tactical awareness, transitions" :
                    "Full tactical organization, game model"
                  }</div>
                </div>
              </div>
            </div>

            {/* Sessions */}
            <div className="space-y-4">
              <h3 className="text-foreground font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-yellow-700 dark:text-yellow-400"/>
                Sample Training Sessions for {selectedTeamSize}
              </h3>
              {TEAM_SIZE_SESSIONS[selectedTeamSize].map((session, i) => (
                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedSession(expandedSession === i ? null : i)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                        selectedTeamSize === "7v7" ? "bg-green-700" : selectedTeamSize === "9v9" ? "bg-blue-700" : "bg-red-700"
                      }`}>{i + 1}</div>
                      <div>
                        <h4 className="text-foreground font-bold">{session.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users size={11}/> {session.ageGroup}</span>
                          <span className="flex items-center gap-1"><Clock size={11}/> {session.duration}</span>
                          <span className="flex items-center gap-1"><Target size={11}/> {session.formation}</span>
                          <span className="flex items-center gap-1"><Activity size={11}/> {session.load} load</span>
                        </div>
                        <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">{session.focus}</div>
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform shrink-0 ${expandedSession === i ? "rotate-180" : ""}`}/>
                  </div>

                  {expandedSession === i && (
                    <div className="px-5 pb-5 border-t border-border">
                      <div className="grid grid-cols-3 gap-6 mt-4">
                        {/* Session Phases */}
                        <div className="col-span-2 space-y-3">
                          <h5 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
                            <Calendar size={14} className="text-blue-600 dark:text-blue-400"/> Session Structure
                          </h5>
                          {session.phases.map((phase: any, j: number) => (
                            <div key={j} className="bg-muted rounded-lg p-3 border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-foreground font-semibold text-sm">{phase.phase}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  phase.intensity === "Very High" ? "bg-red-900/40 text-red-600 dark:text-red-400" :
                                  phase.intensity === "High" ? "bg-orange-900/40 text-orange-700 dark:text-orange-400" :
                                  phase.intensity === "Medium-High" ? "bg-yellow-900/40 text-yellow-700 dark:text-yellow-400" :
                                  phase.intensity === "Medium" ? "bg-blue-900/40 text-blue-600 dark:text-blue-400" :
                                  "bg-muted text-muted-foreground"
                                }`}>{phase.intensity}</span>
                              </div>
                              <div className="space-y-1">
                                {phase.activities.map((act: string, k: number) => (
                                  <div key={k} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ChevronRight size={12} className="text-muted-foreground shrink-0"/>
                                    {act}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Key Info */}
                        <div className="space-y-4">
                          <div className="bg-muted rounded-lg p-4 border border-border">
                            <h5 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
                              <CheckCircle size={14} className="text-green-700 dark:text-green-400"/> Key Principles
                            </h5>
                            <div className="space-y-2">
                              {session.keyPrinciples.map((p: string, j: number) => (
                                <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                                    selectedTeamSize === "7v7" ? "bg-green-400" : selectedTeamSize === "9v9" ? "bg-blue-400" : "bg-red-400"
                                  }`}/>
                                  {p}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="bg-muted rounded-lg p-4 border border-border">
                            <h5 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
                              <Settings size={14} className="text-purple-600 dark:text-purple-400"/> Equipment Needed
                            </h5>
                            <div className="space-y-1">
                              {session.equipment.map((e: string, j: number) => (
                                <div key={j} className="text-xs text-muted-foreground flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-purple-400"/>
                                  {e}
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="text-xs text-muted-foreground">Pitch Size</div>
                              <div className="text-xs text-foreground font-semibold mt-0.5">{session.pitchSize}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MICROCYCLE PLANNER TAB ── */}
        {activeTab === "microcycle" && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-5 border border-border">
              <h2 className="text-foreground font-semibold mb-1 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600 dark:text-blue-400"/> Weekly Microcycle — Tactical Periodization Model
              </h2>
              <p className="text-muted-foreground text-sm mb-4">Based on Martin Buchheit's 11 Principles of Microcycle Periodization and FC Barcelona's methodology</p>

              {/* Load Chart */}
              <div className="flex items-end gap-3 h-48 mb-4">
                {MICROCYCLE_DAYS.map(day => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs text-muted-foreground font-medium">{day.intensity}%</div>
                    <div className="w-full flex flex-col justify-end" style={{ height: "160px" }}>
                      <div
                        className={`w-full rounded-t-lg ${day.color} transition-all`}
                        style={{ height: `${day.intensity * 1.6}px` }}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-foreground text-xs font-bold">{day.day}</div>
                      <div className="text-muted-foreground text-xs">{day.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Day Details */}
              <div className="grid grid-cols-3 gap-3">
                {MICROCYCLE_DAYS.map(day => (
                  <div key={day.day} className="bg-muted rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-foreground">{day.day}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${day.color} text-white`}>{day.volume}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{day.label}</div>
                    <p className="text-xs text-muted-foreground mb-2">{day.focus}</p>
                    <div className="flex flex-wrap gap-1">
                      {day.sessions.map(s => (
                        <span key={s} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Principles */}
            <div className="bg-card rounded-xl p-5 border border-border">
              <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                <Info size={16} className="text-yellow-700 dark:text-yellow-400"/> Key Periodization Principles
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { title: "Morphocycle Structure", desc: "Each week follows the same pattern: high load MD-4/MD-3, taper MD-2/MD-1, match MD, recovery MD+1", icon: "📅" },
                  { title: "Specificity Principle", desc: "All physical conditioning is done through football-specific exercises, never isolated gym work", icon: "⚽" },
                  { title: "Tactical Integration", desc: "Technical and physical work is always integrated with tactical game principles", icon: "🎯" },
                  { title: "Progressive Overload", desc: "Intensity and complexity increase gradually across the microcycle peak days", icon: "📈" },
                  { title: "Recovery Management", desc: "MD+1 is mandatory recovery — active mobility, pool, video analysis only", icon: "💆" },
                  { title: "Individual Adaptation", desc: "Players with <60 min match time get additional load on MD+1 and MD+2", icon: "👤" },
                ].map(p => (
                  <div key={p.title} className="bg-muted rounded-lg p-4 border border-border">
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <h4 className="text-foreground text-sm font-semibold mb-1">{p.title}</h4>
                    <p className="text-muted-foreground text-xs leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AI SESSION PLANNER TAB ── */}
        {activeTab === "ai-planner" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Config Panel */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl p-5 border border-border">
                <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                  <Brain size={16} className="text-purple-600 dark:text-purple-400"/> AI Session Generator
                </h2>
                <p className="text-muted-foreground text-xs mb-4">Configure your team profile and the AI will generate a complete training session plan with phases, drills, and coaching points.</p>

                <div className="space-y-4">
                  {/* Team Size */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Team Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["7v7", "9v9", "11v11"].map(size => (
                        <button key={size} onClick={() => { setPlannerTeamSize(size); setPlannerFormation(getFormationsForSize(size)[0]); }}
                          className={`py-2 rounded-lg text-xs font-bold border transition-all ${plannerTeamSize === size
                            ? size === "7v7" ? "bg-green-700 border-green-600 text-white" : size === "9v9" ? "bg-blue-700 border-blue-600 text-white" : "bg-red-700 border-red-600 text-white"
                            : "bg-muted border-border text-muted-foreground"}`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Formation</label>
                    <div className="grid grid-cols-2 gap-2">
                      {getFormationsForSize(plannerTeamSize).slice(0, 4).map(f => (
                        <button key={f} onClick={() => setPlannerFormation(f)}
                          className={`py-2 rounded-lg text-xs font-semibold border transition-all ${plannerFormation === f ? "bg-red-700 border-red-600 text-white" : "bg-muted border-border text-muted-foreground"}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Playing Style Focus</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: "possession", label: "Possession & Positional Play" },
                        { id: "pressing", label: "Gegenpressing & Transitions" },
                        { id: "defensive", label: "Defensive Organization" },
                      ].map(s => (
                        <button key={s.id} onClick={() => setPlannerStyle(s.id)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-left ${plannerStyle === s.id ? "bg-yellow-700/40 border-yellow-600 text-yellow-700 dark:text-yellow-300" : "bg-muted border-border text-muted-foreground"}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block font-medium">Age Group</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["U-10", "U-12", "U-15", "U-17", "U-21", "Senior"].map(ag => (
                        <button key={ag} onClick={() => setPlannerAge(ag)}
                          className={`py-2 rounded-lg text-xs font-semibold border transition-all ${plannerAge === ag ? "bg-blue-700 border-blue-600 text-white" : "bg-muted border-border text-muted-foreground"}`}>
                          {ag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGeneratePlan}
                  disabled={generating}
                  className="w-full mt-4 bg-red-700 hover:bg-red-600 disabled:bg-muted text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {generating ? <><RefreshCw size={16} className="animate-spin"/> {generatingMsg || 'Generating...'}</> : <><Brain size={16}/> Generate Session Plan</>}
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-card rounded-xl p-4 border border-teal-800/40">
                <div className="text-teal-700 dark:text-teal-400 text-xs font-bold mb-2 flex items-center gap-1.5">
                  <Cpu size={11}/> AI METHODOLOGY
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Sessions are generated using Tactical Periodization principles, matching training types to your team format, formation, and style. Each session follows a progressive intensity curve.
                </p>
              </div>
            </div>

            {/* Generated Plan */}
            <div className="col-span-2">
              {generating ? (
                <div className="bg-card rounded-xl border border-border h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="relative mx-auto mb-4 w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-border"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-red-500 animate-spin"></div>
                      <Brain size={24} className="absolute inset-0 m-auto text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-foreground font-semibold text-sm mb-2">{generatingMsg || 'Generating session plan...'}</p>
                    <p className="text-muted-foreground text-xs">The AI is analyzing your team profile and creating a personalized training session. This may take 15-30 seconds.</p>
                    <div className="mt-4 flex gap-1 justify-center">
                      {['🔍','📋','⚽','📊','✅'].map((emoji, i) => (
                        <span key={i} className={`text-lg transition-opacity ${generatingMsg?.startsWith(emoji) ? 'opacity-100' : 'opacity-30'}`}>{emoji}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : !generatedPlan ? (
                <div className="bg-card rounded-xl border border-border h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <Brain size={48} className="text-gray-700 mx-auto mb-3"/>
                    <p className="text-muted-foreground text-sm">Configure your team profile and click Generate to create a personalized training session plan</p>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-foreground font-bold text-lg">{generatedPlan.title}</h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={11}/> {generatedPlan.duration}</span>
                        <span className="flex items-center gap-1"><Activity size={11}/> Load: {generatedPlan.load}</span>
                        <span className="flex items-center gap-1"><Target size={11}/> Focus: {generatedPlan.focus}</span>
                      </div>
                    </div>
                    <span className="text-xs bg-green-900/40 text-green-700 dark:text-green-400 border border-green-700/40 px-3 py-1 rounded-full">AI Generated</span>
                  </div>

                  {generatedPlan.methodology && (
                    <div className="mb-3 px-3 py-2 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Methodology: </span>
                      <span className="text-xs text-muted-foreground">{generatedPlan.methodology}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {generatedPlan.phases?.map((phase: any, i: number) => (
                      <div key={i} className="bg-muted rounded-lg p-4 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-foreground font-semibold text-sm">{phase.phase}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            phase.intensity === "Very High" ? "bg-red-900/40 text-red-600 dark:text-red-400" :
                            phase.intensity === "High" ? "bg-orange-900/40 text-orange-700 dark:text-orange-400" :
                            phase.intensity === "Medium-High" ? "bg-yellow-900/40 text-yellow-700 dark:text-yellow-400" :
                            phase.intensity === "Medium" ? "bg-blue-900/40 text-blue-600 dark:text-blue-400" :
                            "bg-muted text-muted-foreground"
                          }`}>{phase.intensity}</span>
                        </div>
                        <div className="space-y-1 mb-2">
                          {phase.activities?.map((act: string, j: number) => (
                            <div key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ChevronRight size={12} className="text-muted-foreground shrink-0"/>
                              {act}
                            </div>
                          ))}
                        </div>
                        {phase.coachingPoints?.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <div className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold mb-1">Coaching Points:</div>
                            {phase.coachingPoints.map((pt: string, k: number) => (
                              <div key={k} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Star size={10} className="text-yellow-700 dark:text-yellow-500 shrink-0"/>
                                {pt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {generatedPlan.keyDrills?.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Key Drills:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {generatedPlan.keyDrills.map((drill: string, i: number) => (
                          <span key={i} className="text-xs bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded">{drill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {generatedPlan.successMetrics?.length > 0 && (
                    <div className="mt-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                      <div className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">Success Metrics:</div>
                      {generatedPlan.successMetrics.map((metric: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle size={10} className="text-green-700 dark:text-green-400 shrink-0"/>
                          {metric}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                    <p className="text-yellow-700 dark:text-yellow-400 text-xs flex items-start gap-2">
                      <Lightbulb size={12} className="mt-0.5 shrink-0"/>
                      <span>Tip: Adjust drill intensity based on microcycle day. MD-4 sessions should be at full tactical intensity; MD-2 sessions should be 70% intensity with more technical focus.</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DRILL LIBRARY TAB ── */}
        {activeTab === "drill-library" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-muted-foreground text-sm">{TRAINING_TYPES.reduce((acc, t) => acc + t.drills.length, 0)} drills across {TRAINING_TYPES.length} training types</span>
              <div className="ml-auto flex items-center gap-2">
                <Filter size={13} className="text-muted-foreground"/>
                {(["all", "7v7", "9v9", "11v11"] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => setTeamSizeFilter(size)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      teamSizeFilter === size
                        ? size === "all" ? "bg-gray-600 text-white" : TEAM_SIZE_COLORS[size]
                        : "bg-muted text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {size === "all" ? "All" : size}
                  </button>
                ))}
              </div>
            </div>
            {filteredDrillTypes.map(type => (
              <div key={type.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer ${type.bg}`}
                  onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{type.icon}</span>
                    <div>
                      <h3 className={`font-bold text-sm ${type.color}`}>{type.name}</h3>
                      <span className="text-muted-foreground text-xs">{type.drills.length} drills · {type.intensity} intensity · {type.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {type.teamSizes.map(s => (
                      <span key={s} className={`text-xs px-1.5 py-0.5 rounded text-white font-bold ${
                        s === "7v7" ? "bg-green-700/60" : s === "9v9" ? "bg-blue-700/60" : "bg-red-700/60"
                      }`}>{s}</span>
                    ))}
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform ${selectedType === type.id ? "rotate-180" : ""}`}/>
                  </div>
                </div>
                {selectedType === type.id && (
                  <div className="p-4 grid grid-cols-2 gap-3 border-t border-border">
                    {type.drills
                      .filter(d => teamSizeFilter === "all" || d.teamSize === "all" || d.teamSize === teamSizeFilter)
                      .map(drill => (
                      <div key={drill.name} className="bg-muted rounded-lg p-4 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-foreground font-semibold text-sm">{drill.name}</h4>
                          {drill.teamSize !== "all" && (
                            <span className={`text-xs px-1.5 py-0.5 rounded text-white font-bold ${
                              drill.teamSize === "7v7" ? "bg-green-700/60" : drill.teamSize === "9v9" ? "bg-blue-700/60" : "bg-red-700/60"
                            }`}>{drill.teamSize}</span>
                          )}
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex gap-2">
                            <span className="text-muted-foreground w-16 shrink-0">Setup:</span>
                            <span className="text-muted-foreground">{drill.setup}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground w-16 shrink-0">Objective:</span>
                            <span className="text-muted-foreground">{drill.objective}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground w-16 shrink-0">Coaching:</span>
                            <span className="text-yellow-700 dark:text-yellow-400">{drill.coaching}</span>
                          </div>
                        </div>
                        {(drill as any).videoUrl && (
                          <a
                            href={(drill as any).videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium"
                          >
                            <Play size={12} className="fill-current" /> Watch Video Tutorial
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* ── VIDEO UPLOAD TAB ── */}
        {activeTab === "video-upload" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Upload Form */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                  <Upload size={16} className="text-blue-600 dark:text-blue-400"/> Upload Drill Video
                </h2>
                <p className="text-muted-foreground text-xs mb-4">Upload your own drill videos to build a custom library for your academy. Supports MP4, MOV, AVI up to 200MB.</p>

                {/* File Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${
                    selectedFile ? "border-blue-500 bg-blue-900/10" : "border-border hover:border-gray-500"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile ? (
                    <div>
                      <Video size={32} className="text-blue-600 dark:text-blue-400 mx-auto mb-2"/>
                      <div className="text-foreground text-sm font-semibold">{selectedFile.name}</div>
                      <div className="text-muted-foreground text-xs mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} className="text-gray-600 mx-auto mb-2"/>
                      <div className="text-muted-foreground text-sm">Click to select video file</div>
                      <div className="text-gray-600 text-xs mt-1">MP4, MOV, AVI · Max 200MB</div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block font-medium">Drill Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. 4v2 Rondo Variation"
                      value={videoForm.drillName}
                      onChange={e => setVideoForm(p => ({ ...p, drillName: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block font-medium">Category</label>
                      <select
                        value={videoForm.category}
                        onChange={e => setVideoForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500"
                      >
                        {TRAINING_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block font-medium">Team Size</label>
                      <select
                        value={videoForm.teamSize}
                        onChange={e => setVideoForm(p => ({ ...p, teamSize: e.target.value }))}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500"
                      >
                        <option value="7v7">7v7</option>
                        <option value="9v9">9v9</option>
                        <option value="11v11">11v11</option>
                        <option value="all">All Formats</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block font-medium">Coaching Notes</label>
                    <textarea
                      placeholder="Key coaching points, setup instructions..."
                      value={videoForm.notes}
                      onChange={e => setVideoForm(p => ({ ...p, notes: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <button
                  onClick={handleVideoUpload}
                  disabled={!selectedFile || !videoForm.drillName || uploading}
                  className="w-full mt-4 bg-blue-700 hover:bg-blue-600 disabled:bg-muted text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {uploading ? <><RefreshCw size={16} className="animate-spin"/> Uploading...</> : <><Upload size={16}/> Upload Video</>}
                </button>
              </div>

              {/* Tips */}
              <div className="bg-card rounded-xl p-4 border border-yellow-800/40">
                <div className="text-yellow-700 dark:text-yellow-400 text-xs font-bold mb-2 flex items-center gap-1.5">
                  <Lightbulb size={11}/> VIDEO TIPS
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div>• Film from an elevated angle (15-20° above pitch)</div>
                  <div>• Ensure all players are visible in frame</div>
                  <div>• Use good lighting — avoid direct sun glare</div>
                  <div>• Keep videos under 10 minutes for best results</div>
                  <div>• Label drills clearly for easy library search</div>
                </div>
              </div>
            </div>

            {/* Video Library */}
            <div className="col-span-2">
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-foreground font-semibold flex items-center gap-2">
                    <Video size={16} className="text-purple-600 dark:text-purple-400"/> Your Drill Video Library
                  </h2>
                  <span className="text-xs text-muted-foreground">{uploadedVideos.length} videos uploaded</span>
                </div>

                {uploadedVideos.length === 0 ? (
                  <div className="text-center py-16">
                    <Video size={48} className="text-gray-700 mx-auto mb-3"/>
                    <p className="text-muted-foreground text-sm">No videos uploaded yet.</p>
                    <p className="text-gray-600 text-xs mt-1">Upload your first drill video using the form on the left.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {uploadedVideos.map(video => {
                      const typeData = TRAINING_TYPES.find(t => t.id === video.category);
                      return (
                        <div key={video.id} className="bg-muted rounded-xl border border-border overflow-hidden">
                          {/* Video Preview */}
                          <div className="relative bg-card aspect-video flex items-center justify-center">
                            <video
                              src={video.url}
                              className="w-full h-full object-cover"
                              controls
                              preload="metadata"
                            />
                          </div>
                          {/* Info */}
                          <div className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-foreground font-semibold text-sm">{video.drillName}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {typeData && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${typeData.tagColor}`}>{typeData.name}</span>
                                  )}
                                  <span className={`text-xs px-1.5 py-0.5 rounded text-white font-bold ${
                                    video.teamSize === "7v7" ? "bg-green-700/60" : video.teamSize === "9v9" ? "bg-blue-700/60" : video.teamSize === "all" ? "bg-muted" : "bg-red-700/60"
                                  }`}>{video.teamSize}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setUploadedVideos(prev => prev.filter(v => v.id !== video.id))}
                                className="text-gray-600 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-2"
                              >
                                <Trash2 size={14}/>
                              </button>
                            </div>
                            {video.notes && (
                              <p className="text-muted-foreground text-xs mt-2 leading-relaxed">{video.notes}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                              <span>{video.size}</span>
                              <span>·</span>
                              <span>{video.uploadedAt}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
