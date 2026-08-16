import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X, ChevronLeft, ChevronRight, Check, Trophy, Brain, Video,
  Users, Activity, BarChart3, Shield, Heart, Utensils, BookOpen, Zap
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

interface TourStep {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  tip?: string;
  roles?: string[]; // if set, only show to these roles
}

const ALL_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to the Academy Platform",
    description: "This is your all-in-one football academy management system — combining AI coaching intelligence, video analysis, player development, and medical management in a single platform. Let's take a 2-minute tour of the key features.",
    path: "/dashboard",
    icon: <Trophy style={{ width: 24, height: 24, color: "#D4AF37" }} />,
    color: "#D4AF37",
    badge: "Start Here",
  },
  {
    id: "ai-coach",
    title: "AI Coach Assistant",
    description: "Get instant tactical advice, personalized drill plans, and complete match preparation reports powered by Google Gemini AI. The AI understands your specific squad, formation, and opponent — giving you actionable recommendations, not generic advice.",
    path: "/ai-coach",
    icon: <Brain style={{ width: 24, height: 24, color: "#a78bfa" }} />,
    color: "#a78bfa",
    badge: "AI Powered",
    tip: "Try: 'Generate a pressing drill for U17s against a 4-3-3'",
    roles: ["admin", "coach", "assistant_coach"],
  },
  {
    id: "tactical-annotator",
    title: "Tactical Annotator (Coach Paint)",
    description: "Upload match footage and annotate any frame with 8 professional tools: player labels, movement arrows, team zones, spotlight rings, tactical text boxes, and more. Save frames with match metadata, then present them in fullscreen slideshow mode for team meetings.",
    path: "/video-telestration",
    icon: <Video style={{ width: 24, height: 24, color: "#34d399" }} />,
    color: "#34d399",
    badge: "Coach Paint",
    tip: "Use Templates Library for instant tactical patterns like 'Press Trigger' or '3rd Man Run'",
    roles: ["admin", "coach", "assistant_coach"],
  },
  {
    id: "player-profiles",
    title: "Player Profiles & Development",
    description: "Every player has a comprehensive digital profile combining performance scores, medical records, psychological assessments, nutrition plans, GPS data, and coach feedback. The Individual Development Plan (IDP) tracks personalized goals with milestone progress.",
    path: "/players",
    icon: <Users style={{ width: 24, height: 24, color: "#60a5fa" }} />,
    color: "#60a5fa",
    badge: "360° View",
    tip: "Click any player card → Progress tab to see their weekly coach rating trend",
  },
  {
    id: "xg-analytics",
    title: "xG & Match Analytics",
    description: "Professional-grade Expected Goals (xG) analysis, shot maps, pass maps, and defensive action tracking — the same tools used by Premier League clubs. Record every shot, pass, and defensive action during matches to build a comprehensive data library.",
    path: "/xg-analytics",
    icon: <BarChart3 style={{ width: 24, height: 24, color: "#f59e0b" }} />,
    color: "#f59e0b",
    badge: "Pro Analytics",
    tip: "Select any match from the dropdown to view its full xG breakdown",
    roles: ["admin", "coach", "assistant_coach"],
  },
  {
    id: "medical",
    title: "Medical & Health Management",
    description: "Track injuries, blood markers, InBody body composition, physical test results, and muscle measurements. Upload PDF lab reports or photos — the AI automatically extracts all marker values. The Team Doctor Dashboard shows all players' health status at a glance.",
    path: "/medical-trends",
    icon: <Heart style={{ width: 24, height: 24, color: "#f87171" }} />,
    color: "#f87171",
    badge: "AI Extraction",
    tip: "Use the 'AI Extract' tab to upload a blood test PDF and auto-fill all markers",
    roles: ["admin", "doctor", "physical_trainer"],
  },
  {
    id: "nutrition",
    title: "Nutrition Management",
    description: "Create personalized meal plans based on each player's biometric profile and training load. The AI Nutrition Planner generates complete weekly plans with macros, meal timing, and hydration targets. Assign plans to individual players or entire teams in bulk.",
    path: "/nutrition",
    icon: <Utensils style={{ width: 24, height: 24, color: "#86efac" }} />,
    color: "#86efac",
    badge: "Personalized",
    tip: "Use 'AI Generate Plan' to create a nutrition plan tailored to a player's position and load",
    roles: ["admin", "nutritionist"],
  },
  {
    id: "training",
    title: "Training & Session Management",
    description: "Plan training sessions on a visual calendar, record attendance, and rate each player's performance with the Session Feedback tool. After each session, rate players on 5 dimensions (technical, physical, mental, tactical, general) — scores feed into the weekly progress dashboard.",
    path: "/training",
    icon: <Activity style={{ width: 24, height: 24, color: "#fb923c" }} />,
    color: "#fb923c",
    badge: "Session Tracker",
    tip: "After recording a session, click 'Rate Players' to submit individual feedback",
    roles: ["admin", "coach", "assistant_coach", "physical_trainer"],
  },
  {
    id: "education",
    title: "Education & Mental Coaching",
    description: "The Education LMS lets coaches create courses, quizzes, and learning paths for players. The Mental Coaching module enables sports psychologists to log sessions, track wellbeing scores, and generate mental performance reports — a capability absent from all competing platforms.",
    path: "/education",
    icon: <BookOpen style={{ width: 24, height: 24, color: "#c084fc" }} />,
    color: "#c084fc",
    badge: "Unique Feature",
    roles: ["admin", "mental_coach", "coach"],
  },
  {
    id: "role-permissions",
    title: "Role Permissions & Access Control",
    description: "The platform has 9 built-in roles (Admin, Coach, Assistant Coach, Nutritionist, Mental Coach, Physical Trainer, Doctor, Parent, Player). Each role can have a fully customized navigation — showing only the tabs relevant to their function. Roles can inherit from parent roles and individual users can have per-page overrides.",
    path: "/admin/role-permissions",
    icon: <Shield style={{ width: 24, height: 24, color: "#94a3b8" }} />,
    color: "#94a3b8",
    badge: "9 Roles",
    tip: "Go to Admin → Role Permissions to customize what each role can see",
    roles: ["admin"],
  },
  {
    id: "complete",
    title: "You're Ready to Go!",
    description: "You've seen the platform's core features. Start by uploading a training video, checking a player's progress dashboard, or asking the AI Coach for a drill plan. You can restart this tour anytime from the '?' button in the sidebar.",
    path: "/dashboard",
    icon: <Zap style={{ width: 24, height: 24, color: "#D4AF37" }} />,
    color: "#D4AF37",
    badge: "Let's Go!",
  },
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  // Filter steps by role
  const tourSteps = ALL_STEPS.filter(step => {
    if (!step.roles) return true; // show to all roles
    if (!user?.role) return true;
    return step.roles.includes(user.role);
  });

  useEffect(() => {
    const tourCompleted = localStorage.getItem("onboarding-tour-completed");
    const tourSkipped = localStorage.getItem("onboarding-tour-skipped");

    if (!tourCompleted && !tourSkipped && location === "/dashboard") {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = tourSteps[currentStep + 1];
      setCurrentStep(currentStep + 1);
      if (nextStep.path !== location) {
        setLocation(nextStep.path);
      }
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = tourSteps[currentStep - 1];
      setCurrentStep(currentStep - 1);
      if (prevStep.path !== location) {
        setLocation(prevStep.path);
      }
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem("onboarding-tour-skipped", "true");
  };

  const completeTour = () => {
    setIsOpen(false);
    localStorage.setItem("onboarding-tour-completed", "true");
    setLocation("/dashboard");
  };

  const restartTour = () => {
    localStorage.removeItem("onboarding-tour-completed");
    localStorage.removeItem("onboarding-tour-skipped");
    setCurrentStep(0);
    setIsOpen(true);
    setLocation("/dashboard");
  };

  if (!isOpen) {
    return (
      <button
        onClick={restartTour}
        title="Platform Tour"
        style={{
          position: "fixed",
          bottom: "88px",
          right: "24px",
          zIndex: 9990,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #8B0000, #6b0000)",
          border: "2px solid rgba(212,175,55,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(139,0,0,0.5)",
          color: "#D4AF37",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        ?
      </button>
    );
  }

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const isLast = currentStep === tourSteps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(4px)",
        }}
        onClick={handleSkip}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            borderRadius: "20px",
            overflow: "hidden",
            background: "#111",
            border: "1px solid #222",
            boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              background: "linear-gradient(135deg, #6b0000 0%, #8B0000 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="/logo-transparent.png"
                  alt="Future Stars FC"
                  style={{ width: "24px", height: "24px", objectFit: "contain" }}
                />
              </div>
              <div>
                <p style={{ color: "white", fontWeight: 700, fontSize: "13px", margin: 0 }}>Platform Tour</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", margin: 0 }}>
                  Step {currentStep + 1} of {tourSteps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <X style={{ width: "14px", height: "14px" }} />
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ height: "3px", background: "#1a1a1a" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, #8B0000, #D4AF37)",
                transition: "width 0.4s ease",
              }}
            />
          </div>

          {/* Body */}
          <div style={{ padding: "24px 24px 20px" }}>
            {/* Icon + Badge row */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: `${step.color}18`,
                  border: `1px solid ${step.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {step.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  {step.badge && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "20px",
                        background: `${step.color}20`,
                        color: step.color,
                        border: `1px solid ${step.color}30`,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {step.badge}
                    </span>
                  )}
                </div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: "17px", margin: 0, lineHeight: 1.3 }}>
                  {step.title}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p style={{ color: "#999", fontSize: "14px", lineHeight: "1.65", margin: "0 0 16px" }}>
              {step.description}
            </p>

            {/* Tip box */}
            {step.tip && (
              <div
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #3d3d3d",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "13px", color: "#D4AF37", flexShrink: 0 }}>💡</span>
                <p style={{ color: "#aaa", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
                  <strong style={{ color: "#D4AF37" }}>Tip: </strong>{step.tip}
                </p>
              </div>
            )}

            {/* Step dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "20px" }}>
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  style={{
                    height: "6px",
                    width: i === currentStep ? "20px" : "6px",
                    borderRadius: "3px",
                    background: i === currentStep ? "#D4AF37" : i < currentStep ? "#8B0000" : "#2a2a2a",
                    transition: "all 0.25s ease",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={handlePrevious}
                disabled={isFirst}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "1px solid #3d3d3d",
                  color: isFirst ? "#6b6b6b" : "#b0b0b0",
                  cursor: isFirst ? "not-allowed" : "pointer",
                  fontSize: "13px",
                }}
              >
                <ChevronLeft style={{ width: "14px", height: "14px" }} />
                Back
              </button>

              {isLast ? (
                <button
                  onClick={completeTour}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 22px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #8B0000, #6b0000)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                    boxShadow: "0 4px 15px rgba(139,0,0,0.4)",
                  }}
                >
                  <Check style={{ width: "15px", height: "15px" }} />
                  Start Using Platform
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 22px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #8B0000, #6b0000)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                    boxShadow: "0 4px 15px rgba(139,0,0,0.4)",
                  }}
                >
                  Next
                  <ChevronRight style={{ width: "15px", height: "15px" }} />
                </button>
              )}
            </div>

            {/* Skip link */}
            {!isLast && (
              <div style={{ textAlign: "center", marginTop: "14px" }}>
                <button
                  onClick={handleSkip}
                  style={{
                    fontSize: "12px",
                    color: "#a0a0a0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Skip tour
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function useOnboardingTour() {
  const restartTour = () => {
    localStorage.removeItem("onboarding-tour-completed");
    localStorage.removeItem("onboarding-tour-skipped");
    window.location.reload();
  };
  return { restartTour };
}
