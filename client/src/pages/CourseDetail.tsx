import { useState } from 'react';
import { useRoute, useLocation} from 'wouter';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Card } from '../components/ui/card';
import { BookOpen, Video, FileText, CheckCircle, Clock, ArrowLeft, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CourseDetail() {
  const { t, language } = useLanguage();
  const [, params] = useRoute('/parent-portal/course/:id');
  const [, navigate] = useLocation();
  const courseId = params?.id ? parseInt(params.id) : 0;

  const { data: course, isLoading: courseLoading } = trpc.parentEducation.getCourseById.useQuery({ id: courseId });
  const { data: lessons, isLoading: lessonsLoading } = trpc.parentEducation.getCourseLessons.useQuery({ courseId });
  const { data: progress } = trpc.parentEducation.getCourseProgress.useQuery({ courseId });

  if (courseLoading || lessonsLoading) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
          </div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Course not found</p>
            <Button onClick={() => navigate('/parent-portal')} className="mt-4">
              Back to Courses
            </Button>
          </div>
        </div>
      </>
    );
  }

  const completedLessons = progress?.filter((p) => p.completed).length || 0;
  const totalLessons = lessons?.length || 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const getLessonIcon = (lessonId: number) => {
    const lessonProgress = progress?.find((p) => p.lessonId === lessonId);
    return lessonProgress?.completed ? (
      <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-500" />
    ) : (
      <Clock className="h-5 w-5 text-muted-foreground" />
    );
  };

  return (
    <>
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/parent-portal')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>

        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-900 p-4 rounded-lg">
              <BookOpen className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{totalLessons} lessons</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Course Progress</span>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {completedLessons} / {totalLessons} lessons completed
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Lessons</h2>
          {lessons?.map((lesson, index) => {
            const lessonProgress = progress?.find((p) => p.lessonId === lesson.id);
            const isCompleted = lessonProgress?.completed || false;

            return (
              <Card
                key={lesson.id}
                className={`p-6 hover:shadow-lg transition-shadow cursor-pointer ${
                  isCompleted ? 'border-green-500 border-2' : ''
                }`}
                onClick={() => navigate(`/parent-portal/lesson/${lesson.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-lg">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {lesson.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{lesson.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{lesson.duration} min</span>
                          </div>
                          {isCompleted && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getLessonIcon(lesson.id)}
                        <Button size="sm" className="mt-2">
                          <Play className="h-4 w-4 mr-2" />
                          {isCompleted ? 'Review' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Completion Certificate */}
        {progressPercentage === 100 && (
          <Card className="brand-gradient mt-6 p-6 border-2 border-emerald-500">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Congratulations! 🎉
              </h3>
              <p className="text-gray-300 mb-4">
                You have completed all lessons in this course
              </p>
              <Button className="bg-emerald-600 hover:bg-emerald-700">Download Certificate</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}
