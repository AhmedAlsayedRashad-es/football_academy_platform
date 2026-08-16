import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Upload, Video, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORIES = [
  { id: 'ball_control', label: 'Ball Control', labelAr: 'التحكم بالكرة' },
  { id: 'passing', label: 'Passing & First Touch', labelAr: 'التمرير واللمسة الأولى' },
  { id: 'shooting', label: 'Shooting & Finishing', labelAr: 'التسديد والإنهاء' },
  { id: 'dribbling', label: 'Dribbling & 1v1', labelAr: 'المراوغة و1ضد1' },
  { id: 'speed_agility', label: 'Speed & Agility', labelAr: 'السرعة والرشاقة' },
  { id: 'positioning', label: 'Positioning & Tactical', labelAr: 'التمركز والتكتيك' },
  { id: 'goalkeeper', label: 'Goalkeeper', labelAr: 'حارس المرمى' },
  { id: 'fitness', label: 'Fitness & Conditioning', labelAr: 'اللياقة والتكييف' },
];

const AGE_GROUPS = [
  { id: 'all', label: 'All Ages', labelAr: 'جميع الأعمار' },
  { id: 'U8', label: 'Under 8', labelAr: 'تحت 8' },
  { id: 'U10', label: 'Under 10', labelAr: 'تحت 10' },
  { id: 'U12', label: 'Under 12', labelAr: 'تحت 12' },
  { id: 'U14', label: 'Under 14', labelAr: 'تحت 14' },
  { id: 'U16', label: 'Under 16', labelAr: 'تحت 16' },
  { id: 'U18', label: 'Under 18', labelAr: 'تحت 18' },
];

interface VideoUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function VideoUploadModal({ open, onClose, onSuccess }: VideoUploadModalProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    category: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    ageGroup: 'all',
    isPublished: true,
    videoUrl: '',
  });
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createVideoMutation = trpc.trainingVideos.create.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم رفع الفيديو بنجاح!' : 'Video uploaded successfully!');
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || (isRTL ? 'فشل رفع الفيديو' : 'Failed to upload video'));
    },
  });

  const handleClose = () => {
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      category: '',
      difficulty: 'beginner',
      ageGroup: 'all',
      isPublished: true,
      videoUrl: '',
    });
    setVideoFile(null);
    setUploadProgress(0);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        toast.error(isRTL ? 'حجم الملف كبير جداً (الحد الأقصى 500 ميجابايت)' : 'File too large (max 500MB)');
        return;
      }
      // Check file type
      if (!file.type.startsWith('video/')) {
        toast.error(isRTL ? 'يرجى اختيار ملف فيديو' : 'Please select a video file');
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    if (!videoFile && !formData.videoUrl) {
      toast.error(isRTL ? 'يرجى رفع فيديو أو إدخال رابط' : 'Please upload a video or enter a URL');
      return;
    }

    setUploading(true);

    try {
      let videoUrl = formData.videoUrl;

      // If a file was selected, upload it to S3
      if (videoFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', videoFile);
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 500);

        // Upload to storage endpoint
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        videoUrl = result.url;
      }

      // Create the training video record
      await createVideoMutation.mutateAsync({
        title: formData.title,
        titleAr: formData.titleAr || undefined,
        description: formData.description || undefined,
        descriptionAr: formData.descriptionAr || undefined,
        videoUrl: videoUrl,
        category: formData.category,
        difficulty: formData.difficulty,
        ageGroup: formData.ageGroup,
        isPublished: formData.isPublished,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(isRTL ? 'فشل رفع الفيديو' : 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const content = {
    en: {
      title: 'Upload Training Video',
      videoTitle: 'Video Title',
      videoTitleAr: 'Video Title (Arabic)',
      description: 'Description',
      descriptionAr: 'Description (Arabic)',
      category: 'Category',
      selectCategory: 'Select category',
      difficulty: 'Difficulty',
      ageGroup: 'Age Group',
      publishNow: 'Publish immediately',
      uploadVideo: 'Upload Video',
      orEnterUrl: 'Or enter video URL',
      videoUrl: 'Video URL (YouTube, Vimeo, etc.)',
      dragDrop: 'Drag & drop or click to upload',
      maxSize: 'Max file size: 500MB',
      cancel: 'Cancel',
      upload: 'Upload Video',
      uploading: 'Uploading...',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
    ar: {
      title: 'رفع فيديو تدريبي',
      videoTitle: 'عنوان الفيديو',
      videoTitleAr: 'عنوان الفيديو (بالعربية)',
      description: 'الوصف',
      descriptionAr: 'الوصف (بالعربية)',
      category: 'الفئة',
      selectCategory: 'اختر الفئة',
      difficulty: 'المستوى',
      ageGroup: 'الفئة العمرية',
      publishNow: 'نشر فوراً',
      uploadVideo: 'رفع فيديو',
      orEnterUrl: 'أو أدخل رابط الفيديو',
      videoUrl: 'رابط الفيديو (يوتيوب، فيميو، إلخ)',
      dragDrop: 'اسحب وأفلت أو انقر للرفع',
      maxSize: 'الحد الأقصى: 500 ميجابايت',
      cancel: 'إلغاء',
      upload: 'رفع الفيديو',
      uploading: 'جاري الرفع...',
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم',
    },
  };

  const c = content[language] || content.en;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            {c.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Video Upload Area */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!videoFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{c.dragDrop}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.maxSize}</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{videoFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVideoFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{c.orEnterUrl}</span>
              </div>
            </div>

            <Input
              placeholder={c.videoUrl}
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              disabled={!!videoFile}
            />
          </div>

          {/* Video Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{c.videoTitle} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Ball Control Basics"
              />
            </div>
            <div className="space-y-2">
              <Label>{c.videoTitleAr}</Label>
              <Input
                value={formData.titleAr}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                placeholder="مثال: أساسيات التحكم بالكرة"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{c.description}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{c.descriptionAr}</Label>
              <Textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                rows={3}
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{c.category} *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={c.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {isRTL ? cat.labelAr : cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{c.difficulty}</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{c.beginner}</SelectItem>
                  <SelectItem value="intermediate">{c.intermediate}</SelectItem>
                  <SelectItem value="advanced">{c.advanced}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{c.ageGroup}</Label>
              <Select
                value={formData.ageGroup}
                onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_GROUPS.map((age) => (
                    <SelectItem key={age.id} value={age.id}>
                      {isRTL ? age.labelAr : age.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
            <Label>{c.publishNow}</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {c.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {c.uploading}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {c.upload}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
