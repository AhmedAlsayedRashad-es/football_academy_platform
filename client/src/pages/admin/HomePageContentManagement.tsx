import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {GripVertical, ArrowLeft} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { Loader2, Plus, Edit, Trash2, Image as ImageIcon, Video, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';
import FileUploadZone from '@/components/FileUploadZone';
import SortableContentItem from '@/components/SortableContentItem';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

// Storage upload will be handled via tRPC endpoint

type SectionType = 'hero' | 'features' | 'gallery' | 'video' | 'testimonials' | 'stats';

export default function HomePageContentManagement() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedSection, setSelectedSection] = useState<SectionType>('hero');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: allContent, refetch } = trpc.homePageContent.getAll.useQuery();
  const createMutation = trpc.homePageContent.create.useMutation({
    onSuccess: () => {
      toast.success('Content created successfully');
      refetch();
      setIsDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error) => {
      toast.error(`Failed to create content: ${error.message}`);
    }
  });

  const updateMutation = trpc.homePageContent.update.useMutation({
    onSuccess: () => {
      toast.success('Content updated successfully');
      refetch();
      setIsDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error) => {
      toast.error(`Failed to update content: ${error.message}`);
    }
  });

  const deleteMutation = trpc.homePageContent.delete.useMutation({
    onSuccess: () => {
      toast.success('Content deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete content: ${error.message}`);
    }
  });

  // Update items when section content changes
  // NOTE: Do NOT use derived `sectionContent` as a dep — it creates a new array ref every render → infinite loop
  React.useEffect(() => {
    let filtered = (allContent || []).filter(item => item.sectionType === selectedSection);
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => 
        filterStatus === 'active' ? item.isActive : !item.isActive
      );
    }
    
    setItems(filtered);
    setSelectedItems(new Set()); // Clear selection when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allContent, selectedSection, searchQuery, filterStatus]);

  const sectionContent = allContent?.filter(item => item.sectionType === selectedSection) || [];

  const reorderMutation = trpc.homePageContent.reorder.useMutation({
    onSuccess: () => {
      toast.success('Order updated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update order: ${error.message}`);
    }
  });

  const bulkDeleteMutation = trpc.homePageContent.delete.useMutation({
    onSuccess: () => {
      toast.success('Items deleted successfully');
      refetch();
      setSelectedItems(new Set());
    },
    onError: (error) => {
      toast.error(`Failed to delete items: ${error.message}`);
    }
  });

  const bulkUpdateMutation = trpc.homePageContent.update.useMutation({
    onSuccess: () => {
      toast.success('Items updated successfully');
      refetch();
      setSelectedItems(new Set());
    },
    onError: (error) => {
      toast.error(`Failed to update items: ${error.message}`);
    }
  });

  const uploadMutation = trpc.homePageContent.uploadFile.useMutation({
    onSuccess: (data) => {
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to upload file: ${error.message}`);
    }
  });

  const handleFileUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const fileData = await base64Promise;
      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        fileData,
        contentType: file.type
      });
      
      return result.url;
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      sectionType: selectedSection,
      title: formData.get('title') as string || undefined,
      subtitle: formData.get('subtitle') as string || undefined,
      content: formData.get('content') as string || undefined,
      ctaText: formData.get('ctaText') as string || undefined,
      ctaLink: formData.get('ctaLink') as string || undefined,
      imageUrl: formData.get('imageUrl') as string || undefined,
      videoUrl: formData.get('videoUrl') as string || undefined,
      displayOrder: parseInt(formData.get('displayOrder') as string) || 0,
      isActive: formData.get('isActive') === 'on',
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this content?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update display order in database
      const updates = newItems.map((item, index) => ({
        id: item.id,
        displayOrder: index
      }));

      reorderMutation.mutate({ items: updates });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Delete ${selectedItems.size} item(s)?`)) return;
    
    for (const id of selectedItems) {
      await bulkDeleteMutation.mutateAsync({ id });
    }
  };

  const handleBulkActivate = async (isActive: boolean) => {
    if (selectedItems.size === 0) return;
    
    for (const id of selectedItems) {
      const item = items.find(i => i.id === id);
      if (item) {
        await bulkUpdateMutation.mutateAsync({ id, isActive });
      }
    }
  };

  const handleDuplicate = (item: any) => {
    const { id, createdAt, updatedAt, ...itemData } = item;
    createMutation.mutate({
      ...itemData,
      title: `${item.title} (Copy)`,
      displayOrder: items.length
    });
  };

  const toggleItemSelection = (id: number) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
              <BackButton />
<h1 className="text-3xl font-bold">Home Page Content Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage hero section, features, gallery, videos, and testimonials
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open) {
              setEditingItem(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit' : 'Add'} Content</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update' : 'Create'} content for the {selectedSection} section
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingItem?.title || ''}
                    placeholder="Enter title"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    name="subtitle"
                    defaultValue={editingItem?.subtitle || ''}
                    placeholder="Enter subtitle"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    defaultValue={editingItem?.content || ''}
                    placeholder="Enter main content"
                    rows={4}
                  />
                </div>

                {(selectedSection === 'hero' || selectedSection === 'features') && (
                  <>
                    <div>
                      <Label htmlFor="ctaText">CTA Button Text</Label>
                      <Input
                        id="ctaText"
                        name="ctaText"
                        defaultValue={editingItem?.ctaText || ''}
                        placeholder="e.g., Get Started"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ctaLink">CTA Link</Label>
                      <Input
                        id="ctaLink"
                        name="ctaLink"
                        defaultValue={editingItem?.ctaLink || ''}
                        placeholder="e.g., /register"
                      />
                    </div>
                  </>
                )}

                {(selectedSection === 'hero' || selectedSection === 'gallery' || selectedSection === 'features') && (
                  <div>
                    <Label htmlFor="imageUrl">Image</Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      type="hidden"
                      defaultValue={editingItem?.imageUrl || ''}
                    />
                    <FileUploadZone
                      accept="image/*"
                      maxSize={10}
                      type="image"
                      currentUrl={editingItem?.imageUrl}
                      onUpload={handleFileUpload}
                      onUrlChange={(url) => {
                        const input = document.getElementById('imageUrl') as HTMLInputElement;
                        if (input) input.value = url;
                      }}
                    />
                  </div>
                )}

                {(selectedSection === 'video' || selectedSection === 'gallery') && (
                  <div>
                    <Label htmlFor="videoUrl">Video</Label>
                    <Input
                      id="videoUrl"
                      name="videoUrl"
                      type="hidden"
                      defaultValue={editingItem?.videoUrl || ''}
                    />
                    <FileUploadZone
                      accept="video/*"
                      maxSize={50}
                      type="video"
                      currentUrl={editingItem?.videoUrl}
                      onUpload={handleFileUpload}
                      onUrlChange={(url) => {
                        const input = document.getElementById('videoUrl') as HTMLInputElement;
                        if (input) input.value = url;
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      name="displayOrder"
                      type="number"
                      defaultValue={editingItem?.displayOrder || 0}
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      name="isActive"
                      defaultChecked={editingItem?.isActive !== false}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingItem ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search by title or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
              <div className="flex gap-2 items-center mt-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedItems.size} item(s) selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkActivate(true)}
                    disabled={bulkUpdateMutation.isPending}
                  >
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkActivate(false)}
                    disabled={bulkUpdateMutation.isPending}
                  >
                    Deactivate
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                  >
                    {bulkDeleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedSection} onValueChange={(value) => setSelectedSection(value as SectionType)} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          {(['hero', 'features', 'gallery', 'video', 'testimonials', 'stats'] as SectionType[]).map((section) => (
            <TabsContent key={section} value={section} className="space-y-4">
              {items.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No content for this section yet. Click "Add Content" to create.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-4">
                      {items.map((item) => (
                        <SortableContentItem
                          key={item.id}
                          item={item}
                          onEdit={(item) => {
                            setEditingItem(item);
                            setIsDialogOpen(true);
                          }}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                          isDeleting={deleteMutation.isPending}
                          isSelected={selectedItems.has(item.id)}
                          onToggleSelect={toggleItemSelection}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
