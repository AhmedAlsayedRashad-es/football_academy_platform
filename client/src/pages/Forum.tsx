import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {MessageSquare,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Eye,
  CheckCircle,
  Search,
  TrendingUp,
  Clock,
  Trophy,
  Target,
  Dumbbell,
  HelpCircle, ArrowLeft} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';


export default function Forum() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    categoryId: 1,
    postType: 'discussion' as 'question' | 'discussion' | 'tip' | 'success_story',
  });

  const utils = trpc.useUtils();

  const { data: categories } = trpc.forum.getCategories.useQuery();
  const { data: posts, isLoading } = trpc.forum.getPosts.useQuery({
    categoryId: selectedCategory || undefined,
    search: searchQuery || undefined,
    sortBy,
  });

  const createPostMutation = trpc.forum.createPost.useMutation({
    onSuccess: () => {
      toast.success('Post created successfully!');
      setIsCreateDialogOpen(false);
      setNewPost({ title: '', content: '', categoryId: 1, postType: 'discussion' });
      utils.forum.getPosts.invalidate();
      utils.forum.getCategories.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create post');
    },
  });

  const voteMutation = trpc.forum.vote.useMutation({
    onSuccess: () => {
      utils.forum.getPosts.invalidate();
    },
  });

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    createPostMutation.mutate(newPost);
  };

  const handleVote = (postId: number, voteType: 'upvote' | 'downvote') => {
    voteMutation.mutate({ targetType: 'post', targetId: postId, voteType });
  };

  const getCategoryIcon = (icon: string) => {
    const icons: Record<string, any> = {
      MessageSquare,
      Target,
      Dumbbell,
      HelpCircle,
      Trophy,
    };
    const Icon = icons[icon] || MessageSquare;
    return <Icon className="h-5 w-5" />;
  };

  const getPostTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      question: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      discussion: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      tip: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      success_story: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return colors[type] || colors.discussion;
  };

  return (
    <>
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          
          <button onClick={() => navigate("/community")} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

            <ArrowLeft className="w-5 h-5" />

          </button>
<h1 className="text-3xl font-bold mb-2">Community Forum</h1>
          <p className="text-muted-foreground">
            Share knowledge, ask questions, and connect with other coaches
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        {categories?.map((category) => (
          <Card
            key={category.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === category.id
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
          >
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon(category.icon || 'MessageSquare')}
              <span className="font-semibold text-sm">{category.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">{category.postCount || 0} posts</div>
          </Card>
        ))}
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </div>
            </SelectItem>
            <SelectItem value="popular">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Popular
              </div>
            </SelectItem>
            <SelectItem value="unanswered">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Unanswered
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(post.id, 'upvote')}
                    className="h-8 w-8 p-0"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-lg">{(post.upvotes || 0) - (post.downvotes || 0)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(post.id, 'downvote')}
                    className="h-8 w-8 p-0"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Post Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPostTypeColor(post.postType || 'discussion')}>
                          {post.postType}
                        </Badge>
                        {post.hasAcceptedAnswer && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Answered
                          </Badge>
                        )}
                        {post.isPinned && (
                          <Badge variant="secondary">{t("forum.pinned")}</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-1 hover:text-orange-600 cursor-pointer">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    </div>
                  </div>

                  {/* Post Meta */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {post.replyCount || 0} replies
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.viewCount || 0} views
                    </div>
                    <div className="ml-auto">
                      by {post.authorName || 'Unknown'} •{' '}
                      {formatDistanceToNow(new Date(post.createdAt ?? Date.now()), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No posts found. Be the first to start a discussion!</p>
          </Card>
        )}
      </div>

      {/* Create Post Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t("common.category")}</label>
              <Select
                value={newPost.categoryId.toString()}
                onValueChange={(value) => setNewPost({ ...newPost, categoryId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Post Type</label>
              <Select
                value={newPost.postType}
                onValueChange={(value: any) => setNewPost({ ...newPost, postType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="tip">Tip</SelectItem>
                  <SelectItem value="success_story">Success Story</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="Enter post title..."
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                placeholder="Write your post content..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePost} disabled={createPostMutation.isPending}>
              {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
