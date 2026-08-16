import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import {Loader2, Plus, Edit, Trash2, Image as ImageIcon, Video, Save, Eye, Upload, X, ArrowLeft} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


export default function HomeContentEditor() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'hero' | 'stats' | 'features' | 'gallery' | 'testimonials'>('hero');
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fetch all content
  const { data: heroContent, refetch: refetchHero } = trpc.homePageContent.getBySection.useQuery({ sectionType: 'hero' });
  const { data: statsContent, refetch: refetchStats } = trpc.homePageContent.getBySection.useQuery({ sectionType: 'stats' });
  const { data: featuresContent, refetch: refetchFeatures } = trpc.homePageContent.getBySection.useQuery({ sectionType: 'features' });
  const { data: galleryContent, refetch: refetchGallery } = trpc.homePageContent.getBySection.useQuery({ sectionType: 'gallery' });
  const { data: testimonialsContent, refetch: refetchTestimonials } = trpc.homePageContent.getBySection.useQuery({ sectionType: 'testimonials' });

  // Mutations
  const createMutation = trpc.homePageContent.create.useMutation({
    onSuccess: () => {
      toast.success('Content created successfully');
      refetchAll();
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    }
  });

  const updateMutation = trpc.homePageContent.update.useMutation({
    onSuccess: () => {
      toast.success('Content updated successfully');
      refetchAll();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  const deleteMutation = trpc.homePageContent.delete.useMutation({
    onSuccess: () => {
      toast.success('Content deleted successfully');
      refetchAll();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    }
  });

  const uploadMutation = trpc.homePageContent.uploadFile.useMutation({
    onSuccess: () => {
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    }
  });

  const refetchAll = () => {
    refetchHero();
    refetchStats();
    refetchFeatures();
    refetchGallery();
    refetchTestimonials();
  };

  const handleFileUpload = async (file: File, contentId?: number) => {
    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await uploadMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          contentType: file.type
        });
        
        if (contentId && result.url) {
          // Update content with new file URL
          const isVideo = file.type.startsWith('video/');
          await updateMutation.mutateAsync({
            id: contentId,
            ...(isVideo ? { videoUrl: result.url } : { imageUrl: result.url })
          });
        }
        
        toast.success('File uploaded successfully');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
              <BackButton />
<h1 className="text-3xl font-bold">Home Page Content Editor</h1>
            <p className="text-muted-foreground mt-2">
              Edit all sections of your landing page including hero, stats, features, gallery, and testimonials
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            <Button onClick={() => window.open('/', '_blank')}>
              View Live Site
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero" className="space-y-4">
            <HeroEditor 
              content={heroContent?.[0]} 
              onUpdate={updateMutation.mutate}
              onCreate={createMutation.mutate}
              onFileUpload={handleFileUpload}
              uploading={uploadingFile}
            />
          </TabsContent>

          {/* Stats Section */}
          <TabsContent value="stats" className="space-y-4">
            <StatsEditor 
              content={statsContent || []} 
              onUpdate={updateMutation.mutate}
              onCreate={createMutation.mutate}
              onDelete={deleteMutation.mutate}
            />
          </TabsContent>

          {/* Features Section */}
          <TabsContent value="features" className="space-y-4">
            <FeaturesEditor 
              content={featuresContent || []} 
              onUpdate={updateMutation.mutate}
              onCreate={createMutation.mutate}
              onDelete={deleteMutation.mutate}
              onFileUpload={handleFileUpload}
            />
          </TabsContent>

          {/* Gallery Section */}
          <TabsContent value="gallery" className="space-y-4">
            <GalleryEditor 
              content={galleryContent || []} 
              onUpdate={updateMutation.mutate}
              onCreate={createMutation.mutate}
              onDelete={deleteMutation.mutate}
              onFileUpload={handleFileUpload}
              uploading={uploadingFile}
            />
          </TabsContent>

          {/* Testimonials Section */}
          <TabsContent value="testimonials" className="space-y-4">
            <TestimonialsEditor 
              content={testimonialsContent || []} 
              onUpdate={updateMutation.mutate}
              onCreate={createMutation.mutate}
              onDelete={deleteMutation.mutate}
              onFileUpload={handleFileUpload}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// Hero Section Editor Component
function HeroEditor({ content, onUpdate, onCreate, onFileUpload, uploading }: any) {
  const [formData, setFormData] = useState({
    title: content?.title || '',
    subtitle: content?.subtitle || '',
    content: content?.content || '',
    ctaText: content?.ctaText || 'Register Now',
    ctaLink: content?.ctaLink || '/register',
    videoUrl: content?.videoUrl || '',
    isActive: content?.isActive ?? true
  });

  const handleSave = () => {
    const data = {
      sectionType: 'hero' as const,
      ...formData
    };

    if (content?.id) {
      onUpdate({ id: content.id, ...data });
    } else {
      onCreate(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section</CardTitle>
        <CardDescription>Main banner with title, description, and background video</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hero-title">Main Title</Label>
            <Input
              id="hero-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Develop Future Football Stars"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-subtitle">Subtitle/Badge</Label>
            <Input
              id="hero-subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Egypt's Premier Youth Football Academy"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hero-content">Description</Label>
          <Textarea
            id="hero-content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="A technology-driven academy combining elite coaching..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hero-cta-text">CTA Button Text</Label>
            <Input
              id="hero-cta-text"
              value={formData.ctaText}
              onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
              placeholder="Register Now"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-cta-link">CTA Button Link</Label>
            <Input
              id="hero-cta-link"
              value={formData.ctaLink}
              onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
              placeholder="/register"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hero-video">Background Video</Label>
          <div className="flex gap-2">
            <Input
              id="hero-video"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="Video URL or upload new file"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('hero-video-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </Button>
            <input
              id="hero-video-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file, content?.id);
              }}
            />
          </div>
          {formData.videoUrl && (
            <video src={formData.videoUrl} className="w-full h-40 object-cover rounded mt-2" controls />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>Active</Label>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Hero Section
        </Button>
      </CardContent>
    </Card>
  );
}

// Stats Editor Component
function StatsEditor({ content, onUpdate, onCreate, onDelete }: any) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newStat, setNewStat] = useState({ title: '', subtitle: '', displayOrder: content.length });

  const defaultStats = [
    { title: '500+', subtitle: 'Active Players' },
    { title: '50+', subtitle: 'Professional Coaches' },
    { title: '95%', subtitle: 'Parent Satisfaction' },
    { title: '25+', subtitle: 'Pro Graduates' }
  ];

  const handleAddStat = () => {
    onCreate({
      sectionType: 'stats',
      title: newStat.title,
      subtitle: newStat.subtitle,
      displayOrder: newStat.displayOrder,
      isActive: true
    });
    setNewStat({ title: '', subtitle: '', displayOrder: content.length + 1 });
    setIsAddingNew(false);
  };

  const handleInitializeDefaults = () => {
    defaultStats.forEach((stat, index) => {
      onCreate({
        sectionType: 'stats',
        title: stat.title,
        subtitle: stat.subtitle,
        displayOrder: index,
        isActive: true
      });
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Statistics Section</CardTitle>
              <CardDescription>Display key academy statistics (500+, 50+, 95%, 25+)</CardDescription>
            </div>
            {content.length === 0 && (
              <Button onClick={handleInitializeDefaults} variant="outline">
                Initialize Default Stats
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {content.map((stat: any) => (
              <StatCard key={stat.id} stat={stat} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
            
            {isAddingNew ? (
              <Card className="border-dashed">
                <CardContent className="p-4 space-y-2">
                  <Input
                    placeholder="Value (e.g., 500+)"
                    value={newStat.title}
                    onChange={(e) => setNewStat({ ...newStat, title: e.target.value })}
                  />
                  <Input
                    placeholder="Label (e.g., Active Players)"
                    value={newStat.subtitle}
                    onChange={(e) => setNewStat({ ...newStat, subtitle: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddStat} className="flex-1">Add</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsAddingNew(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="h-full min-h-[120px] border-dashed"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ stat, onUpdate, onDelete }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: stat.title,
    subtitle: stat.subtitle
  });

  const handleSave = () => {
    onUpdate({ id: stat.id, ...formData });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Value"
            />
            <Input
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Label"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="flex-1">Save</Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">{stat.title}</div>
            <div className="text-sm text-muted-foreground">{stat.subtitle}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="flex-1">
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('Delete this stat?')) onDelete({ id: stat.id });
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Features Editor Component
function FeaturesEditor({ content, onUpdate, onCreate, onDelete, onFileUpload }: any) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Features Section</CardTitle>
              <CardDescription>Showcase academy features and services</CardDescription>
            </div>
            <Button onClick={() => setIsAddingNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {content.map((feature: any) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onUpdate={onUpdate}
                onDelete={onDelete}
                isEditing={editingId === feature.id}
                setEditing={(editing) => setEditingId(editing ? feature.id : null)}
              />
            ))}
          </div>

          {isAddingNew && (
            <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Feature</DialogTitle>
                </DialogHeader>
                <FeatureForm
                  onSubmit={(data) => {
                    onCreate({ sectionType: 'features', ...data });
                    setIsAddingNew(false);
                  }}
                  onCancel={() => setIsAddingNew(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface FeatureFormValues {
  title: string;
  content: string;
  imageUrl: string;
  isActive: boolean;
}

interface TestimonialFormValues extends FeatureFormValues {
  subtitle: string;
}

function FeatureCard({
  feature,
  onUpdate,
  onDelete,
  isEditing,
  setEditing,
}: {
  feature: any;
  onUpdate: (data: any) => void;
  onDelete: (input: { id: number }) => void;
  isEditing: boolean;
  setEditing: (editing: boolean) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        {isEditing ? (
          <FeatureForm
            initialData={feature}
            onSubmit={(data) => {
              onUpdate({ id: feature.id, ...data });
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.content}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('Delete this feature?')) onDelete({ id: feature.id });
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FeatureForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<FeatureFormValues>;
  onSubmit: (data: FeatureFormValues) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    imageUrl: initialData?.imageUrl || '',
    isActive: initialData?.isActive ?? true
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Performance Analytics"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Track technical, physical, and tactical metrics..."
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onSubmit(formData)} className="flex-1">Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// Gallery Editor Component
function GalleryEditor({ content, onUpdate, onCreate, onDelete, onFileUpload, uploading }: any) {
  const [isAddingNew, setIsAddingNew] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gallery Section</CardTitle>
            <CardDescription>Manage photos and videos in the gallery</CardDescription>
          </div>
          <Button onClick={() => setIsAddingNew(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {content.map((item: any) => (
            <GalleryItem key={item.id} item={item} onDelete={onDelete} />
          ))}
        </div>

        {isAddingNew && (
          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Gallery Media</DialogTitle>
              </DialogHeader>
              <GalleryUploadForm
                onCreate={onCreate}
                onFileUpload={onFileUpload}
                uploading={uploading}
                onClose={() => setIsAddingNew(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

function GalleryItem({ item, onDelete }: any) {
  const isVideo = item.videoUrl;
  const mediaUrl = isVideo ? item.videoUrl : item.imageUrl;

  return (
    <Card>
      <CardContent className="p-2">
        {isVideo ? (
          <video src={mediaUrl} className="w-full h-32 object-cover rounded" />
        ) : (
          <img src={mediaUrl} alt={item.title} className="w-full h-32 object-cover rounded" />
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs truncate">{item.title}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm('Delete this media?')) onDelete({ id: item.id });
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GalleryUploadForm({ onCreate, onFileUpload, uploading, onClose }: any) {
  const [formData, setFormData] = useState({
    title: '',
    mediaType: 'image' as 'image' | 'video',
    file: null as File | null
  });

  const handleSubmit = async () => {
    if (!formData.file) {
      toast.error('Please select a file');
      return;
    }

    // Upload file first
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      // This would need to be implemented in the backend
      const url = await onFileUpload(formData.file);
      
      onCreate({
        sectionType: 'gallery',
        title: formData.title,
        ...(formData.mediaType === 'video' ? { videoUrl: url } : { imageUrl: url }),
        isActive: true
      });
      
      onClose();
    };
    reader.readAsDataURL(formData.file);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Training session"
        />
      </div>

      <div className="space-y-2">
        <Label>Media Type</Label>
        <div className="flex gap-2">
          <Button
            variant={formData.mediaType === 'image' ? 'default' : 'outline'}
            onClick={() => setFormData({ ...formData, mediaType: 'image' })}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Image
          </Button>
          <Button
            variant={formData.mediaType === 'video' ? 'default' : 'outline'}
            onClick={() => setFormData({ ...formData, mediaType: 'video' })}
          >
            <Video className="h-4 w-4 mr-2" />
            Video
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Upload File</Label>
        <Input
          type="file"
          accept={formData.mediaType === 'video' ? 'video/*' : 'image/*'}
          onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={uploading} className="flex-1">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Upload
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

// Testimonials Editor Component
function TestimonialsEditor({ content, onUpdate, onCreate, onDelete, onFileUpload }: any) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Testimonials Section</CardTitle>
            <CardDescription>Parent and player reviews</CardDescription>
          </div>
          <Button onClick={() => setIsAddingNew(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {content.map((testimonial: any) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isEditing={editingId === testimonial.id}
              setEditing={(editing) => setEditingId(editing ? testimonial.id : null)}
            />
          ))}
        </div>

        {isAddingNew && (
          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Testimonial</DialogTitle>
              </DialogHeader>
              <TestimonialForm
                onSubmit={(data) => {
                  onCreate({ sectionType: 'testimonials', ...data });
                  setIsAddingNew(false);
                }}
                onCancel={() => setIsAddingNew(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

function TestimonialCard({
  testimonial,
  onUpdate,
  onDelete,
  isEditing,
  setEditing,
}: {
  testimonial: any;
  onUpdate: (data: any) => void;
  onDelete: (input: { id: number }) => void;
  isEditing: boolean;
  setEditing: (editing: boolean) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        {isEditing ? (
          <TestimonialForm
            initialData={testimonial}
            onSubmit={(data) => {
              onUpdate({ id: testimonial.id, ...data });
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {testimonial.imageUrl && (
                  <img src={testimonial.imageUrl} alt={testimonial.title} className="w-10 h-10 rounded-full" />
                )}
                <div>
                  <div className="font-semibold">{testimonial.title}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.subtitle}</div>
                </div>
              </div>
              <p className="text-sm">{testimonial.content}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('Delete this testimonial?')) onDelete({ id: testimonial.id });
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TestimonialForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<TestimonialFormValues>;
  onSubmit: (data: TestimonialFormValues) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    content: initialData?.content || '',
    imageUrl: initialData?.imageUrl || '',
    isActive: initialData?.isActive ?? true
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ahmed Hassan"
          />
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <Input
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="Parent of U12 Player"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Review</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="The academy has transformed my son's development..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Avatar URL (optional)</Label>
        <Input
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onSubmit(formData)} className="flex-1">Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
