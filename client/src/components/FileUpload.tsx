import React, { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { trpc } from '../lib/trpc';
import { useToast } from '../hooks/use-toast';

interface FileUploadProps {
  onUploadComplete: (url: string, fileKey: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export function FileUpload({ 
  onUploadComplete, 
  accept = 'image/*', 
  maxSizeMB = 10,
  label = 'Upload File'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  
  const uploadMutation = trpc.upload.uploadFile.useMutation();

  const handleFile = useCallback(async (file: File) => {
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: 'File too large',
        description: `File size must be less than ${maxSizeMB}MB`,
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/...;base64, prefix

        try {
          const result = await uploadMutation.mutateAsync({
            fileData: base64Data,
            fileName: file.name,
            contentType: file.type
          });

          setPreview(result.url);
          onUploadComplete(result.url, result.fileKey);
          
          toast({
            title: 'Upload successful',
            description: 'File uploaded successfully'
          });
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: 'Upload failed',
            description: 'Failed to upload file. Please try again.',
            variant: 'destructive'
          });
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: 'Error reading file',
          description: 'Failed to read file. Please try again.',
          variant: 'destructive'
        });
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File handling error:', error);
      setIsUploading(false);
    }
  }, [maxSizeMB, onUploadComplete, toast, uploadMutation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </label>
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging 
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' 
              : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          <label 
            htmlFor="file-upload" 
            className="cursor-pointer flex flex-col items-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading...
                </p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground dark:text-gray-500 mt-2">
                  Max file size: {maxSizeMB}MB
                </p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
