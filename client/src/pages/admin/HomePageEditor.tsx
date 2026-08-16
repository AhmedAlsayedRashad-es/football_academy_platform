import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { FileUpload } from '../../components/FileUpload';
import {Plus, Edit, Trash2, Save, X, Eye, EyeOff, ArrowUp, ArrowDown, 
  Image as ImageIcon, Video, Type, Grid, Star, TrendingUp, DollarSign, 
  Users, Calendar, Dumbbell, ArrowLeft} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


type SectionType = 'hero' | 'features' | 'gallery' | 'video' | 'testimonials' | 'stats' | 'pricing' | 'team' | 'events' | 'training';

interface ContentItem {
  id: number;
  sectionType: SectionType;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  // Nullable on the stored row, so mirror that here rather than over-promising.
  displayOrder: number | null;
  isActive: boolean | null;
  metadata: any;
}

const sectionIcons: Record<SectionType, React.ReactNode> = {
  hero: <Type className="h-5 w-5" />,
  features: <Grid className="h-5 w-5" />,
  gallery: <ImageIcon className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  testimonials: <Star className="h-5 w-5" />,
  stats: <TrendingUp className="h-5 w-5" />,
  pricing: <DollarSign className="h-5 w-5" />,
  team: <Users className="h-5 w-5" />,
  events: <Calendar className="h-5 w-5" />,
  training: <Dumbbell className="h-5 w-5" />,
};

export default function HomePageEditor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionType>('hero');

  const { data: content, isLoading, refetch } = trpc.homeContent.getAll.useQuery();
  
  const createMutation = trpc.homeContent.create.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Content created successfully' });
      setIsCreating(false);
      setEditingItem(null);
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = trpc.homeContent.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Content updated successfully' });
      setEditingItem(null);
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = trpc.homeContent.delete.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Content deleted successfully' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleActiveMutation = trpc.homeContent.toggleActive.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Visibility toggled successfully' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const reorderMutation = trpc.homeContent.reorder.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Order updated successfully' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreate = () => {
    setIsCreating(true);
    setEditingItem({
      id: 0,
      sectionType: selectedSection,
      title: '',
      subtitle: '',
      content: '',
      ctaText: '',
      ctaLink: '',
      imageUrl: '',
      videoUrl: '',
      displayOrder: 0,
      isActive: true,
      metadata: {},
    });
  };

  const handleSave = () => {
    if (!editingItem) return;

    // The mutations treat "not provided" as undefined; sending null fails input
    // validation.
    const data = {
      sectionType: editingItem.sectionType,
      title: editingItem.title || undefined,
      subtitle: editingItem.subtitle || undefined,
      content: editingItem.content || undefined,
      ctaText: editingItem.ctaText || undefined,
      ctaLink: editingItem.ctaLink || undefined,
      imageUrl: editingItem.imageUrl || undefined,
      videoUrl: editingItem.videoUrl || undefined,
      displayOrder: editingItem.displayOrder ?? undefined,
      isActive: editingItem.isActive ?? undefined,
      metadata: editingItem.metadata,
    };

    if (isCreating) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ id: editingItem.id, ...data });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this content?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleActive = (id: number) => {
    toggleActiveMutation.mutate({ id });
  };

  const handleReorder = (id: number, direction: 'up' | 'down') => {
    const item = content?.find(c => c.id === id);
    if (!item) return;

    const currentOrder = item.displayOrder ?? 0;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    reorderMutation.mutate({ id, displayOrder: newOrder });
  };

  const handleImageUpload = (url: string, fileKey: string) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, imageUrl: url });
    }
  };

  const groupedContent = content?.reduce((acc, item) => {
    if (!acc[item.sectionType]) {
      acc[item.sectionType] = [];
    }
    acc[item.sectionType].push(item);
    return acc;
  }, {} as Record<SectionType, ContentItem[]>);

  if (isLoading) {
    return (
      <>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
      </>
    );
  }

  return (
    <>
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        
              <BackButton />
<h1 className="text-3xl font-bold">Home Page Content Editor</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Content
        </Button>
      </div>

      {/* Edit/Create Modal */}
      {editingItem && (
        <Card className="mb-6 border-2 border-emerald-500">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{isCreating ? 'Create New Content' : 'Edit Content'}</span>
              <Button variant="ghost" size="sm" onClick={() => { setEditingItem(null); setIsCreating(false); }}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Section Type</label>
              <select
                className="w-full p-2 border rounded-lg dark:bg-gray-800"
                value={editingItem.sectionType}
                onChange={(e) => setEditingItem({ ...editingItem, sectionType: e.target.value as SectionType })}
                disabled={!isCreating}
              >
                <option value="hero">Hero</option>
                <option value="features">Features</option>
                <option value="gallery">Gallery</option>
                <option value="video">Video</option>
                <option value="testimonials">Testimonials</option>
                <option value="stats">Stats</option>
                <option value="pricing">Pricing</option>
                <option value="team">Team</option>
                <option value="events">Events</option>
                <option value="training">Training</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={editingItem.title || ''}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                placeholder="Enter title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subtitle</label>
              <Input
                value={editingItem.subtitle || ''}
                onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                placeholder="Enter subtitle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                value={editingItem.content || ''}
                onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                placeholder="Enter content"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">CTA Text</label>
                <Input
                  value={editingItem.ctaText || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, ctaText: e.target.value })}
                  placeholder="e.g., Learn More"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CTA Link</label>
                <Input
                  value={editingItem.ctaLink || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, ctaLink: e.target.value })}
                  placeholder="e.g., /about"
                />
              </div>
            </div>

            <div>
              <FileUpload
                label="Upload Image"
                accept="image/*"
                maxSizeMB={10}
                onUploadComplete={handleImageUpload}
              />
              {editingItem.imageUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current image:</p>
                  <img src={editingItem.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded mt-1" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Video URL (Optional)</label>
              <Input
                value={editingItem.videoUrl || ''}
                onChange={(e) => setEditingItem({ ...editingItem, videoUrl: e.target.value })}
                placeholder="Enter video URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Display Order</label>
              <Input
                type="number"
                value={editingItem.displayOrder ?? 0}
                onChange={(e) => setEditingItem({ ...editingItem, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editingItem.isActive ?? false}
                onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm font-medium">Active (visible on home page)</label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { setEditingItem(null); setIsCreating(false); }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content List by Section */}
      <div className="space-y-6">
        {Object.entries(sectionIcons).map(([section, icon]) => {
          const items = groupedContent?.[section as SectionType] || [];
          
          return (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {icon}
                  <span className="capitalize">{section}</span>
                  <Badge variant="secondary">{items.length} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-muted-foreground dark:text-gray-400 text-center py-4">
                    No content for this section yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items
                      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold">{item.title || 'Untitled'}</span>
                              {!item.isActive && <Badge variant="secondary">Hidden</Badge>}
                            </div>
                            {item.subtitle && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.subtitle}</p>
                            )}
                            {item.content && (
                              <p className="text-sm text-muted-foreground dark:text-gray-500 mt-1 line-clamp-2">
                                {item.content}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReorder(item.id, 'up')}
                              disabled={item.displayOrder === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReorder(item.id, 'down')}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(item.id)}
                            >
                              {item.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
    </>
  );
}
