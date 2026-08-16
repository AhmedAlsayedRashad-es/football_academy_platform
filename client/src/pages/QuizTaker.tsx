import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function QuizTaker() {
  const [, params] = useRoute('/parent-portal/quiz/:courseId');
  const [, navigate] = useLocation();
  const courseId = params?.courseId ? parseInt(params.courseId) : 0;

  const { t, language } = useLanguage();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const { data: questions, isLoading } = trpc.parentEducation.getQuizQuestions.useQuery({ courseId });
  const submitQuizMutation = trpc.parentEducation.submitQuiz.useMutation({
    onSuccess: (result) => {
      setShowResults(true);
      if (result.passed) {
        toast.success(`Congratulations! You passed with ${result.score}%`);
      } else {
        toast.error(`You scored ${result.score}%. Passing score is 70%.`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to submit quiz: ${error.message}`);
    },
  });

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  if (isLoading) {
    return (
      <>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading quiz...</p>
        </div>
      </div>
      </>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No quiz questions available</p>
          <Button onClick={() => navigate('/parent-portal')} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </div>
      </>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: answerIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    submitQuizMutation.mutate({
      courseId,
      answers: Object.entries(answers).map(([questionId, answerIndex]) => ({
        questionId: parseInt(questionId),
        answerIndex,
      })),
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResults) {
    const result = submitQuizMutation.data;
    if (!result) return null;

    return (
      <>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              {result.passed ? (
                <CheckCircle className="h-20 w-20 text-green-700 dark:text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
              )}
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {result.passed ? 'Congratulations!' : 'Keep Trying!'}
              </h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                You scored {result.score}% ({result.correctAnswers} out of {result.totalQuestions} correct)
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {result.passed
                  ? 'You have successfully passed this quiz!'
                  : 'You need 70% to pass. Review the material and try again.'}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate(`/parent-portal/course/${courseId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
                {!result.passed && (
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Retake Quiz
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      </>
    );
  }

  const options = JSON.parse(currentQuestion.options as string) as string[];
  const selectedAnswer = answers[currentQuestion.id];
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <>
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(`/parent-portal/course/${courseId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Quiz
          </Button>
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="p-8 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {currentQuestion.question}
          </h3>

          <RadioGroup value={selectedAnswer?.toString()} onValueChange={(val) => handleAnswerSelect(parseInt(val))}>
            <div className="space-y-4">
              {options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                    selectedAnswer === index
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer text-gray-900 dark:text-white"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Object.keys(answers).length} of {questions.length} answered
          </div>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitQuizMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Quiz
            </Button>
          )}
        </div>

        {!allAnswered && currentQuestionIndex === questions.length - 1 && (
          <p className="text-center text-sm text-orange-600 dark:text-orange-400 mt-4">
            Please answer all questions before submitting
          </p>
        )}
      </div>
    </div>
    </>
  );
}
