import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  Clock,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Languages,
  Award,
  Target,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CoachAssessment() {
  const { t, language, toggleLanguage } = useLanguage();
  
  // Course data translations
  const courseTranslations: Record<string, { title: string; description: string }> = {
    'Grassroots Coaching Certificate': {
      title: language === 'ar' ? 'شهادة تدريب القاعدة الشعبية' : 'Grassroots Coaching Certificate',
      description: language === 'ar' ? 'تدريب مبتدئ لتطوير الشباب (الأعمار 4-12)' : 'Entry-level coaching for youth development (Ages 4-12)'
    },
    'UEFA/FIFA C License': {
      title: language === 'ar' ? 'رخصة يويفا/فيفا C' : 'UEFA/FIFA C License',
      description: language === 'ar' ? 'مستوى أساسي لتدريب فرق الشباب' : 'Foundation level for coaching youth teams'
    },
    'UEFA/FIFA B License': {
      title: language === 'ar' ? 'رخصة يويفا/فيفا B' : 'UEFA/FIFA B License',
      description: language === 'ar' ? 'تدريب متقدم للمستويات شبه الاحترافية' : 'Advanced coaching for semi-professional levels'
    },
    'UEFA/FIFA A License': {
      title: language === 'ar' ? 'رخصة يويفا/فيفا A' : 'UEFA/FIFA A License',
      description: language === 'ar' ? 'مؤهل تدريب مستوى محترف' : 'Professional-level coaching qualification'
    },
    'UEFA Pro / FIFA Pro License': {
      title: language === 'ar' ? 'رخصة يويفا برو / فيفا برو' : 'UEFA Pro / FIFA Pro License',
      description: language === 'ar' ? 'أعلى مؤهل تدريبي للأندية الكبرى' : 'Highest coaching qualification for top-tier clubs'
    }
  };
  
  const getCourseTitle = (course: any) => {
    return courseTranslations[course.name]?.title || course.name;
  };
  
  const getCourseDescription = (course: any) => {
    return courseTranslations[course.name]?.description || course.description;
  };
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  // Fetch courses
  const { data: courses = [] } = trpc.coachEducation.getCourses.useQuery();
  
  // Fetch user badges
  const { data: userBadges = [] } = trpc.coachEducation.getUserBadges.useQuery();
  
  // Fetch questions for selected course
  const { data: questions = [] } = trpc.coachEducation.getQuizQuestions.useQuery(
    { courseId: selectedCourse! },
    { enabled: !!selectedCourse }
  );

  // Submit quiz mutation with proper success handling
  const submitQuiz = trpc.coachEducation.submitQuiz.useMutation({
    onSuccess: (data) => {
      toast.success(t('coachCert.congratulations'), {
        description: 'Quiz submitted successfully!'
      });
      
      // Show earned badges notification
      if (data.earnedBadges && data.earnedBadges.length > 0) {
        data.earnedBadges.forEach((badge: any) => {
          toast.success(`🏆 ${language === 'ar' ? 'شارة جديدة!' : 'New Badge Earned!'}`, {
            description: badge.name,
            duration: 5000
          });
        });
      }
      
      // CRITICAL FIX: Ensure showResults is set to true
      setShowResults(true);
    },
    onError: (error) => {
      toast.error('Error', {
        description: 'Failed to submit quiz. Please try again.'
      });
      console.error('Failed to submit quiz:', error);
    }
  });

  const handleStartQuiz = (courseId: number) => {
    setSelectedCourse(courseId);
    setQuizStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error('Incomplete Quiz', {
        description: 'Please answer all questions before submitting.'
      });
      return;
    }

    const course = courses.find(c => c.id === selectedCourse);
    if (!course) return;

    const answersArray = questions.map((_, index) => answers[index]);
    
    // Submit quiz and show results immediately after
    submitQuiz.mutate({
      courseId: selectedCourse!,
      courseTitle: course.title,
      courseLevel: course.level,
      answers: answersArray
    });
  };

  const handleRetake = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setSelectedCourse(null);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  // Modern Course Selection Screen
  if (!quizStarted) {
    return (
      <>
      <div >
        <div className="container mx-auto px-4 py-8">
          {/* Modern Header */}
          <div className="mb-12 relative">
            <div className="brand-gradient-subtle absolute inset-0 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="brand-gradient p-4 rounded-2xl shadow-lg">
                    <GraduationCap className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h1 className="brand-gradient text-5xl font-bold bg-clip-text text-transparent mb-2">
                      {t('coachCert.title')}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">{t('coachCert.subtitle')}</p>
                  </div>
                </div>
                <Button 
                  onClick={toggleLanguage}
                  variant="outline"
                  size="lg"
                  className="border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 transform hover:scale-105"
                >
                  <Languages className="w-5 h-5 mr-2" />
                  {language === 'en' ? 'عربي' : 'English'}
                </Button>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          {userBadges.length > 0 && (
            <div className="mb-8">
              <Card className="brand-gradient-subtle border-2 border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    {language === 'ar' ? 'إنجازاتك' : 'Your Achievements'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'الشارات التي حصلت عليها' : 'Badges you have earned'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {userBadges.map((badge) => {
                      const IconComponent = {
                        Award,
                        Trophy,
                        Sparkles,
                        Target,
                        CheckCircle2,
                        GraduationCap
                      }[badge.icon as string] || Award;
                      
                      return (
                        <div
                          key={badge.id}
                          className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                        >
                          <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-2">
                            <IconComponent className="h-6 w-6 text-foreground" />
                          </div>
                          <h4 className="text-sm font-semibold text-center mb-1">{badge.name}</h4>
                          <p className="text-xs text-muted-foreground text-center">{badge.description}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {new Date(badge.earnedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Modern Course Cards Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => {
              const badgeColors = [
                'from-green-500 to-emerald-600',
                'from-blue-500 to-cyan-600',
                'from-purple-500 to-pink-600',
                'from-orange-500 to-red-600',
                'from-yellow-500 to-orange-600'
              ];
              const badgeColor = badgeColors[index % badgeColors.length];

              return (
                <Card 
                  key={course.id} 
                  className="group relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-2 border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-500 hover:shadow-2xl hover:scale-105 rounded-2xl"
                >
                  {/* Animated Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${badgeColor} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Badge className={`mb-3 px-4 py-1.5 bg-gradient-to-r ${badgeColor} text-white border-0 shadow-lg text-xs font-bold`}>
                          {course.level === 'grassroots' && t('coachCert.grassrootsBadge')}
                          {course.level === 'uefa_c' && t('coachCert.uefaCBadge')}
                          {course.level === 'uefa_b' && t('coachCert.uefaBBadge')}
                          {course.level === 'uefa_a' && t('coachCert.uefaABadge')}
                          {course.level === 'uefa_pro' && t('coachCert.uefaProBadge')}
                        </Badge>
                        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                          {language === 'ar' ? (
                            course.level === 'grassroots' ? t('coachCert.grassroots') :
                            course.level === 'uefa_c' ? t('coachCert.uefaC') :
                            course.level === 'uefa_b' ? t('coachCert.uefaB') :
                            course.level === 'uefa_a' ? t('coachCert.uefaA') :
                            t('coachCert.uefaPro')
                          ) : course.title}
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {language === 'ar' ? (
                            course.level === 'grassroots' ? t('coachCert.grassrootsDesc') :
                            course.level === 'uefa_c' ? t('coachCert.uefaCDesc') :
                            course.level === 'uefa_b' ? t('coachCert.uefaBDesc') :
                            course.level === 'uefa_a' ? t('coachCert.uefaADesc') :
                            t('coachCert.uefaProDesc')
                          ) : course.description}
                        </CardDescription>
                      </div>
                      <Award className={`w-12 h-12 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-500 dark:group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-12`} />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <Clock className="w-5 h-5 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{course.duration}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('coachCert.minutes')}</div>
                      </div>
                      {/* The courses endpoint doesn't carry these yet, so only
                          show the tiles once it actually returns them. */}
                      {(course as any).questionsCount != null && (
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <BarChart3 className="w-5 h-5 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{(course as any).questionsCount}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('coachCert.questionsCount')}</div>
                        </div>
                      )}
                      {(course as any).passingScore != null && (
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <Target className="w-5 h-5 mx-auto mb-2 text-green-600 dark:text-green-400" />
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{(course as any).passingScore}%</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('coachCert.pass')}</div>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={() => handleStartQuiz(course.id)}
                      className={`w-full bg-gradient-to-r ${badgeColor} hover:shadow-xl text-white font-semibold py-6 rounded-xl transition-all duration-300 transform hover:scale-105 group/btn`}
                    >
                      <Sparkles className="mr-2 h-5 w-5 group-hover/btn:animate-spin" />
                      {t('coachCert.startAssessment')}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      </>
    );
  }

  // Results Screen with Modern Design
  if (showResults) {
    const score = calculateScore();
    const passed = score >= 70;

    return (
      <>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl rounded-3xl border-2 border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
          {/* Animated Header Background */}
          <div className={`relative p-12 ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
            </div>
            <div className="relative text-center">
              {passed ? (
                <div className="inline-block p-6 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-bounce">
                  <CheckCircle2 className="h-24 w-24 text-foreground" />
                </div>
              ) : (
                <div className="inline-block p-6 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                  <XCircle className="h-24 w-24 text-foreground" />
                </div>
              )}
              <h2 className="text-5xl font-bold text-foreground mb-3">
                {passed ? t('coachCert.congratulations') : t('coachCert.failed')}
              </h2>
              <p className="text-xl text-foreground/90">
                {passed ? t('coachCert.passedMessage') : t('coachCert.failedMessage')}
              </p>
            </div>
          </div>

          <CardContent className="p-12">
            <div className="space-y-8">
              {/* Score Display */}
              <div className="text-center relative">
                <div className="inline-block relative">
                  <div className={`text-8xl font-black ${passed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'} mb-3`}>
                    {score}%
                  </div>
                  <div className="absolute -top-4 -right-4">
                    {passed && <Sparkles className="w-12 h-12 text-yellow-700 dark:text-yellow-500 animate-pulse" />}
                  </div>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-semibold">{t('coachCert.yourScore')}</p>
                <p className="text-sm text-muted-foreground dark:text-slate-500 mt-2">
                  {t('coachCert.requiredScore')}: 70%
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-green-600 dark:text-green-400" />
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {questions.filter((q, i) => answers[i] === q.correctAnswer).length}
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('coachCert.correct')}</p>
                </div>
                <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800">
                  <XCircle className="w-8 h-8 mx-auto mb-3 text-red-600 dark:text-red-400" />
                  <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
                    {questions.filter((q, i) => answers[i] !== q.correctAnswer).length}
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('coachCert.incorrect')}</p>
                </div>
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                  <BarChart3 className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{questions.length}</div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('coachCert.total')}</p>
                </div>
              </div>

              {/* Certificate Section */}
              {passed && submitQuiz.data?.certificateUrl && (
                <div className="brand-gradient-subtle border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-yellow-500 rounded-2xl">
                      <Trophy className="h-10 w-10 text-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-2xl text-slate-900 dark:text-white">{t('coachCert.certificateEarned')}</p>
                      <p className="text-slate-600 dark:text-slate-400">
                        {t('coachCert.congratsComplete')}
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="brand-gradient w-full text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => window.open(submitQuiz.data?.certificateUrl || '', '_blank')}
                  >
                    <Trophy className="mr-3 h-6 w-6" />
                    {t('coachCert.viewCertificate')}
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 py-6 rounded-xl border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                  onClick={handleRetake}
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  {t('coachCert.tryAnotherCourse')}
                </Button>
                {!passed && (
                  <Button 
                    className="brand-gradient flex-1 py-6 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => {
                      setQuizStarted(true);
                      setCurrentQuestion(0);
                      setAnswers({});
                      setShowResults(false);
                    }}
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    {t('coachCert.tryAgain')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </>
    );
  }

  // Quiz Screen with Modern Design
  const currentQ = questions[currentQuestion];

  return (
    <>
    <div >
      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-2 border-slate-200/50 dark:border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {t('coachCert.question')} {currentQuestion + 1} {t('coachCert.of')} {questions.length}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {answeredCount} / {questions.length} {t('coachCert.answered')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(progress)}%
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('coachCert.complete')}</p>
                </div>
              </div>
              <Progress value={progress} className="h-3 bg-slate-200 dark:bg-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </Progress>
            </div>
          </Card>
        </div>

        {/* Question Card */}
        <Card className="mb-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-2 border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl">
          <CardHeader className="p-8">
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ?.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <RadioGroup 
              value={answers[currentQuestion]?.toString()} 
              onValueChange={(value) => handleAnswerSelect(currentQuestion, parseInt(value))}
              className="space-y-4"
            >
              {currentQ?.options.map((option: string, index: number) => (
                <div 
                  key={index} 
                  className={`relative flex items-center space-x-4 p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer group hover:shadow-lg ${
                    answers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} className="w-6 h-6" />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 text-lg cursor-pointer text-slate-900 dark:text-white font-medium"
                  >
                    {option}
                  </Label>
                  {answers[currentQuestion] === index && (
                    <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-in zoom-in duration-300" />
                  )}
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex-1 py-6 rounded-xl border-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t('coachCert.previous')}
          </Button>
          
          {currentQuestion < questions.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={answers[currentQuestion] === undefined}
              className="brand-gradient flex-1 py-6 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
            >
              {t('coachCert.next')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <div className="flex-1 flex flex-col gap-2">
              {answeredCount < questions.length && (
                <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                  Please answer all questions ({answeredCount}/{questions.length} answered)
                </p>
              )}
              <Button
                onClick={handleSubmit}
                disabled={answeredCount < questions.length || submitQuiz.isPending}
                className="brand-gradient w-full py-6 rounded-xl text-white font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                title={answeredCount < questions.length ? `Answer ${questions.length - answeredCount} more question(s) to submit` : 'Submit quiz'}
              >
                {submitQuiz.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    {t('coachCert.submitting')}
                  </>
                ) : (
                  <>
                    <Trophy className="mr-2 h-5 w-5" />
                    {t('coachCert.submit')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
