import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, ArrowRight, CheckCircle, BookOpen, Video, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LessonViewer() {
  const { t, language } = useLanguage();
  const [, params] = useRoute('/parent-portal/lesson/:id');
  const [, navigate] = useLocation();
  const lessonId = params?.id ? parseInt(params.id) : 0;

  const { data: lesson, isLoading: lessonLoading } = trpc.parentEducation.getLessonById.useQuery({ id: lessonId });
  const { data: content, isLoading: contentLoading } = trpc.parentEducation.getLessonContent.useQuery({ lessonId });
  const { data: progress } = trpc.parentEducation.getLessonProgress.useQuery({ lessonId });

  const markCompleteMutation = trpc.parentEducation.markLessonComplete.useMutation({
    onSuccess: () => {
      toast.success('Lesson marked as complete!');
    },
  });

  const isCompleted = progress?.completed || false;

  const handleMarkComplete = () => {
    markCompleteMutation.mutate({ lessonId });
  };

  const handleBack = () => {
    if (lesson?.courseId) {
      navigate(`/parent-portal/course/${lesson.courseId}`);
    } else {
      navigate('/parent-portal');
    }
  };

  if (lessonLoading || contentLoading) {
    return (
      <>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
      </>
    );
  }

  if (!lesson) {
    return (
      <>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Lesson not found</p>
          <Button onClick={() => navigate('/parent-portal')} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </div>
      </>
    );
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'text':
        return <FileText className="h-5 w-5" />;
      case 'quiz':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <>
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
          {!isCompleted && (
            <Button onClick={handleMarkComplete} disabled={markCompleteMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          )}
          {isCompleted && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Completed</span>
            </div>
          )}
        </div>

        {/* Lesson Header */}
        <Card className="p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{lesson.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{lesson.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{lesson.duration} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              {getContentIcon('text')}
              <span>{content?.length || 0} sections</span>
            </div>
          </div>
        </Card>

        {/* Lesson Content */}
        <div className="space-y-6">
          {content?.map((item, index) => (
            <Card key={item.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-900 p-3 rounded-lg">
                  {getContentIcon(item.contentType)}
                </div>
                <div className="flex-1">
                  {item.title && (
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{item.title}</h3>
                  )}

                  {item.contentType === 'text' && (
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  )}

                  {item.contentType === 'video' && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <iframe
                        src={item.content}
                        title={item.title || 'Video content'}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {item.contentType === 'quiz' && (
                    <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                      <p className="text-blue-900 dark:text-blue-100 mb-4">
                        Complete the quiz to test your understanding of this lesson.
                      </p>
                      <Button
                        onClick={() => navigate(`/parent-portal/quiz/${lessonId}`)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start Quiz
                      </Button>
                    </div>
                  )}

                  {item.contentType === 'document' && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 mb-4">Download the course material:</p>
                      <Button variant="outline" onClick={() => window.open(item.content, '_blank')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download Document
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Navigation Footer */}
        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
          {!isCompleted && (
            <Button onClick={handleMarkComplete} disabled={markCompleteMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
