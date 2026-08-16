import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

// Toast notifications handled by tRPC
// Using emoji icons instead of heroicons

export default function AdminCourseManagement() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);

  const { data: courses, refetch: refetchCourses } = trpc.educationAcademy.getCourses.useQuery({});
  const { data: lessons, refetch: refetchLessons } = trpc.educationAcademy.getCourseLessons.useQuery(
    { courseId: selectedCourse! },
    { enabled: !!selectedCourse }
  );

  const createCourseMutation = trpc.educationAcademy.createCourse.useMutation({
    onSuccess: () => {
      console.log('Course created successfully');
      refetchCourses();
      setShowCourseDialog(false);
    },
    onError: (error) => {
      console.error(`Failed to create course: ${error.message}`);
    },
  });

  const updateCourseMutation = trpc.educationAcademy.updateCourse.useMutation({
    onSuccess: () => {
      console.log('Course updated successfully');
      refetchCourses();
      setShowCourseDialog(false);
    },
    onError: (error) => {
      console.error(`Failed to update course: ${error.message}`);
    },
  });

  const deleteCourseMutation = trpc.educationAcademy.deleteCourse.useMutation({
    onSuccess: () => {
      console.log('Course deleted successfully');
      refetchCourses();
    },
    onError: (error) => {
      console.error(`Failed to delete course: ${error.message}`);
    },
  });

  const createLessonMutation = trpc.educationAcademy.createLesson.useMutation({
    onSuccess: () => {
      console.log('Lesson created successfully');
      refetchLessons();
      setShowLessonDialog(false);
    },
    onError: (error) => {
      console.error(`Failed to create lesson: ${error.message}`);
    },
  });

  const deleteLessonMutation = trpc.educationAcademy.deleteLesson.useMutation({
    onSuccess: () => {
      console.log('Lesson deleted successfully');
      refetchLessons();
    },
    onError: (error) => {
      console.error(`Failed to delete lesson: ${error.message}`);
    },
  });

  const handleCreateCourse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCourseMutation.mutate({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as any,
      difficulty: formData.get('difficulty') as any,
      thumbnailUrl: formData.get('thumbnailUrl') as string,
      estimatedHours: parseInt(formData.get('estimatedHours') as string),
    });
  };

  const handleCreateLesson = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createLessonMutation.mutate({
      courseId: selectedCourse!,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      content: formData.get('content') as string,
      videoUrl: formData.get('videoUrl') as string || undefined,
      duration: parseInt(formData.get('duration') as string),
      orderIndex: parseInt(formData.get('orderIndex') as string),
    });
  };

  const handleDeleteCourse = (courseId: number) => {
    if (confirm('Are you sure you want to delete this course? This will also delete all lessons and quizzes.')) {
      deleteCourseMutation.mutate({ courseId });
    }
  };

  const handleDeleteLesson = (lessonId: number) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      deleteLessonMutation.mutate({ lessonId });
    }
  };

  return (
    <>
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          
              <BackButton />
<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('Course Management')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage courses, lessons, and quizzes for the Parent Education Academy
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {courses?.length || 0}
                </p>
              </div>
              <div className="text-5xl">📚</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Lessons</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {courses?.reduce((sum: any, c: any) => sum + (c.totalLessons || 0), 0) || 0}
                </p>
              </div>
              <div className="text-5xl">🎥</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Enrollments</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {courses?.reduce((sum: any, c: any) => sum + (c.enrollmentCount || 0), 0) || 0}
                </p>
              </div>
              <div className="text-5xl">❓</div>
            </div>
          </div>
        </div>

        {/* Course List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Courses</h2>
            <button
              onClick={() => setShowCourseDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              Add Course
            </button>
          </div>

          <div className="p-6">
            {!courses || courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-gray-600 dark:text-gray-400">No courses yet. Create your first course!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {course.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            course.category === 'nutrition' ? 'bg-green-100 text-green-800' :
                            course.category === 'youth_development' ? 'bg-blue-100 text-blue-800' :
                            course.category === 'sports_psychology' ? 'bg-purple-100 text-purple-800' :
                            course.category === 'injury_prevention' ? 'bg-red-100 text-red-800' :
                            course.category === 'parenting' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {course.category}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            course.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                            course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {course.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{(course as any).totalLessons || 0} lessons</span>
                          <span>{course.duration ? (course.duration / 60).toFixed(1) : 0}h</span>
                          <span>{course.enrollmentCount || 0} enrolled</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCourse(course.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        >
                          📖
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Lessons for selected course */}
                    {selectedCourse === course.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Lessons</h4>
                          <button
                            onClick={() => setShowLessonDialog(true)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                          >
                            <Plus className="h-4 w-4" />
                            Add Lesson
                          </button>
                        </div>
                        {!lessons || lessons.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No lessons yet</p>
                        ) : (
                          <div className="space-y-2">
                            {lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                              >
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {lesson.sequenceNumber}. {lesson.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {lesson.duration} min
                                    {lesson.videoUrl && ' • Video included'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Course Dialog */}
        {showCourseDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Course</h3>
              </div>
              <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="general">General</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="youth_development">Youth Development</option>
                      <option value="sports_psychology">Sports Psychology</option>
                      <option value="injury_prevention">Injury Prevention</option>
                      <option value="parenting">Parenting</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      name="difficulty"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    name="thumbnailUrl"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createCourseMutation.isPending}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
                  >
                    {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCourseDialog(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Lesson Dialog */}
        {showLessonDialog && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Lesson</h3>
              </div>
              <form onSubmit={handleCreateLesson} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content (Markdown supported)
                  </label>
                  <textarea
                    name="content"
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Video URL (optional)
                  </label>
                  <input
                    type="url"
                    name="videoUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Order Index
                    </label>
                    <input
                      type="number"
                      name="orderIndex"
                      required
                      min="1"
                      defaultValue={(lessons?.length || 0) + 1}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createLessonMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    {createLessonMutation.isPending ? 'Creating...' : 'Create Lesson'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLessonDialog(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
