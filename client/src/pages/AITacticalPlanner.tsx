import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Users, 
  Target, 
  Play, 
  Download,
  Lightbulb,
  TrendingUp,
  Shield,
  Zap,
  AlertCircle,
  Save,
  FolderOpen
, ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import TacticalSimulationCanvas from '@/components/TacticalSimulationCanvas';
import { AIBreadcrumb } from "@/components/AIBreadcrumb";
import { useLanguage } from '@/contexts/LanguageContext';



interface TeamSetup {
  formation: string;
  playStyle: string;
  strengths: string[];
  keyPlayers: string;
}

interface OpponentData {
  formation: string;
  weaknesses: string[];
  keyPlayers: string;
  playStyle: string;
}

const FORMATIONS = [
  '4-3-3',
  '4-4-2',
  '4-2-3-1',
  '3-5-2',
  '3-4-3',
  '4-5-1',
  '5-3-2',
  '4-1-4-1'
];

const PLAY_STYLES = [
  { value: 'possession', label: 'Possession (Tiki-Taka)', icon: '🎯' },
  { value: 'counter', label: 'Counter-Attack', icon: '⚡' },
  { value: 'high-press', label: 'High Press (Gegenpressing)', icon: '🔥' },
  { value: 'low-block', label: 'Low Block & Counter', icon: '🛡️' },
  { value: 'direct', label: 'Direct Play', icon: '➡️' },
  { value: 'wing-play', label: 'Wing Play', icon: '🦅' }
];

const TEAM_STRENGTHS = [
  'Fast Wingers',
  'Strong Defense',
  'Technical Midfield',
  'Aerial Ability',
  'Set Pieces',
  'Pressing Intensity',
  'Possession Control',
  'Counter-Attack Speed',
  'Physical Power',
  'Creative Playmakers'
];

const OPPONENT_WEAKNESSES = [
  'Slow Fullbacks',
  'Weak Aerial Defense',
  'Poor Pressing Coordination',
  'Vulnerable to Counter-Attacks',
  'Lack of Pace',
  'Weak Left Side',
  'Weak Right Side',
  'Poor Set Piece Defense',
  'High Defensive Line',
  'Narrow Formation'
];

