import { useState } from 'react';
import { toast } from 'sonner';
import { useRoute, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Download, Clock, CheckCircle2 } from 'lucide-react';
import { learningContent } from '../../../shared/learningContent';
import Markdown from 'react-markdown';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CourseContent() {
  const [, params] = useRoute('/coach-education/course/:level');
  const level = params?.level || 'grassroots';
  const { t, language } = useLanguage();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const courseContent = learningContent[level];

  if (!courseContent) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Course Not Found</CardTitle>
              <CardDescription>The requested course content is not available.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/coach-education/courses">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Courses
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const currentModule = selectedModule 
    ? courseContent.modules.find(m => m.id === selectedModule)
    : null;

  const generatePDF = trpc.coachEducation.generateModulePDF.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: () => {
      toast.error('Failed to generate PDF. Please try again.');
    },
  });

  const handleDownloadPDF = async (moduleId: string) => {
    generatePDF.mutate({ level, moduleId });
  };

  return (
    <>
    <div >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/coach-education/courses">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {level.toUpperCase().replace('_', ' ')} Course Content
          </h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive learning materials and resources
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modules List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Modules
                </CardTitle>
                <CardDescription>
                  {courseContent.modules.length} learning modules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {courseContent.modules.map((module, index) => (
                  <Button
                    key={module.id}
                    variant={selectedModule === module.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedModule(module.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{module.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {module.duration}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Module Content */}
          <div className="lg:col-span-2">
            {currentModule ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{currentModule.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {currentModule.duration}
                        </span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(currentModule.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Key Points */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      Key Learning Points
                    </h3>
                    <ul className="space-y-2">
                      {currentModule.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Main Content */}
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <Markdown>{currentModule.content}</Markdown>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a Module</h3>
                  <p className="text-muted-foreground">
                    Choose a module from the left to view its content
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
