import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Award, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORIES = ['completion', 'excellence', 'mastery', 'milestone', 'education', 'performance'] as const;

interface BadgeForm {
  name: string;
  description: string;
  icon: string;
  category: typeof CATEGORIES[number];
  displayOrder: number;
  criteria: string;
  isActive: boolean;
}

const defaultForm: BadgeForm = {
  name: '',
  description: '',
  icon: '🏅',
  category: 'performance',
  displayOrder: 0,
  criteria: '',
  isActive: true,
};

export default function BadgeManagement() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BadgeForm>(defaultForm);

  const { data: badges = [], refetch } = trpc.badgeAdmin.getAll.useQuery();
  const createMutation = trpc.badgeAdmin.create.useMutation({
    onSuccess: () => { toast.success(isArabic ? 'تم إنشاء الشارة' : 'Badge created'); refetch(); setIsCreateOpen(false); setForm(defaultForm); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.badgeAdmin.update.useMutation({
    onSuccess: () => { toast.success(isArabic ? 'تم تحديث الشارة' : 'Badge updated'); refetch(); setEditingId(null); setForm(defaultForm); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.badgeAdmin.delete.useMutation({
    onSuccess: () => { toast.success(isArabic ? 'تم حذف الشارة' : 'Badge deleted'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.name || !form.description) {
      toast.error(isArabic ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (badge: any) => {
    setForm({
      name: badge.name,
      description: badge.description,
      icon: badge.icon || '🏅',
      category: badge.category,
      displayOrder: badge.displayOrder || 0,
      criteria: badge.criteria || '',
      isActive: badge.isActive !== false,
    });
    setEditingId(badge.id);
    setIsCreateOpen(true);
  };

  const categoryColors: Record<string, string> = {
    attendance: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    performance: 'bg-green-500/20 text-green-700 dark:text-green-400',
    achievement: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    special: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    milestone: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
  };

  return (
    <>
    <div className={`p-6 space-y-6 ${isArabic ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-7 h-7 text-yellow-700 dark:text-yellow-400" />
            {isArabic ? 'إدارة الشارات' : 'Badge Management'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isArabic ? 'إنشاء وإدارة شارات الإنجاز للاعبين' : 'Create and manage achievement badges for players'}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              <Plus className="w-4 h-4 mr-2" />
              {isArabic ? 'شارة جديدة' : 'New Badge'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? (isArabic ? 'تعديل الشارة' : 'Edit Badge') : (isArabic ? 'إنشاء شارة جديدة' : 'Create New Badge')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? 'الاسم' : 'Name'} *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="bg-card border-border mt-1" placeholder={isArabic ? 'اسم الشارة' : 'Badge name'} />
                </div>
                <div>
                  <Label>{isArabic ? 'الأيقونة' : 'Icon (emoji)'}</Label>
                  <Input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="bg-card border-border mt-1" placeholder="🏅" />
                </div>
              </div>
              <div>
                <Label>{isArabic ? 'الوصف' : 'Description'} *</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-card border-border mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? 'الفئة' : 'Category'}</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as any }))}>
                    <SelectTrigger className="bg-card border-border mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isArabic ? 'النقاط' : 'Points Value'}</Label>
                  <Input type="number" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: Number(e.target.value) }))} className="bg-card border-border mt-1" min={0} />
                </div>
              </div>
              <div>
                <Label>{isArabic ? 'معايير المنح' : 'Award Criteria'}</Label>
                <Textarea value={form.criteria} onChange={e => setForm(p => ({ ...p, criteria: e.target.value }))} className="bg-card border-border mt-1" rows={2} placeholder={isArabic ? 'متى تُمنح هذه الشارة؟' : 'When is this badge awarded?'} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
                <Label>{isArabic ? 'نشط' : 'Active'}</Label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSubmit} className="flex-1 bg-yellow-600 hover:bg-yellow-700" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? (isArabic ? 'تحديث' : 'Update') : (isArabic ? 'إنشاء' : 'Create')}
                </Button>
                <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingId(null); setForm(defaultForm); }} className="border-border">
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIES.map(cat => {
          const count = badges.filter((b: any) => b.category === cat).length;
          return (
            <div key={cat} className="bg-card/50 rounded-xl p-4 border border-border/50">
              <p className="text-muted-foreground text-sm capitalize">{cat}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge: any) => (
          <div key={badge.id} className="bg-card/50 rounded-xl p-5 border border-border/50 hover:border-yellow-500/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{badge.icon || '🏅'}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{badge.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[badge.category] || 'bg-muted text-muted-foreground'}`}>
                    {badge.category}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(badge)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ id: badge.id })} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{badge.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                <Star className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">{badge.displayOrder || 0} pts</span>
              </div>
              <Badge variant={badge.isActive ? 'default' : 'secondary'} className={badge.isActive ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}>
                {badge.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'معطل' : 'Inactive')}
              </Badge>
            </div>
            {badge.criteria && (
              <p className="text-muted-foreground text-xs mt-2 italic">{badge.criteria}</p>
            )}
          </div>
        ))}
        {badges.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{isArabic ? 'لا توجد شارات بعد' : 'No badges yet'}</p>
            <p className="text-sm mt-1">{isArabic ? 'أنشئ أول شارة لتحفيز اللاعبين' : 'Create your first badge to motivate players'}</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
