import React, { useState, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  accept?: string;
  maxSize?: number; // in MB
  onUpload: (file: File) => Promise<string | null>;
  onUrlChange: (url: string) => void;
  currentUrl?: string;
  type: 'image' | 'video';
}

export default function FileUploadZone({
  accept = 'image/*,video/*',
  maxSize = 50,
  onUpload,
  onUrlChange,
  currentUrl,
  type
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [fileName, setFileName] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (type === 'image' && !isImage) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (type === 'video' && !isVideo) {
      toast.error('Please upload a video file');
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Upload file
      const url = await onUpload(file);
      if (url) {
        onUrlChange(url);
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName('');
    onUrlChange('');
  };

  return (
    <div className="space-y-3">
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700'}
            ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary hover:bg-primary/5'}
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-muted-foreground" />
            )}
            
            <div>
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Drag & drop your file here'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse (max {maxSize}MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="flex-shrink-0">
              {type === 'image' ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName || 'Uploaded file'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {type === 'image' ? 'Image' : 'Video'} uploaded successfully
              </p>
            </div>

            {/* Remove button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
