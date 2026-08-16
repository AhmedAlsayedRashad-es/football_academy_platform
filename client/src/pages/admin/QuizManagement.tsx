import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  BookOpen, 
  HelpCircle,
  CheckCircle,
  XCircle,
  Save,
  Loader2, ArrowLeft} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


// Mirrors the stored row, where every option and the course link are nullable.
interface QuizQuestion {
  id: number;
  courseId: number | null;
  question: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string;
  explanation: string | null;
}

interface Course {
  id: number;
  title: string;
  level: string;
}

export default function QuizManagement() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state for new/edit question
  const [formData, setFormData] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: ''
  });

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = trpc.courses.getAllCourses.useQuery();
  
  // Mutations
  const addQuestion = trpc.quiz.addQuestion.useMutation();
  const updateQuestion = trpc.quiz.updateQuestion.useMutation();
  const deleteQuestion = trpc.quiz.deleteQuestion.useMutation();
  const getQuestions = trpc.quiz.getQuestionsByCourse.useMutation();

  // Load questions when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      loadQuestions(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadQuestions = async (courseId: number) => {
    setIsLoading(true);
    try {
      const result = await getQuestions.mutateAsync({ courseId });
      setQuestions(result || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: ''
    });
  };

  const handleAddQuestion = async () => {
    if (!selectedCourseId) {
      toast.error('Please select a course first');
      return;
    }

    if (!formData.question || !formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addQuestion.mutateAsync({
        courseId: selectedCourseId,
        ...formData
      });
      toast.success('Question added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      loadQuestions(selectedCourseId);
    } catch (error) {
      console.error('Failed to add question:', error);
      toast.error('Failed to add question');
    }
  };

  const handleEditQuestion = async () => {
    if (!editingQuestion) return;

    try {
      await updateQuestion.mutateAsync({
        id: editingQuestion.id,
        ...formData
      });
      toast.success('Question updated successfully');
      setIsEditDialogOpen(false);
      setEditingQuestion(null);
      resetForm();
      if (selectedCourseId) loadQuestions(selectedCourseId);
    } catch (error) {
      console.error('Failed to update question:', error);
      toast.error('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await deleteQuestion.mutateAsync({ id: questionId });
      toast.success('Question deleted successfully');
      if (selectedCourseId) loadQuestions(selectedCourseId);
    } catch (error) {
      console.error('Failed to delete question:', error);
      toast.error('Failed to delete question');
    }
  };

  const openEditDialog = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      optionA: question.optionA ?? '',
      optionB: question.optionB ?? '',
      optionC: question.optionC ?? '',
      optionD: question.optionD ?? '',
      correctAnswer: (question.correctAnswer as 'A' | 'B' | 'C' | 'D') || 'A',
      explanation: question.explanation || ''
    });
    setIsEditDialogOpen(true);
  };

  const getCorrectAnswerText = (question: QuizQuestion) => {
    const answers: Record<string, string> = {
      'A': question.optionA ?? '',
      'B': question.optionB ?? '',
      'C': question.optionC ?? '',
      'D': question.optionD ?? ''
    };
    return answers[question.correctAnswer];
  };

  return (
    <>
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <HelpCircle className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              
              <BackButton />
<h1 className="text-2xl md:text-3xl font-bold text-foreground">Quiz Management</h1>
              <p className="text-muted-foreground">Create and manage quiz questions for courses</p>
            </div>
          </div>
        </div>

        {/* Course Selector */}
        <Card className="mb-6 bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Select Course
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose a course to manage its quiz questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedCourseId?.toString() || ''} 
              onValueChange={(value) => setSelectedCourseId(parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-96 bg-muted border-border text-foreground">
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {coursesLoading ? (
                  <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                ) : (
                  courses.map((course: Course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title} ({course.level})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Questions List */}
        {selectedCourseId && (
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Quiz Questions</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {questions.length} question{questions.length !== 1 ? 's' : ''} in this course
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add New Question</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Create a new quiz question for this course
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-muted-foreground">Question *</Label>
                        <Textarea
                          value={formData.question}
                          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                          placeholder="Enter the question..."
                          className="bg-muted border-border text-foreground mt-1"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Option A *</Label>
                          <Input
                            value={formData.optionA}
                            onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                            className="bg-muted border-border text-foreground mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Option B *</Label>
                          <Input
                            value={formData.optionB}
                            onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                            className="bg-muted border-border text-foreground mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Option C *</Label>
                          <Input
                            value={formData.optionC}
                            onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                            className="bg-muted border-border text-foreground mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Option D *</Label>
                          <Input
                            value={formData.optionD}
                            onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                            className="bg-muted border-border text-foreground mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Correct Answer *</Label>
                        <Select 
                          value={formData.correctAnswer} 
                          onValueChange={(value: 'A' | 'B' | 'C' | 'D') => setFormData({ ...formData, correctAnswer: value })}
                        >
                          <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A - {formData.optionA || '...'}</SelectItem>
                            <SelectItem value="B">B - {formData.optionB || '...'}</SelectItem>
                            <SelectItem value="C">C - {formData.optionC || '...'}</SelectItem>
                            <SelectItem value="D">D - {formData.optionD || '...'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Explanation (Optional)</Label>
                        <Textarea
                          value={formData.explanation}
                          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                          placeholder="Explain why this is the correct answer..."
                          className="bg-muted border-border text-foreground mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} className="border-border text-muted-foreground">
                        Cancel
                      </Button>
                      <Button onClick={handleAddQuestion} className="bg-purple-600 hover:bg-purple-700" disabled={addQuestion.isPending}>
                        {addQuestion.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Add Question
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No questions yet. Add your first question!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div 
                      key={question.id}
                      className="p-4 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-full text-purple-600 dark:text-purple-400 font-bold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground font-medium mb-3">{question.question}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {['A', 'B', 'C', 'D'].map((letter) => {
                                const optionKey = `option${letter}` as keyof QuizQuestion;
                                const isCorrect = question.correctAnswer === letter;
                                return (
                                  <div 
                                    key={letter}
                                    className={`p-2 rounded flex items-center gap-2 ${
                                      isCorrect 
                                        ? 'bg-green-500/20 border border-green-500/50' 
                                        : 'bg-slate-600/50'
                                    }`}
                                  >
                                    {isCorrect ? (
                                      <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-500 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className={isCorrect ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}>
                                      {letter}. {question[optionKey] as string}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            {question.explanation && (
                              <p className="mt-3 text-sm text-muted-foreground italic">
                                💡 {question.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(question)}
                            className="border-border text-muted-foreground hover:bg-muted"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="border-red-600 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Question</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modify the quiz question
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Question *</Label>
                <Textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter the question..."
                  className="bg-muted border-border text-foreground mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Option A *</Label>
                  <Input
                    value={formData.optionA}
                    onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Option B *</Label>
                  <Input
                    value={formData.optionB}
                    onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Option C *</Label>
                  <Input
                    value={formData.optionC}
                    onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Option D *</Label>
                  <Input
                    value={formData.optionD}
                    onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Correct Answer *</Label>
                <Select 
                  value={formData.correctAnswer} 
                  onValueChange={(value: 'A' | 'B' | 'C' | 'D') => setFormData({ ...formData, correctAnswer: value })}
                >
                  <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - {formData.optionA || '...'}</SelectItem>
                    <SelectItem value="B">B - {formData.optionB || '...'}</SelectItem>
                    <SelectItem value="C">C - {formData.optionC || '...'}</SelectItem>
                    <SelectItem value="D">D - {formData.optionD || '...'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">Explanation (Optional)</Label>
                <Textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Explain why this is the correct answer..."
                  className="bg-muted border-border text-foreground mt-1"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingQuestion(null); resetForm(); }} className="border-border text-muted-foreground">
                Cancel
              </Button>
              <Button onClick={handleEditQuestion} className="bg-purple-600 hover:bg-purple-700" disabled={updateQuestion.isPending}>
                {updateQuestion.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  );
}