export default function AITacticalPlanner() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [step, setStep] = useState<'setup' | 'analysis' | 'simulation'>('setup');
  
  // Team Setup State
  const [teamSetup, setTeamSetup] = useState<TeamSetup>({
    formation: '4-3-3',
    playStyle: 'possession',
    strengths: [],
    keyPlayers: ''
  });

  // Opponent Data State
  const [opponentData, setOpponentData] = useState<OpponentData>({
    formation: '4-4-2',
    weaknesses: [],
    keyPlayers: '',
    playStyle: 'counter'
  });

  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchContext, setMatchContext] = useState('');

  // Real AI analyze mutation
  const analyzeMutation = trpc.tacticalPlans.analyze.useMutation({
    onSuccess: (data) => {
      setAiRecommendation(data);
      setIsAnalyzing(false);
      setStep('analysis');
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`AI Analysis failed: ${error.message}`);
    },
  });

  // Save Plan Mutation
  const savePlanMutation = trpc.tacticalPlans.saveAIPlan.useMutation({
    onSuccess: () => {
      toast.success('Tactical plan saved successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to save plan: ${error.message}`);
    },
  });

  const toggleStrength = (strength: string) => {
    setTeamSetup(prev => ({
      ...prev,
      strengths: prev.strengths.includes(strength)
        ? prev.strengths.filter(s => s !== strength)
        : [...prev.strengths, strength]
    }));
  };

  const toggleWeakness = (weakness: string) => {
    setOpponentData(prev => ({
      ...prev,
      weaknesses: prev.weaknesses.includes(weakness)
        ? prev.weaknesses.filter(w => w !== weakness)
        : [...prev.weaknesses, weakness]
    }));
  };

  const analyzeWithAI = () => {
    if (teamSetup.strengths.length === 0) {
      toast.warning('Please select at least one team strength');
      return;
    }
    setIsAnalyzing(true);
    analyzeMutation.mutate({
      teamFormation: teamSetup.formation,
      teamPlayStyle: teamSetup.playStyle,
      teamStrengths: teamSetup.strengths,
      teamKeyPlayers: teamSetup.keyPlayers || undefined,
      opponentFormation: opponentData.formation,
      opponentPlayStyle: opponentData.playStyle,
      opponentWeaknesses: opponentData.weaknesses,
      opponentKeyPlayers: opponentData.keyPlayers || undefined,
      matchContext: matchContext || undefined,
    });
  };

  const generateAIRecommendation = (team: TeamSetup, opponent: OpponentData) => {
    // Generate multiple tactical options with success rates
    const tacticalOptions = [];

    // Option 1: Wide Attack with Pace
    if (opponent.weaknesses.includes('Slow Fullbacks') && team.strengths.includes('Fast Wingers')) {
      tacticalOptions.push({
        id: 1,
        suggestedTactic: 'Wide Attack with Pace',
        successRate: 85,
        reasoning: 'Your fast wingers can exploit their slow fullbacks. Focus on getting the ball wide quickly and running at them in 1v1 situations.',
        keyInstructions: [
          'Fullbacks push high to create 2v1 situations on wings',
          'Midfielders play early balls to wingers',
          'Striker makes runs to far post for crosses'
        ],
        criticalMoments: [
          'First 15 minutes: Establish dominance and test opponent weaknesses',
          'After scoring: Maintain intensity, don\'t sit back',
          'If losing: Increase attacking urgency in final 20 minutes'
        ],
        playerAdjustments: [
          `Formation: Keep your ${team.formation} but adjust width based on opponent`,
          'Pressing triggers: Press when opponent plays backwards',
          'Transition speed: Quick counter-attacks when winning possession'
        ],
        pros: ['Exploits opponent weakness', 'Utilizes team strength', 'Creates 1v1 situations'],
        cons: ['Requires high fitness', 'Vulnerable to counter if caught high']
      });
    }

    // Option 2: Central Overload
    if (team.strengths.includes('Technical Midfield') || team.strengths.includes('Creative Playmakers')) {
      tacticalOptions.push({
        id: 2,
        suggestedTactic: 'Central Overload',
        successRate: 78,
        reasoning: 'Dominate the midfield battle with technical superiority. Control possession and create chances through the center.',
        keyInstructions: [
          'Midfielders form tight triangles for quick passing',
          'Full-backs provide width while midfield stays compact',
          'Number 10 finds pockets between opponent lines'
        ],
        criticalMoments: [
          'First 20 minutes: Establish midfield control',
          'When ahead: Keep possession to frustrate opponent',
          'Final 15 minutes: Maintain composure and game management'
        ],
        playerAdjustments: [
          'Formation: Narrow midfield to create numerical advantage',
          'Pressing: High press to win ball in dangerous areas',
          'Tempo: Control game rhythm through possession'
        ],
        pros: ['Controls game tempo', 'Frustrates opponent', 'Low risk approach'],
        cons: ['Can be slow to create chances', 'Requires technical excellence']
      });
    }

    // Option 3: High Press & Counter
    if (team.strengths.includes('Pressing Intensity') || team.strengths.includes('Counter-Attack Speed')) {
      tacticalOptions.push({
        id: 3,
        suggestedTactic: 'High Press & Counter',
        successRate: 72,
        reasoning: 'Aggressive high press to win ball in opponent half, then quick counter-attacks to exploit space.',
        keyInstructions: [
          'Aggressive high press to win ball in opponent\'s half',
          'Immediate pressure after losing possession',
          'Fast transition from defense to attack'
        ],
        criticalMoments: [
          'First 10 minutes: Set aggressive tone with intense pressing',
          'After winning ball: Immediate counter-attack',
          'If tired: Drop press slightly but maintain intensity'
        ],
        playerAdjustments: [
          'Formation: Compact shape to press effectively',
          'Triggers: Press when opponent plays sideways or backwards',
          'Recovery: Quick transition to defensive shape if press is broken'
        ],
        pros: ['Creates quick scoring chances', 'Disrupts opponent rhythm', 'High energy approach'],
        cons: ['Physically demanding', 'Leaves space if press is broken']
      });
    }

    // Option 4: Defensive Solidity & Set Pieces
    if (team.strengths.includes('Strong Defense') || team.strengths.includes('Set Pieces') || team.strengths.includes('Aerial Ability')) {
      tacticalOptions.push({
        id: 4,
        suggestedTactic: 'Defensive Solidity & Set Pieces',
        successRate: 68,
        reasoning: 'Solid defensive structure to nullify opponent threats, create chances through set pieces and counter-attacks.',
        keyInstructions: [
          'Compact defensive block to limit space',
          'Focus on winning set pieces in dangerous areas',
          'Exploit aerial advantage from corners and free kicks'
        ],
        criticalMoments: [
          'First 30 minutes: Stay organized and frustrate opponent',
          'Set pieces: Maximum commitment to win aerial duels',
          'Late game: Maintain defensive discipline'
        ],
        playerAdjustments: [
          'Formation: Deep defensive line with compact midfield',
          'Set pieces: Target tall players in box',
          'Transitions: Quick clearances to fast players'
        ],
        pros: ['Hard to break down', 'Maximizes physical advantages', 'Low-risk approach'],
        cons: ['Less possession', 'Relies on set pieces for goals', 'Can invite pressure']
      });
    }

    // Ensure at least one option exists
    if (tacticalOptions.length === 0) {
      tacticalOptions.push({
        id: 1,
        suggestedTactic: 'Balanced Approach',
        successRate: 65,
        reasoning: 'Maintain your natural style while being aware of opponent\'s key players.',
        keyInstructions: [
          'Stick to your formation and principles',
          'Be ready to adjust based on game flow',
          'Focus on executing your strengths'
        ],
        criticalMoments: [
          'First 15 minutes: Establish dominance and test opponent weaknesses',
          'After scoring: Maintain intensity, don\'t sit back',
          'If losing: Increase attacking urgency in final 20 minutes'
        ],
        playerAdjustments: [
          `Formation: Keep your ${team.formation} but adjust width based on opponent`,
          'Pressing triggers: Press when opponent plays backwards',
          'Transition speed: Quick counter-attacks when winning possession'
        ],
        pros: ['Flexible approach', 'Plays to team strengths'],
        cons: ['May not exploit specific weaknesses']
      });
    }

    return {
      options: tacticalOptions,
      selectedOption: tacticalOptions[0] // Default to first option
    };
  };

  return (
    <>
    <div >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate("/advanced-tactical-hub" as any)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Brain className="h-10 w-10 text-primary" />
                      <AIBreadcrumb toolLabel={language === 'ar' ? 'المخطط التكتيكي AI' : 'AI Tactical Planner'}/>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              AI Tactical Planner
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Advanced tactical planning with AI recommendations & simulation
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === 'setup' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'setup' ? 'bg-primary text-white' : 'bg-muted'}`}>
              1
            </div>
            <span className="font-medium">Setup</span>
          </div>
          <div className="w-16 h-1 bg-muted"></div>
          <div className={`flex items-center gap-2 ${step === 'analysis' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'analysis' ? 'bg-primary text-white' : 'bg-muted'}`}>
              2
            </div>
            <span className="font-medium">AI Analysis</span>
          </div>
          <div className="w-16 h-1 bg-muted"></div>
          <div className={`flex items-center gap-2 ${step === 'simulation' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'simulation' ? 'bg-primary text-white' : 'bg-muted'}`}>
              3
            </div>
            <span className="font-medium">Simulation</span>
          </div>
        </div>

        {/* Step 1: Setup */}
        {step === 'setup' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your Team Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Team Setup
                </CardTitle>
                <CardDescription>
                  Configure your team's formation, style, and strengths
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Formation */}
                <div className="space-y-2">
                  <Label>Formation</Label>
                  <Select value={teamSetup.formation} onValueChange={(value) => setTeamSetup({...teamSetup, formation: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATIONS.map(formation => (
                        <SelectItem key={formation} value={formation}>{formation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Play Style */}
                <div className="space-y-2">
                  <Label>Play Style</Label>
                  <Select value={teamSetup.playStyle} onValueChange={(value) => setTeamSetup({...teamSetup, playStyle: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAY_STYLES.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.icon} {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Team Strengths */}
                <div className="space-y-2">
                  <Label>Team Strengths (Select all that apply)</Label>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_STRENGTHS.map(strength => (
                      <Badge
                        key={strength}
                        variant={teamSetup.strengths.includes(strength) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleStrength(strength)}
                      >
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Key Players */}
                <div className="space-y-2">
                  <Label>Key Players & Their Attributes</Label>
                  <Textarea
                    placeholder="e.g., Mohamed Salah - Fast winger, excellent finishing&#10;Virgil van Dijk - Strong defender, good in air"
                    value={teamSetup.keyPlayers}
                    onChange={(e) => setTeamSetup({...teamSetup, keyPlayers: e.target.value})}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Opponent Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Opponent Analysis
                </CardTitle>
                <CardDescription>
                  Analyze your opponent's setup and weaknesses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Opponent Formation */}
                <div className="space-y-2">
                  <Label>Opponent Formation</Label>
                  <Select value={opponentData.formation} onValueChange={(value) => setOpponentData({...opponentData, formation: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATIONS.map(formation => (
                        <SelectItem key={formation} value={formation}>{formation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Opponent Play Style */}
                <div className="space-y-2">
                  <Label>Opponent Play Style</Label>
                  <Select value={opponentData.playStyle} onValueChange={(value) => setOpponentData({...opponentData, playStyle: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAY_STYLES.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.icon} {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Opponent Weaknesses */}
                <div className="space-y-2">
                  <Label>Opponent Weaknesses (Select all that apply)</Label>
                  <div className="flex flex-wrap gap-2">
                    {OPPONENT_WEAKNESSES.map(weakness => (
                      <Badge
                        key={weakness}
                        variant={opponentData.weaknesses.includes(weakness) ? 'destructive' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleWeakness(weakness)}
                      >
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Opponent Key Players */}
                <div className="space-y-2">
                  <Label>Opponent Key Players to Watch</Label>
                  <Textarea
                    placeholder="e.g., Kevin De Bruyne - Creative midfielder, dangerous passes&#10;Erling Haaland - Fast striker, clinical finisher"
                    value={opponentData.keyPlayers}
                    onChange={(e) => setOpponentData({...opponentData, keyPlayers: e.target.value})}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Match Context */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <Label>Match Context (Optional)</Label>
                    <Textarea
                      placeholder="e.g., Cup final, must win, playing away, key players injured, opponent just won 5 in a row..."
                      value={matchContext}
                      onChange={(e) => setMatchContext(e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analyze Button */}
            <div className="lg:col-span-2 flex justify-center">
              <Button 
                size="lg" 
                className="w-full max-w-md"
                onClick={analyzeWithAI}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Brain className="mr-2 h-5 w-5 animate-pulse" />
                    AI is Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Generate AI Tactical Recommendation
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: AI Analysis Results - Multiple Options */}
        {step === 'analysis' && aiRecommendation && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">AI Generated Tactical Options</h2>
              <p className="text-muted-foreground">Compare {aiRecommendation.options.length} tactical approaches and select the best one for your team</p>
            </div>

            {/* AI Strategy Summary */}
            {(aiRecommendation.overallStrategy || aiRecommendation.keyMatchup || aiRecommendation.warningSign) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiRecommendation.overallStrategy && (
                  <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <Brain className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Overall Strategy</p>
                          <p className="text-sm">{aiRecommendation.overallStrategy}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {aiRecommendation.keyMatchup && (
                  <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <Target className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Key Matchup to Win</p>
                          <p className="text-sm">{aiRecommendation.keyMatchup}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {aiRecommendation.warningSign && (
                  <Card className="border-red-500 bg-red-50 dark:bg-red-950">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Warning Sign</p>
                          <p className="text-sm">{aiRecommendation.warningSign}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Tactical Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiRecommendation.options.map((option: any) => (
                <Card 
                  key={option.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    aiRecommendation.selectedOption?.id === option.id 
                      ? 'border-primary border-2 shadow-md' 
                      : 'border-muted'
                  }`}
                  onClick={() => setAiRecommendation({...aiRecommendation, selectedOption: option})}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {option.suggestedTactic}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="default" 
                            className={`text-sm ${
                              option.successRate >= 80 ? 'bg-green-600' :
                              option.successRate >= 70 ? 'bg-blue-600' :
                              'bg-orange-600'
                            }`}
                          >
                            {option.successRate}% Success Rate
                          </Badge>
                          {aiRecommendation.selectedOption?.id === option.id && (
                            <Badge variant="outline" className="bg-primary text-primary-foreground">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Reasoning */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm">{option.reasoning}</p>
                    </div>

                    {/* Pros & Cons */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">✓ Pros</h4>
                        <ul className="text-xs space-y-1">
                          {option.pros.map((pro: string, idx: number) => (
                            <li key={idx} className="text-muted-foreground">• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">✗ Cons</h4>
                        <ul className="text-xs space-y-1">
                          {option.cons.map((con: string, idx: number) => (
                            <li key={idx} className="text-muted-foreground">• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Key Instructions Preview */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Key Instructions</h4>
                      <ul className="text-xs space-y-1">
                        {option.keyInstructions.slice(0, 2).map((instruction: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1">
                            <Zap className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{instruction}</span>
                          </li>
                        ))}
                        {option.keyInstructions.length > 2 && (
                          <li className="text-xs text-muted-foreground italic">+{option.keyInstructions.length - 2} more...</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Option Details */}
            {aiRecommendation.selectedOption && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-yellow-700 dark:text-yellow-500" />
                    Detailed Plan: {aiRecommendation.selectedOption.suggestedTactic}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Instructions */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Key Tactical Instructions
                    </h3>
                    <ul className="space-y-2">
                      {aiRecommendation.selectedOption.keyInstructions.map((instruction: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Critical Moments */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Critical Moments
                    </h3>
                    <ul className="space-y-2">
                      {aiRecommendation.selectedOption.criticalMoments.map((moment: string, index: number) => (
                        <li key={index} className="p-3 bg-muted rounded-lg">
                          {moment}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Player Adjustments */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Player Adjustments</h3>
                    <ul className="space-y-2">
                      {aiRecommendation.selectedOption.playerAdjustments.map((adjustment: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{adjustment}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setStep('setup')}>
                ← Back to Setup
              </Button>
              <Button size="lg" onClick={() => setStep('simulation')}>
                <Play className="mr-2 h-5 w-5" />
                Generate 3D Simulation
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 3D Simulation */}
        {step === 'simulation' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  3D Tactical Simulation
                </CardTitle>
                <CardDescription>
                  Visualize your tactical plan in action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TacticalSimulationCanvas
                  teamFormation={teamSetup.formation}
                  opponentFormation={opponentData.formation}
                  tactic={aiRecommendation?.suggestedTactic || 'Tactical Simulation'}
                  onExportVideo={() => toast.info('Video export - use Print/Save as PDF from your browser')}
                />

                <div className="mt-6 flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => setStep('analysis')}>
                    ← Back to Analysis
                  </Button>
                  <Button onClick={() => {
                    const planName = prompt('Enter a name for this tactical plan:');
                    if (planName) {
                      savePlanMutation.mutate({
                        name: planName,
                        teamFormation: teamSetup.formation,
                        teamPlayStyle: teamSetup.playStyle,
                        teamStrengths: teamSetup.strengths,
                        teamKeyPlayers: teamSetup.keyPlayers,
                        opponentFormation: opponentData.formation,
                        opponentPlayStyle: opponentData.playStyle,
                        opponentWeaknesses: opponentData.weaknesses,
                        opponentKeyPlayers: opponentData.keyPlayers,
                        tacticalOptions: aiRecommendation?.options || [],
                        selectedTacticId: aiRecommendation?.selectedOption?.id || 0,
                      });
                    }
                  }}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
