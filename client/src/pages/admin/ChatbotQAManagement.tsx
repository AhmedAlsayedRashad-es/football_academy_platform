import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Pencil, Trash2, Bot, Search, Tag, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ChatbotQAManagement() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    question: '',
    answer: '',
    keywords: '',
    category: 'general',
    priority: 0,
  });

  const { data: qaList = [], refetch } = trpc.chatbotQA.getAll.useQuery();
  const createMutation = trpc.chatbotQA.create.useMutation({
    onSuccess: () => { toast({ title: isRTL ? 'تم الإضافة بنجاح' : 'Q&A added successfully' }); refetch(); resetForm(); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
  const updateMutation = trpc.chatbotQA.update.useMutation({
    onSuccess: () => { toast({ title: isRTL ? 'تم التحديث بنجاح' : 'Updated successfully' }); refetch(); resetForm(); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
  const deleteMutation = trpc.chatbotQA.delete.useMutation({
    onSuccess: () => { toast({ title: isRTL ? 'تم الحذف' : 'Deleted' }); refetch(); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const resetForm = () => {
    setForm({ question: '', answer: '', keywords: '', category: 'general', priority: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (qa: typeof qaList[0]) => {
    setForm({
      question: qa.question,
      answer: qa.answer,
      keywords: qa.keywords || '',
      category: qa.category || 'general',
      priority: qa.priority,
    });
    setEditingId(qa.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleToggleActive = (qa: typeof qaList[0]) => {
    updateMutation.mutate({ id: qa.id, isActive: !qa.isActive });
  };

  const filtered = qaList.filter(qa =>
    qa.question.toLowerCase().includes(search.toLowerCase()) ||
    qa.answer.toLowerCase().includes(search.toLowerCase()) ||
    (qa.keywords || '').toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['general', 'pricing', 'schedule', 'registration', 'location', 'coaching', 'facilities'];

  return (
    <>
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{isRTL ? 'إدارة أسئلة الشات بوت' : 'Chatbot Q&A Management'}</h1>
            <p className="text-muted-foreground text-sm">{isRTL ? 'إدارة قاعدة بيانات الأسئلة والأجوبة للشات بوت' : 'Manage the chatbot knowledge base'}</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          {isRTL ? 'إضافة سؤال جديد' : 'Add New Q&A'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-primary">{qaList.length}</p>
          <p className="text-sm text-muted-foreground">{isRTL ? 'إجمالي الأسئلة' : 'Total Q&As'}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-700 dark:text-green-500">{qaList.filter(q => q.isActive).length}</p>
          <p className="text-sm text-muted-foreground">{isRTL ? 'نشط' : 'Active'}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-500">{qaList.filter(q => !q.isActive).length}</p>
          <p className="text-sm text-muted-foreground">{isRTL ? 'غير نشط' : 'Inactive'}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {editingId ? (isRTL ? 'تعديل السؤال' : 'Edit Q&A') : (isRTL ? 'إضافة سؤال جديد' : 'Add New Q&A')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">{isRTL ? 'السؤال *' : 'Question *'}</label>
              <Input
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                placeholder={isRTL ? 'أدخل السؤال...' : 'Enter the question...'}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">{isRTL ? 'الإجابة *' : 'Answer *'}</label>
              <Textarea
                value={form.answer}
                onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                placeholder={isRTL ? 'أدخل الإجابة...' : 'Enter the answer...'}
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {isRTL ? 'الكلمات المفتاحية (مفصولة بفاصلة)' : 'Keywords (comma-separated)'}
              </label>
              <Input
                value={form.keywords}
                onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                placeholder={isRTL ? 'سعر, رسوم, تكلفة' : 'price, fees, cost'}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{isRTL ? 'الفئة' : 'Category'}</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{isRTL ? 'الأولوية (أعلى = أولوية أكبر)' : 'Priority (higher = more priority)'}</label>
              <Input
                type="number"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                min={0}
                max={100}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={resetForm}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? (isRTL ? 'حفظ التغييرات' : 'Save Changes') : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={isRTL ? 'بحث في الأسئلة...' : 'Search Q&As...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Q&A List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{isRTL ? 'لا توجد أسئلة' : 'No Q&As found'}</p>
          </div>
        )}
        {filtered.map(qa => (
          <div key={qa.id} className={`bg-card border rounded-lg p-4 ${!qa.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant={qa.isActive ? 'default' : 'secondary'} className="text-xs">
                    {qa.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{qa.category}</Badge>
                  {qa.priority > 0 && <Badge variant="outline" className="text-xs">P{qa.priority}</Badge>}
                </div>
                <p className="font-medium text-sm mb-1">{qa.question}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{qa.answer}</p>
                {qa.keywords && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {qa.keywords}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(qa)}
                  title={qa.isActive ? 'Deactivate' : 'Activate'}
                >
                  {qa.isActive ? <ToggleRight className="h-4 w-4 text-green-700 dark:text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(qa)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { if (confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) deleteMutation.mutate({ id: qa.id }); }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
