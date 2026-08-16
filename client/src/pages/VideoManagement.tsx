import { useState, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Video, Trash2, Edit, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { storagePut } from "../../../server/storage";
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORY_LABELS: Record<string, string> = {
  hero: "Hero Video",
  gallery_drills: "Gallery - Technical Drills",
  gallery_highlights: "Gallery - Match Highlights",
  gallery_skills: "Gallery - Skills Training",
  training: "Training Library",
  other: "Other",
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime'];

export default function VideoManagement() {
  const utils = trpc.useUtils();
  const { data: videos, isLoading } = trpc.academyVideos.getAll.useQuery();
  const { t, language } = useLanguage();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "training" as const,
    displayOrder: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createMutation = trpc.academyVideos.create.useMutation({
    onSuccess: () => {
      toast.success("Video uploaded successfully");
      setUploadDialogOpen(false);
      resetForm();
      utils.academyVideos.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload video");
      setUploading(false);
    },
  });

  const deleteMutation = trpc.academyVideos.delete.useMutation({
    onSuccess: () => {
      toast.success("Video deleted successfully");
      utils.academyVideos.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete video");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "training",
      displayOrder: 0,
    });
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      toast.error("Invalid file format. Please upload MP4, WebM, or MOV files.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`);
      return;
    }

    setSelectedFile(file);
    
    // Auto-fill title from filename if empty
    if (!formData.title) {
      const filename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setFormData({ ...formData, title: filename });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a video file");
      return;
    }

    if (!formData.title) {
      toast.error("Please enter a video title");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExtension = selectedFile.name.split('.').pop();
      const fileKey = `academy-videos/${timestamp}-${randomSuffix}.${fileExtension}`;

      setUploadProgress(30);

      // Read file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      setUploadProgress(50);

      // Upload to S3 using the storage helper
      // Note: This is a placeholder - actual implementation would need server-side upload
      // For now, we'll create a FormData and send it to a custom endpoint
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('fileKey', fileKey);

      const uploadResponse = await fetch('/api/upload-video', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { videoUrl } = await uploadResponse.json();

      setUploadProgress(80);

      // Create video record in database
      await createMutation.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        videoUrl,
        fileKey,
        fileSize: selectedFile.size,
        displayOrder: formData.displayOrder,
      });

      setUploadProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload video");
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    await deleteMutation.mutateAsync({ id });
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      hero: "bg-purple-500/10 text-purple-500 border-purple-500",
      gallery_drills: "bg-blue-500/10 text-blue-500 border-blue-500",
      gallery_highlights: "bg-red-500/10 text-red-500 border-red-500",
      gallery_skills: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500",
      training: "bg-orange-500/10 text-orange-700 dark:text-orange-500 border-orange-500",
      other: "bg-slate-500/10 text-muted-foreground border-slate-500",
    };

    return (
      <Badge variant="outline" className={colors[category] || colors.other}>
        {CATEGORY_LABELS[category] || category}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
    <div >
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/videos">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Video className="w-7 h-7" />
                  Video Management
                </h1>
                <p className="text-muted-foreground text-sm">Upload and manage academy training videos</p>
              </div>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Upload New Video</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Upload a training video to the academy library
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="video-file" className="text-foreground">Video File *</Label>
                    <Input
                      ref={fileInputRef}
                      id="video-file"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="bg-muted border-border text-foreground"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Supported formats: MP4, WebM, MOV. Max size: 500MB
                    </p>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-foreground">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      disabled={uploading}
                      className="bg-muted border-border text-foreground"
                      placeholder="e.g., Dribbling Fundamentals"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={uploading}
                      className="bg-muted border-border text-foreground"
                      placeholder="Brief description of the video content"
                      rows={3}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-foreground">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                      disabled={uploading}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        <SelectItem value="hero" className="text-foreground">Hero Video</SelectItem>
                        <SelectItem value="gallery_drills" className="text-foreground">Gallery - Technical Drills</SelectItem>
                        <SelectItem value="gallery_highlights" className="text-foreground">Gallery - Match Highlights</SelectItem>
                        <SelectItem value="gallery_skills" className="text-foreground">Gallery - Skills Training</SelectItem>
                        <SelectItem value="training" className="text-foreground">Training Library</SelectItem>
                        <SelectItem value="other" className="text-foreground">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Display Order */}
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder" className="text-foreground">Display Order</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      disabled={uploading}
                      className="bg-muted border-border text-foreground"
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower numbers appear first in the gallery
                    </p>
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Uploading...</span>
                        <span className="text-emerald-700 dark:text-emerald-500">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadDialogOpen(false);
                      resetForm();
                    }}
                    disabled={uploading}
                    className="border-border text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Video Library */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Video Library ({videos?.length || 0})
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage all academy training videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading videos...</div>
            ) : videos && videos.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Preview</TableHead>
                      <TableHead className="text-muted-foreground">Title</TableHead>
                      <TableHead className="text-muted-foreground">Category</TableHead>
                      <TableHead className="text-muted-foreground">Size</TableHead>
                      <TableHead className="text-muted-foreground">Order</TableHead>
                      <TableHead className="text-muted-foreground">Uploaded</TableHead>
                      <TableHead className="text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos.map((video) => (
                      <TableRow key={video.id} className="border-border">
                        <TableCell>
                          <div className="relative w-24 h-16 bg-muted rounded overflow-hidden group">
                            <video
                              src={video.videoUrl}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-6 h-6 text-foreground" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-foreground font-medium">{video.title}</p>
                            {video.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {video.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryBadge(video.category)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {video.fileSize ? formatFileSize(video.fileSize) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{video.displayOrder}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDelete(video.id, video.title)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No videos uploaded yet</p>
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Video
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
