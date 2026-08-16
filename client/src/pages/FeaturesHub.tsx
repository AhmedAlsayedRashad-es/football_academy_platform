import { ArrowLeft } from 'lucide-react';
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import {
  QrCode, Share2, Mail, Users, Video, Apple, Activity, 
  GraduationCap, Headphones, Plus, CheckCircle, Clock, AlertCircle,
  Brain, Search, UserCheck, Lightbulb, TrendingUp, Users2, BarChart3, ClipboardList
} from "lucide-react";

export default function FeaturesHub() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("qr-checkin");

  const features = [
    {
      id: "qr-checkin",
      name: "QR Check-In",
      icon: QrCode,
      description: "Attendance tracking with QR codes",
      color: "bg-blue-500",
    },
    {
      id: "social-media",
      name: "Social Media",
      icon: Share2,
      description: "Auto-post to Instagram, Facebook, Twitter",
      color: "bg-purple-500",
    },
    {
      id: "email-campaigns",
      name: "Email Campaigns",
      icon: Mail,
      description: "Automated email drip campaigns",
      color: "bg-green-500",
    },
    {
      id: "referrals",
      name: "Referral Program",
      icon: Users,
      description: "Track referrals and rewards",
      color: "bg-yellow-500",
    },
    {
      id: "scout-network",
      name: "AI Scout Network",
      icon: Video,
      description: "Global talent identification with AI",
      color: "bg-red-500",
    },
    {
      id: "nutrition-ai",
      name: "Nutrition AI",
      icon: Apple,
      description: "Meal photo recognition & analysis",
      color: "bg-orange-500",
    },
    {
      id: "injury-prevention",
      name: "Injury Prevention",
      icon: Activity,
      description: "Predictive analytics for injuries",
      color: "bg-pink-500",
    },
    {
      id: "education-academy",
      name: "Parent Academy",
      icon: GraduationCap,
      description: "Educational courses for parents",
      color: "bg-indigo-500",
    },
    {
      id: "vr-training",
      name: "VR Training",
      icon: Headphones,
      description: "Meta Quest VR training modules",
      color: "bg-cyan-500",
    },
    {
      id: "advanced-tactical",
      name: "Advanced Tactical Hub",
      icon: Brain,
      description: "xG, heatmaps, pass maps & counter-plan AI",
      color: "bg-violet-600",
    },
    {
      id: "coach-selection",
      name: "Coach Selection AI",
      icon: UserCheck,
      description: "Match the right coach to your team's style",
      color: "bg-teal-600",
    },
    {
      id: "team-needs",
      name: "Team Needs Analysis",
      icon: Search,
      description: "Identify skill gaps & recruitment targets",
      color: "bg-amber-600",
    },
    {
      id: "training-innovation",
      name: "Training Innovation Hub",
      icon: Lightbulb,
      description: "8 modern methodologies · AI session planner · Drill library",
      color: "bg-yellow-600",
    },
    {
      id: "player-development",
      name: "Player Development Plan",
      icon: TrendingUp,
      description: "Personalized mental, tactical & physical development per player",
      color: "bg-emerald-600",
    },
    {
      id: "team-management",
      name: "Team Management",
      icon: Users2,
      description: "Full team & staff management with الجهاز الفني و الاداري",
      color: "bg-red-700",
    },
    {
      id: "load-management",
      name: "Load Management",
      icon: BarChart3,
      description: "A:C ratio tracking, muscle imbalance alerts & training load",
      color: "bg-blue-700",
    },
    {
      id: "session-recorder",
      name: "Session Recorder",
      icon: ClipboardList,
      description: "Record mental, physical, medical & technical data per player per session",
      color: "bg-purple-700",
    },
  ];

  const activeFeature = features.find((f) => f.id === activeTab);

  return (
    <>
    <div className="text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
                    <BackButton />
          <h1 className="brand-gradient text-4xl font-bold mb-2 bg-clip-text text-transparent">
            Advanced Features Hub
          </h1>
          <p className="text-muted-foreground">
            Manage all 14 advanced features from one central dashboard
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`p-6 rounded-xl transition-all duration-300 ${
                  activeTab === feature.id
                    ? "bg-muted border-2 border-blue-500 shadow-lg shadow-blue-500/30 scale-105"
                    : "bg-muted/50 border border-border hover:border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg mb-1">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Feature Content */}
        <div className="bg-muted/50 border border-border rounded-xl p-8">
          {activeTab === "qr-checkin" && <QRCheckInPanel />}
          {activeTab === "social-media" && <SocialMediaPanel />}
          {activeTab === "email-campaigns" && <EmailCampaignsPanel />}
          {activeTab === "referrals" && <ReferralPanel />}
          {activeTab === "scout-network" && <ScoutNetworkPanel navigate={navigate} />}
          {activeTab === "nutrition-ai" && <NutritionAIPanel navigate={navigate} />}
          {activeTab === "injury-prevention" && <InjuryPreventionPanel navigate={navigate} />}
          {activeTab === "education-academy" && <EducationAcademyPanel />}
          {activeTab === "vr-training" && <VRTrainingPanel />}
          {activeTab === "advanced-tactical" && <AdvancedTacticalPanel navigate={navigate} />}
          {activeTab === "coach-selection" && <CoachSelectionPanel navigate={navigate} />}
          {activeTab === "team-needs" && <TeamNeedsPanel navigate={navigate} />}
          {activeTab === "training-innovation" && <TrainingInnovationPanel navigate={navigate} />}
          {activeTab === "player-development" && <PlayerDevelopmentPanel navigate={navigate} />}
          {activeTab === "team-management" && <TeamManagementPanel navigate={navigate} />}
          {activeTab === "load-management" && <LoadManagementPanel navigate={navigate} />}
          {activeTab === "session-recorder" && <SessionRecorderPanel navigate={navigate} />}
        </div>
      </div>
    </div>
    </>
  );
}

// ==================== QR CHECK-IN PANEL ====================
function QRCheckInPanel() {
  const [sessionId, setSessionId] = useState("");
  const [location, setLocation] = useState("");
  const [qrCode, setQrCode] = useState("");

  const generateQR = trpc.qrCheckIn.generateQR.useMutation();

  const handleGenerateQR = async () => {
    const result = await generateQR.mutateAsync({
      sessionId: parseInt(sessionId),
      location,
    });
    setQrCode(result.qrCode);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <QrCode className="w-6 h-6" />
        QR Code Check-In System
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Session ID</label>
            <input
              type="number"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter session ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Training ground, Field A, etc."
            />
          </div>

          <button
            onClick={handleGenerateQR}
            disabled={!sessionId || !location}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            Generate QR Code
          </button>
        </div>

        <div className="flex items-center justify-center">
          {qrCode ? (
            <div className="text-center">
              <div className="bg-white p-8 rounded-lg inline-block mb-4">
                <div className="text-6xl font-mono text-black">{qrCode.slice(-6)}</div>
              </div>
              <p className="text-sm text-muted-foreground">QR Code: {qrCode}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Players scan this code to check in
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <QrCode className="w-24 h-24 mx-auto mb-4 opacity-20" />
              <p>Generate a QR code to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== SOCIAL MEDIA PANEL ====================
function SocialMediaPanel() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);

  const createPost = trpc.socialMedia.createPost.useMutation();
  const { data: posts } = trpc.socialMedia.getPosts.useQuery({ limit: 10 });

  const handleCreatePost = async () => {
    await createPost.mutateAsync({
      title,
      content,
      platforms: platforms as any,
    });
    setTitle("");
    setContent("");
    setPlatforms([]);
  };

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Share2 className="w-6 h-6" />
        Social Media Auto-Posting
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Post Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Amazing training session today!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Write your post content..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {["instagram", "facebook", "twitter", "linkedin"].map((platform) => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    platforms.includes(platform)
                      ? "bg-purple-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreatePost}
            disabled={!title || !content || platforms.length === 0}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            Create Post
          </button>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Recent Posts</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {posts?.map((post) => (
              <div key={post.id} className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{post.title}</h4>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      post.status === "posted"
                        ? "bg-green-500/20 text-green-700 dark:text-green-400"
                        : post.status === "scheduled"
                        ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                        : "bg-gray-500/20 text-muted-foreground"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                <div className="flex gap-2 mt-2">
                  {(post.platforms as string[])?.map((platform) => (
                    <span
                      key={platform}
                      className="text-xs px-2 py-1 bg-gray-600 rounded"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== EMAIL CAMPAIGNS PANEL ====================
function EmailCampaignsPanel() {
  const [campaignName, setCampaignName] = useState("");
  const [targetAudience, setTargetAudience] = useState("new_players");

  const createCampaign = trpc.emailCampaigns.createCampaign.useMutation();
  const { data: campaigns } = trpc.emailCampaigns.getCampaigns.useQuery();

  const handleCreateCampaign = async () => {
    await createCampaign.mutateAsync({
      name: campaignName,
      targetAudience: targetAudience as any,
    });
    setCampaignName("");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Mail className="w-6 h-6" />
        Email Drip Campaigns
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="New Player Welcome Series"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Audience</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="new_players">New Players</option>
              <option value="new_parents">New Parents</option>
              <option value="all_players">All Players</option>
              <option value="all_parents">All Parents</option>
              <option value="coaches">Coaches</option>
            </select>
          </div>

          <button
            onClick={handleCreateCampaign}
            disabled={!campaignName}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            Create Campaign
          </button>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">How it works</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Create a campaign with target audience</li>
              <li>• Add email templates in sequence</li>
              <li>• Set delay days between emails</li>
              <li>• Activate to start sending automatically</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Active Campaigns</h3>
          <div className="space-y-3">
            {campaigns?.map((campaign) => (
              <div key={campaign.id} className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{campaign.name}</h4>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      campaign.status === "active"
                        ? "bg-green-500/20 text-green-700 dark:text-green-400"
                        : "bg-gray-500/20 text-muted-foreground"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Target: {campaign.targetAudience?.replace("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== REFERRAL PANEL ====================
function ReferralPanel() {
  const [referralCode, setReferralCode] = useState("");
  const [referredEmail, setReferredEmail] = useState("");

  const generateCode = trpc.referral.generateCode.useMutation();
  const createReferral = trpc.referral.createReferral.useMutation();
  const { data: myReferrals } = trpc.referral.getMyReferrals.useQuery();

  const handleGenerateCode = async () => {
    const result = await generateCode.mutateAsync();
    setReferralCode(result.referralCode);
  };

  const handleCreateReferral = async () => {
    await createReferral.mutateAsync({
      referralCode,
      referredEmail,
    });
    setReferredEmail("");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-6 h-6" />
        Referral Program
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="brand-gradient-subtle border border-yellow-500/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">Your Referral Code</h3>
            {referralCode ? (
              <div className="bg-card px-4 py-3 rounded-lg font-mono text-2xl text-center">
                {referralCode}
              </div>
            ) : (
              <button
                onClick={handleGenerateCode}
                className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors"
              >
                Generate My Code
              </button>
            )}
          </div>

          {referralCode && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Refer Someone
                </label>
                <input
                  type="email"
                  value={referredEmail}
                  onChange={(e) => setReferredEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="friend@email.com"
                />
              </div>
              <button
                onClick={handleCreateReferral}
                disabled={!referredEmail}
                className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                Send Referral
              </button>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">Rewards</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 20% discount on next month</li>
              <li>• 1 free private training session</li>
              <li>• 100 loyalty points</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">My Referrals</h3>
          <div className="space-y-3">
            {myReferrals?.map((referral) => (
              <div key={referral.id} className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{referral.referredEmail}</p>
                    <p className="text-sm text-muted-foreground">{referral.referredName}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      referral.status === "rewarded"
                        ? "bg-green-500/20 text-green-700 dark:text-green-400"
                        : referral.status === "completed"
                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                        : "bg-gray-500/20 text-muted-foreground"
                    }`}
                  >
                    {referral.status}
                  </span>
                </div>
                {referral.rewardType && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Reward: {referral.rewardValue} {referral.rewardType}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SCOUT NETWORK PANEL ====================
function ScoutNetworkPanel({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Video className="w-6 h-6" />
        AI Scout Network
      </h2>
      <div className="text-center py-12">
        <Video className="w-24 h-24 mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-semibold mb-2">Global Talent Identification</h3>
        <p className="text-muted-foreground mb-6">
          Upload player videos for AI-powered scouting analysis across 20 metrics
        </p>
        <button
          onClick={() => navigate('/scout-network')}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors">
          Create Scout Report
        </button>
      </div>
    </div>
  );
}

// ==================== NUTRITION AI PANEL ====================
function NutritionAIPanel({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Apple className="w-6 h-6" />
        Nutrition AI
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">2,450</p>
          <p className="text-sm text-muted-foreground">Daily Calories Target</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-700 dark:text-green-400">142g</p>
          <p className="text-sm text-muted-foreground">Protein Goal</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">87%</p>
          <p className="text-sm text-muted-foreground">Nutrition Score</p>
        </div>
      </div>
      <div className="text-center py-8">
        <Apple className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h3 className="text-xl font-semibold mb-2">AI-Powered Meal Analysis</h3>
        <p className="text-muted-foreground mb-6">
          Take a photo of your meal and get instant nutritional analysis, personalized recommendations, and hydration tracking
        </p>
        <button
          onClick={() => navigate('/nutrition-ai')}
          className="px-8 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-colors">
          Open Nutrition AI →
        </button>
      </div>
    </div>
  );
}

// ==================== INJURY PREVENTION PANEL ====================
function InjuryPreventionPanel({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Activity className="w-6 h-6" />
        Injury Prevention AI
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-700 dark:text-green-400">Low</p>
          <p className="text-sm text-muted-foreground">Current Risk Level</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">94%</p>
          <p className="text-sm text-muted-foreground">Recovery Score</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">3</p>
          <p className="text-sm text-muted-foreground">Active Alerts</p>
        </div>
      </div>
      <div className="text-center py-8">
        <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h3 className="text-xl font-semibold mb-2">Predictive Injury Analytics</h3>
        <p className="text-muted-foreground mb-6">
          AI-powered injury risk assessment based on training load, recovery metrics, and biomechanical data
        </p>
        <button
          onClick={() => navigate('/injury-prevention')}
          className="px-8 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition-colors">
          Run Full Assessment →
        </button>
      </div>
    </div>
  );
}

// ==================== EDUCATION ACADEMY PANEL ====================
function EducationAcademyPanel() {
  const { data: courses } = trpc.educationAcademy.getCourses.useQuery({});

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <GraduationCap className="w-6 h-6" />
        Parent Education Academy
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses?.map((course) => (
          <div key={course.id} className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{course.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {course.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded">
                {course.category?.replace("_", " ")}
              </span>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300">
                Enroll →
              </button>
            </div>
          </div>
        ))}
        {(!courses || courses.length === 0) && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            No courses available yet
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== ADVANCED TACTICAL PANEL ====================
function AdvancedTacticalPanel({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          Advanced Tactical Intelligence Hub
        </h2>
        <button
          onClick={() => navigate('/advanced-tactical-hub')}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Open Full Hub →
        </button>
      </div>
      <p className="text-muted-foreground mb-6 text-sm">
        Inspired by <strong className="text-foreground">Wyscout</strong>, <strong className="text-foreground">StatsBomb</strong>, and <strong className="text-foreground">BEPRO</strong> — the world's leading tactical analysis platforms. 
        Analyze xG, heatmaps, pass networks, and generate AI counter-plans against any opponent.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { title: "xG Analytics", desc: "Expected Goals model tracking 3,000+ match events", path: "/xg-analytics", color: "border-violet-700/50 bg-violet-900/20", badge: "StatsBomb-style" },
          { title: "Professional Heatmap", desc: "Player and team movement heatmaps with zone analysis", path: "/professional-heatmap", color: "border-blue-700/50 bg-blue-900/20", badge: "BEPRO-style" },
          { title: "Pass Network Viewer", desc: "Interactive pass maps showing team connectivity", path: "/pass-network", color: "border-green-700/50 bg-green-900/20", badge: "Wyscout-style" },
          { title: "Opposition Analysis", desc: "Deep opponent scouting with counter-strategy AI", path: "/opposition-analysis", color: "border-red-700/50 bg-red-900/20", badge: "Pro Scout" },
          { title: "AI Tactical Analyst", desc: "AI-powered match analysis and tactical recommendations", path: "/ai-match-coach", color: "border-yellow-700/50 bg-yellow-900/20", badge: "AI-Powered" },
          { title: "Formation Simulation", desc: "Simulate formations with custom colors and animations", path: "/ai-formation-simulation", color: "border-pink-700/50 bg-pink-900/20", badge: "Interactive" },
        ].map(({ title, desc, path, color, badge }) => (
          <button key={path} onClick={() => navigate(path)}
            className={`p-4 rounded-xl border text-left hover:scale-[1.02] transition-all ${color}`}>
            <div className="flex items-start justify-between mb-2">
              <span className="font-semibold text-foreground">{title}</span>
              <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">{badge}</span>
            </div>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </button>
        ))}
      </div>
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <div className="text-xs text-muted-foreground font-medium mb-2">Platform Comparison</div>
        <div className="grid grid-cols-4 gap-3 text-xs">
          {[
            ["Wyscout", "€3K–€10K/yr", "550K+ players"],
            ["StatsBomb", "€5K+/yr", "3K events/match"],
            ["BEPRO", "€500/mo", "Video AI"],
            ["This Platform", "Included", "Academy-focused"],
          ].map(([name, cost, feature]) => (
            <div key={name} className={`p-2 rounded-lg ${name === "This Platform" ? "bg-violet-900/40 border border-violet-700/50" : "bg-muted"}`}>
              <div className={`font-bold mb-1 ${name === "This Platform" ? "text-violet-600 dark:text-violet-300" : "text-foreground"}`}>{name}</div>
              <div className="text-muted-foreground">{cost}</div>
              <div className="text-muted-foreground">{feature}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== COACH SELECTION PANEL ====================
function CoachSelectionPanel({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <UserCheck className="w-6 h-6 text-teal-700 dark:text-teal-400" />
        AI Coach Selection Tool
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Select the ideal coach for your team based on playing style, available skills, formation preference, and tactical needs. 
        The AI scores each coach candidate against your team's profile.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Playing Style Match", value: "40%", desc: "Weight in scoring", color: "text-yellow-700 dark:text-yellow-400" },
          { label: "Skills Alignment", value: "35%", desc: "Weight in scoring", color: "text-blue-600 dark:text-blue-400" },
          { label: "Formation Fit", value: "15%", desc: "Weight in scoring", color: "text-green-700 dark:text-green-400" },
        ].map(({ label, value, desc, color }) => (
          <div key={label} className="bg-muted/40 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-foreground font-medium mt-1">{label}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
        ))}
      </div>
      <div className="bg-muted/30 rounded-xl p-4 mb-4 border border-border">
        <div className="text-sm font-medium text-foreground mb-2">How it works:</div>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Select your team's current formation and age group</li>
          <li>Choose your preferred playing styles (e.g., High Press, Tiki-Taka)</li>
          <li>Tag the key skills available in your squad</li>
          <li>Identify team weaknesses to be addressed</li>
          <li>The AI ranks all coaches by compatibility score</li>
        </ol>
      </div>
      <button onClick={() => navigate('/coach-selection')}
        className="w-full bg-teal-700 hover:bg-teal-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
        <UserCheck className="w-5 h-5" /> Open Coach Selection Tool
      </button>
    </div>
  );
}

// ==================== TEAM NEEDS PANEL ====================
function TeamNeedsPanel({ navigate }: { navigate: (path: string) => void }) {
  const { data: teams = [] } = trpc.teams.getAll.useQuery();
  const teamCount = (teams as any[]).length;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Search className="w-6 h-6 text-amber-700 dark:text-amber-400" />
        Team Needs Analysis
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Inspired by <strong className="text-foreground">Wyscout scouting intelligence</strong> — identify position gaps, skill deficiencies, 
        and generate a prioritized recruitment target list with player profiles and cost estimates.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Teams Available", value: teamCount > 0 ? String(teamCount) : '—', desc: "Select a team to analyze", color: "text-amber-700 dark:text-amber-400" },
          { label: "AI-Powered", value: "Real", desc: "Based on actual player data", color: "text-green-700 dark:text-green-400" },
          { label: "Analysis Depth", value: "Full", desc: "Positions, skills, recruitment", color: "text-blue-600 dark:text-blue-400" },
        ].map(({ label, value, desc, color }) => (
          <div key={label} className="bg-muted/40 rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-foreground font-medium mt-1">{label}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { tab: "Position Gaps", desc: "See which positions need improvement", color: "bg-red-900/30 border-red-700/40" },
          { tab: "Skill Analysis", desc: "Compare team skills vs. benchmarks", color: "bg-yellow-900/30 border-yellow-700/40" },
          { tab: "Recruitment", desc: "Get prioritized signing targets", color: "bg-green-900/30 border-green-700/40" },
        ].map(({ tab, desc, color }) => (
          <div key={tab} className={`p-3 rounded-lg border ${color}`}>
            <div className="text-sm font-semibold text-foreground mb-1">{tab}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/team-needs-analysis')}
        className="w-full bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2">
        <Search className="w-5 h-5" /> Open Team Needs Analysis
      </button>
    </div>
  );
}

// ==================== VR TRAINING PANEL ====================
function VRTrainingPanel() {
  const { data: scenarios } = trpc.vrTraining.getScenarios.useQuery({});

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Headphones className="w-6 h-6" />
        VR Training Modules
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios?.map((scenario) => (
          <div key={scenario.id} className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{scenario.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {scenario.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 rounded">
                {scenario.scenarioType}
              </span>
              <span className="text-xs px-2 py-1 bg-gray-600 rounded">
                {scenario.difficulty}
              </span>
            </div>
          </div>
        ))}
        {(!scenarios || scenarios.length === 0) && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            No VR scenarios available yet
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== TRAINING INNOVATION PANEL ====================
function TrainingInnovationPanel({ navigate }: { navigate: (path: string) => void }) {
  const trainingTypes = [
    { name: "Rondo", icon: "⚽", color: "text-yellow-700 dark:text-yellow-400", desc: "Quick passing, pressing triggers, positional awareness", origin: "Barcelona / Cruyff" },
    { name: "Small-Sided Games", icon: "🏟️", color: "text-green-700 dark:text-green-400", desc: "High ball contacts, tactical replication, aerobic conditioning", origin: "Modern Elite Academies" },
    { name: "Tactical Periodization", icon: "📊", color: "text-blue-600 dark:text-blue-400", desc: "4 game moments integrated in every session", origin: "Vitor Frade / Mourinho" },
    { name: "Cognitive Training", icon: "🧠", color: "text-purple-600 dark:text-purple-400", desc: "Decision speed, anticipation, spatial awareness", origin: "IntelliGym / FC Barcelona" },
    { name: "Gegenpressing", icon: "⚡", color: "text-orange-700 dark:text-orange-400", desc: "Win ball back within 5 seconds of losing it", origin: "Jürgen Klopp / Liverpool" },
    { name: "Positional Play", icon: "🎯", color: "text-teal-700 dark:text-teal-400", desc: "Numerical, positional & qualitative superiorities", origin: "Pep Guardiola / Barcelona" },
    { name: "Physical Conditioning", icon: "💪", color: "text-red-600 dark:text-red-400", desc: "Speed, agility, strength in football-specific contexts", origin: "Sports Science / GPS Data" },
    { name: "Set Piece Mastery", icon: "🎪", color: "text-pink-600 dark:text-pink-400", desc: "Coded routines for corners, free kicks, penalties", origin: "Tony Pulis / StatsBomb" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Lightbulb className="w-6 h-6 text-yellow-700 dark:text-yellow-400" />
        Smart Training Innovation Hub
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        8 modern training methodologies · AI session planner · Microcycle management · 32+ drill library
        <span className="ml-2 text-xs text-teal-700 dark:text-teal-400">Inspired by Wyscout · StatsBomb · BEPRO</span>
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {trainingTypes.map((type) => (
          <div key={type.name} className="bg-muted/40 rounded-lg p-3 border border-border/40">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{type.icon}</span>
              <div>
                <h3 className={`font-semibold text-sm ${type.color}`}>{type.name}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{type.desc}</p>
                <p className="text-gray-600 text-xs mt-1">★ {type.origin}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">8</div>
          <div className="text-xs text-muted-foreground mt-1">Training Methodologies</div>
        </div>
        <div className="bg-purple-900/20 border border-purple-700/40 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">32+</div>
          <div className="text-xs text-muted-foreground mt-1">Drills in Library</div>
        </div>
        <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">AI</div>
          <div className="text-xs text-muted-foreground mt-1">Session Generator</div>
        </div>
      </div>

      <button
        onClick={() => navigate('/training-innovation-hub')}
        className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        <Lightbulb className="w-5 h-5" />
        Open Training Innovation Hub
      </button>
    </div>
  );
}

// ==================== PLAYER DEVELOPMENT PANEL ====================
function PlayerDevelopmentPanel({ navigate }: { navigate: (path: string) => void }) {
  const { data: players } = trpc.players.getAll.useQuery();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
        Personalized Player Development Plan
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Create individualized development roadmaps for each player covering mental strength, tactical intelligence, and physical conditioning.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</div>
          <div className="text-xs text-muted-foreground mt-1">Development Pillars</div>
        </div>
        <div className="bg-purple-900/20 border border-purple-700/40 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">AI</div>
          <div className="text-xs text-muted-foreground mt-1">Personalized Plans</div>
        </div>
        <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">360°</div>
          <div className="text-xs text-muted-foreground mt-1">Player View</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Mental", desc: "Confidence, focus, resilience, leadership", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-900/20 border-purple-700/40" },
          { label: "Tactical", desc: "Positioning, decision-making, game reading", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-900/20 border-blue-700/40" },
          { label: "Physical", desc: "Speed, strength, endurance, agility", color: "text-green-700 dark:text-green-400", bg: "bg-green-900/20 border-green-700/40" },
        ].map(pillar => (
          <div key={pillar.label} className={`border rounded-lg p-4 ${pillar.bg}`}>
            <div className={`font-bold text-lg mb-1 ${pillar.color}`}>{pillar.label}</div>
            <div className="text-xs text-muted-foreground">{pillar.desc}</div>
          </div>
        ))}
      </div>

      {players && players.length > 0 && (
        <div className="mb-6">
          <div className="text-sm text-muted-foreground mb-3">Select a player to view their development plan:</div>
          <div className="grid grid-cols-2 gap-2">
            {players.slice(0, 4).map((player: any) => (
              <button
                key={player.id}
                onClick={() => navigate(`/player-development-plan?playerId=${player.id}`)}
                className="flex items-center gap-3 p-3 bg-card hover:bg-muted border border-border hover:border-emerald-600 rounded-lg transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold">
                  {player.name?.charAt(0) || "P"}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{player.name}</div>
                  <div className="text-xs text-muted-foreground">{player.position || "Player"}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/player-development-plan')}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        <TrendingUp className="w-5 h-5" />
        Open Player Development Plans
      </button>
    </div>
  );
}

// ==================== TEAM MANAGEMENT PANEL ====================
function TeamManagementPanel({ navigate }: { navigate: (path: string) => void }) {
  const { data: teams } = trpc.teams.getAll.useQuery();
  const teamList = Array.isArray(teams) ? teams : [];
  const mainTeams = teamList.filter((t: any) => t.teamType === 'main');
  const academyTeams = teamList.filter((t: any) => t.teamType === 'academy');

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🏆</div>
        <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
        <p className="text-muted-foreground mt-2">Full team & staff management — الجهاز الفني والإداري</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-red-700/40 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{mainTeams.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Main Teams</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-blue-700/40 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{academyTeams.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Academy Teams</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-green-700/40 text-center">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{teamList.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Teams</div>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { icon: "👥", title: "Staff Assignment", desc: "Assign head coaches, assistants, fitness coaches, medical staff & admin", color: "border-yellow-700/40" },
          { icon: "⚽", title: "Player Roster", desc: "Add/remove players from teams, manage squad numbers", color: "border-blue-700/40" },
          { icon: "📋", title: "Team Profiles", desc: "Create Main Team and Academy Team profiles with age groups", color: "border-green-700/40" },
          { icon: "🏥", title: "Medical Integration", desc: "Link to player medical profiles directly from team view", color: "border-red-700/40" },
        ].map(({ icon, title, desc, color }) => (
          <div key={title} className={`flex items-start gap-3 p-3 bg-card rounded-lg border ${color}`}>
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="text-sm font-semibold text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/team-management')}
        className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        <Users2 className="w-5 h-5" />
        Open Team Management
      </button>
    </div>
  );
}

// ==================== LOAD MANAGEMENT PANEL ====================
function LoadManagementPanel({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📊</div>
        <h2 className="text-2xl font-bold text-foreground">Load Management Dashboard</h2>
        <p className="text-muted-foreground mt-2">Monitor training load, A:C ratios, and muscle imbalance alerts</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { icon: "⚡", title: "A:C Ratio Tracking", desc: "Acute:Chronic Workload Ratio — the gold standard for injury prevention. Keep players in the 0.8–1.3 sweet zone.", color: "border-yellow-700/40" },
          { icon: "💪", title: "Muscle Imbalance Alerts", desc: "Detect left/right strength imbalances that increase injury risk. Based on recorded physical test data.", color: "border-orange-700/40" },
          { icon: "📈", title: "Weekly Load Trends", desc: "Track RPE, distance, and training hours over rolling 4-week windows per player.", color: "border-blue-700/40" },
          { icon: "🏥", title: "Risk Classification", desc: "Automatic High/Moderate/Low risk classification with recommended action per player.", color: "border-red-700/40" },
        ].map(({ icon, title, desc, color }) => (
          <div key={title} className={`flex items-start gap-3 p-3 bg-card rounded-lg border ${color}`}>
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="text-sm font-semibold text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-4 border border-teal-700/40">
        <div className="text-teal-700 dark:text-teal-400 text-xs font-bold mb-2">SCIENCE-BASED</div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Based on research by Tim Gabbett (A:C Workload Ratio) and used by elite clubs including Liverpool FC, Manchester City, and Real Madrid to prevent soft tissue injuries.
        </p>
      </div>

      <button
        onClick={() => navigate('/load-management')}
        className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        <BarChart3 className="w-5 h-5" />
        Open Load Management
      </button>
    </div>
  );
}

// ==================== SESSION RECORDER PANEL ====================
function SessionRecorderPanel({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📝</div>
        <h2 className="text-2xl font-bold text-foreground">Training Session Recorder</h2>
        <p className="text-muted-foreground mt-2">Record comprehensive per-player performance data after every session</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { icon: "🧠", title: "Mental Performance", desc: "Focus, confidence, communication, resilience, leadership (1-10 scale)", color: "border-purple-700/40 bg-purple-900/10" },
          { icon: "💪", title: "Physical Performance", desc: "Speed, endurance, strength, agility, coordination metrics", color: "border-blue-700/40 bg-blue-900/10" },
          { icon: "🏥", title: "Medical Status", desc: "Pain level, fatigue, sleep quality, hydration, injury flags", color: "border-red-700/40 bg-red-900/10" },
          { icon: "⚽", title: "Technical Performance", desc: "Passing, shooting, dribbling, defending, positioning scores", color: "border-green-700/40 bg-green-900/10" },
        ].map(({ icon, title, desc, color }) => (
          <div key={title} className={`flex items-start gap-3 p-3 rounded-lg border ${color}`}>
            <span className="text-xl">{icon}</span>
            <div>
              <div className="text-xs font-semibold text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-4 border border-purple-700/40">
        <div className="text-purple-600 dark:text-purple-400 text-xs font-bold mb-2">AI PROGRESS ANALYSIS</div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          After recording session data, the AI analyzes trends across multiple sessions and generates personalized development recommendations per player — identifying strengths, weaknesses, and priority areas.
        </p>
      </div>

      <button
        onClick={() => navigate('/training-session-recorder')}
        className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        <ClipboardList className="w-5 h-5" />
        Open Session Recorder
      </button>
    </div>
  );
}
