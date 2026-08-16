import { useParams, useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { ArrowLeft, CheckCircle2, XCircle, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function QuizReview() {
  const { t, language } = useLanguage();
  const { attemptId } = useParams<{ attemptId: string }>();
  const [, setLocation] = useLocation();
  
  const { data: reviewData, isLoading } = trpc.coachEducation.getQuizReview.useQuery(
    { attemptId: parseInt(attemptId || '0') },
    { enabled: !!attemptId }
  );

  if (isLoading) {
    return (
      <>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading quiz review...</p>
        </div>
      </div>
      </>
    );
  }

  if (!reviewData) {
    return (
      <>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Quiz review not found</p>
          <button
            onClick={() => setLocation('/coach-dashboard')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
      </>
    );
  }

  const { attempt, questions, userAnswers } = reviewData;

  return (
    <>
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setLocation('/coach-dashboard')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quiz Review
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {attempt.courseTitle}
            </p>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <Award className={`w-6 h-6 mr-2 ${attempt.passed ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-lg font-semibold">
                  Score: <span className={attempt.passed ? 'text-green-600' : 'text-red-600'}>
                    {attempt.score}%
                  </span>
                </span>
              </div>
              
              <div className="text-gray-600 dark:text-gray-400">
                {attempt.passed ? 'Passed' : 'Failed'} • {attempt.correctAnswers} / {questions.length} correct
              </div>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            const options = typeof question.options === 'string' 
              ? JSON.parse(question.options) 
              : question.options;

            return (
              <div
                key={question.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${
                  isCorrect ? 'border-green-500' : 'border-red-500'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                    Question {index + 1}
                  </h3>
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                </div>

                {/* Question Text */}
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {question.question}
                </p>

                {/* Options */}
                <div className="space-y-3">
                  {options.map((option: string, optIndex: number) => {
                    const isUserAnswer = userAnswer === optIndex;
                    // correctAnswer is stored as a string index.
                    const isCorrectAnswer = Number(question.correctAnswer) === optIndex;
                    
                    let optionClass = 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
                    if (isCorrectAnswer) {
                      optionClass = 'bg-green-50 dark:bg-green-900/20 border-green-500';
                    } else if (isUserAnswer && !isCorrect) {
                      optionClass = 'bg-red-50 dark:bg-red-900/20 border-red-500';
                    }

                    return (
                      <div
                        key={optIndex}
                        className={`p-4 rounded-lg border-2 ${optionClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 dark:text-white">
                            {option}
                          </span>
                          {isCorrectAnswer && (
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              Correct Answer
                            </span>
                          )}
                          {isUserAnswer && !isCorrect && (
                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                              Your Answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                      Explanation:
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => setLocation('/coach-dashboard')}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Return to Dashboard
          </button>
          <button
            onClick={() => setLocation('/coach-assessment')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
