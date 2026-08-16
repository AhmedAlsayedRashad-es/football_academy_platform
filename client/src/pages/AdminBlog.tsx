import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Eye, FileText, ArrowLeft} from 'lucide-react';
import { FileUpload } from "@/components/FileUpload";
import { useLocation } from 'wouter';
import { BackButton } from '@/components/BackButton';


interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  authorId: number;
  published: boolean;
  publishedAt: Date | null;
  featuredImage: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function AdminBlog() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredImageKey, setFeaturedImageKey] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const { data: posts, refetch } = trpc.blog.getAll.useQuery({ limit: 100 });
  
  const createPost = trpc.blog.create.useMutation({
    onSuccess: () => {
      toast({
        title: language === 'ar' ? "تم الإنشاء" : "Created",
        description: language === 'ar' ? "تم إنشاء المقال بنجاح" : "Blog post created successfully",
      });
      refetch();
      closeEditor();
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePost = trpc.blog.update.useMutation({
    onSuccess: () => {
      toast({
        title: language === 'ar' ? "تم التحديث" : "Updated",
        description: language === 'ar' ? "تم تحديث المقال بنجاح" : "Blog post updated successfully",
      });
      refetch();
      closeEditor();
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePost = trpc.blog.delete.useMutation({
    onSuccess: () => {
      toast({
        title: language === 'ar' ? "تم الحذف" : "Deleted",
        description: language === 'ar' ? "تم حذف المقال بنجاح" : "Blog post deleted successfully",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePublish = trpc.blog.togglePublish.useMutation({
    onSuccess: () => {
      toast({
        title: language === 'ar' ? "تم التحديث" : "Updated",
        description: language === 'ar' ? "تم تحديث حالة النشر" : "Publish status updated",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEditor = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setTitle(post.title);
      setExcerpt(post.excerpt);
      setContent(post.content);
      setFeaturedImage(post.featuredImage || "");
      setIsPublished(!!post.publishedAt);
    } else {
      setEditingPost(null);
      setTitle("");
      setExcerpt("");
      setContent("");
      setFeaturedImage("");
      setIsPublished(false);
    }
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingPost(null);
    setTitle("");
    setExcerpt("");
    setContent("");
    setFeaturedImage("");
    setIsPublished(false);
  };

  const handleSave = () => {
    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    if (editingPost) {
      // The API takes coverImage/status; slug is immutable after creation.
      updatePost.mutate({
        id: editingPost.id,
        title,
        excerpt,
        content,
        coverImage: featuredImage || undefined,
        status: isPublished ? "published" : "draft",
      });
    } else {
      createPost.mutate({
        title,
        slug,
        excerpt,
        content,
        category: "general",
        coverImage: featuredImage || undefined,
        status: isPublished ? "published" : "draft",
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المقال؟' : 'Are you sure you want to delete this post?')) {
      deletePost.mutate({ id });
    }
  };

  const handleTogglePublish = (id: number, currentStatus: boolean) => {
    togglePublish.mutate({ id, published: !currentStatus });
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ];

  return (
    <>
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          
          <BackButton />
<CardTitle className="text-2xl font-bold">
            {language === 'ar' ? 'إدارة المدونة' : 'Blog Management'}
          </CardTitle>
          <Button onClick={() => openEditor()} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'مقال جديد' : 'New Post'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts?.map((post: any) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {post.featuredImage && (
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="w-full h-40 object-cover rounded-md mb-3"
                    />
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
                    {!!post.publishedAt ? (
                      <Badge className="bg-green-100 text-green-800">{language === 'ar' ? 'منشور' : 'Published'}</Badge>
                    ) : (
                      <Badge variant="outline">{language === 'ar' ? 'مسودة' : 'Draft'}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="text-xs text-muted-foreground mb-3">
                    {new Date(post.createdAt!).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditor(post)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublish(post.id, !!post.publishedAt)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {!!post.publishedAt ? (language === 'ar' ? 'إخفاء' : 'Unpublish') : (language === 'ar' ? 'نشر' : 'Publish')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {posts?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{language === 'ar' ? 'لا توجد مقالات بعد' : 'No blog posts yet'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? (language === 'ar' ? 'تعديل المقال' : 'Edit Post') : (language === 'ar' ? 'مقال جديد' : 'New Post')}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'أنشئ أو عدّل مقال المدونة' : 'Create or edit a blog post'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'ar' ? 'العنوان' : 'Title'}
              </label>
              <Input
                placeholder={language === 'ar' ? 'عنوان المقال' : 'Post title'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'ar' ? 'الملخص' : 'Excerpt'}
              </label>
              <Input
                placeholder={language === 'ar' ? 'ملخص قصير للمقال' : 'Short summary of the post'}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>

            <div>
              <FileUpload
                label={language === 'ar' ? 'الصورة المميزة' : 'Featured Image'}
                accept="image/*"
                maxSizeMB={5}
                onUploadComplete={(url, fileKey) => {
                  setFeaturedImage(url);
                  setFeaturedImageKey(fileKey);
                }}
              />
              {featuredImage && (
                <div className="mt-2">
                  <img 
                    src={featuredImage} 
                    alt="Featured preview" 
                    className="w-full h-48 object-cover rounded-md"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'ar' ? 'المحتوى' : 'Content'}
              </label>
              <div className="border rounded-md">
                <ReactQuill 
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  formats={formats}
                  placeholder={language === 'ar' ? 'اكتب محتوى المقال هنا...' : 'Write your post content here...'}
                  style={{ minHeight: '300px' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="published" className="text-sm font-medium">
                {language === 'ar' ? 'نشر المقال فوراً' : 'Publish immediately'}
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditor}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={createPost.isPending || updatePost.isPending}
            >
              {createPost.isPending || updatePost.isPending ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
