import React, { useState } from 'react';
import { AIChatBox, type Message } from '@/components/AIChatBox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {Brain, Users, TrendingUp, Target, Lightbulb, ArrowLeft} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


export default function CoachAIAssistant() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: `You are an expert football coach assistant with deep knowledge of:
- Player development and position analysis
- Tactical formations and strategies
- Performance metrics and analytics
- Training methodologies
- Youth football development
- Sports psychology and motivation

Your role is to help coaches make data-driven decisions about:
1. Player position recommendations based on skills and physical attributes
2. Team formation and tactical strategies
3. Performance analysis and improvement areas
4. Training program design
5. Opponent analysis and match preparation

Always provide:
- Clear, actionable recommendations
- Evidence-based reasoning
- Specific examples when possible
- Consideration of player age and development stage
- Both short-term and long-term perspectives

Be supportive, encouraging, and focused on player development.`
    }
  ]);

  const chatMutation = trpc.aiCoach.askQuestion.useMutation({
    onSuccess: (response) => {
      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    }
  });

  const handleSendMessage = (content: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);
    
    // Send to AI
    chatMutation.mutate({ question: content, context: 'tactical' });
  };

  const quickPrompts = [
    {
      icon: Target,
      title: 'Player Position Analysis',
      description: 'Analyze player skills and recommend best position',
      prompt: 'I need help analyzing a player\'s profile to determine their best position. The player has the following characteristics:\n\n[Paste player stats here]\n\nPlease recommend the top 3 positions with confidence scores and reasoning.'
    },
    {
      icon: Users,
      title: 'Team Formation',
      description: 'Get tactical formation recommendations',
      prompt: 'Based on my team\'s player profiles and strengths, what formation would you recommend? Here are my key players:\n\n[List key players and their positions]\n\nPlease suggest formations and explain the tactical advantages.'
    },
    {
      icon: TrendingUp,
      title: 'Performance Analysis',
      description: 'Analyze team or player performance trends',
      prompt: 'I want to analyze performance trends for [player/team name]. Here are the recent stats:\n\n[Paste performance data]\n\nWhat patterns do you see and what recommendations do you have?'
    },
    {
      icon: Lightbulb,
      title: 'Training Plan',
      description: 'Create customized training programs',
      prompt: 'Create a training plan for a player who needs to improve in these areas:\n\n[List areas to improve]\n\nThe player is [age] years old and plays as [position]. Please provide a detailed weekly training schedule.'
    }
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          
          <BackButton />
<h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI Coach Assistant
          </h1>
          <p className="text-muted-foreground mt-2">
            Get expert insights on player development, tactics, and team strategy
          </p>
        </div>

        {/* Quick Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickPrompts.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSendMessage(item.prompt)}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="mt-1">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* AI Chat */}
        <Card>
          <CardHeader>
            <CardTitle>Chat with AI Coach</CardTitle>
            <CardDescription>
              Ask questions about player analysis, tactics, training plans, or any coaching topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={chatMutation.isPending}
              placeholder="Ask me anything about coaching, player development, tactics, or training..."
              suggestedPrompts={quickPrompts.map(p => p.prompt)}
            />
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Tips for Best Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Be specific:</strong> Include player stats, age, position, and specific concerns</li>
              <li>• <strong>Provide context:</strong> Mention team formation, playing style, and objectives</li>
              <li>• <strong>Ask follow-ups:</strong> Dig deeper into recommendations with clarifying questions</li>
              <li>• <strong>Share data:</strong> Copy-paste performance metrics or skill ratings for detailed analysis</li>
              <li>• <strong>Think long-term:</strong> Ask about development paths and progression plans</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
