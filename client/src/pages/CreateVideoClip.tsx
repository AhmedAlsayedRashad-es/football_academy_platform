import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Upload, ArrowLeft, Video, Scissors, Save, Loader2, Play, Pause
} from 'lucide-react';

export default function CreateVideoClip() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { t, language } = useLanguage();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0); // MB/s
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // seconds
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionQuality, setCompressionQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);
  const [compressedFileSize, setCompressedFileSize] = useState<number>(0);

  // Clip creation state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [clipType, setClipType] = useState<string>('training_clip');

  // Fetch teams and matches for linking
  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: matches } = trpc.matches.getAll.useQuery();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);

  // Upload video mutation
  const uploadVideoMutation = trpc.videoClips.uploadVideo.useMutation({
    onSuccess: (result) => {
      setUploadedVideoUrl(result.url);
      setIsUploading(false);
      setUploadProgress(100);
      toast.success('Video uploaded successfully!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setIsUploading(false);
      toast.error('Failed to upload video');
    },
  });

  // Create clip mutation
  const createClipMutation = trpc.videoClips.create.useMutation({
    onSuccess: () => {
      toast.success('Clip created successfully!');
      setLocation('/video-clip-library');
    },
    onError: (error) => {
      console.error('Create clip error:', error);
      toast.error('Failed to create clip');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        toast.error('Video must be less than 500MB');
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setOriginalFileSize(file.size);
      
      // Auto-generate title from filename
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
      
      // Show file size info
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.success(`Video loaded: ${fileSizeMB} MB`);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error('Video must be less than 500MB');
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    } else {
      toast.error('Please drop a valid video file');
    }
  };

  // Generate video thumbnail from current video frame
  const generateThumbnail = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) {
        reject(new Error('Video element not found'));
        return;
      }

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to 1 second (or 10% of duration)
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;

      // Wait for seek to complete
      const onSeeked = async () => {
        video.removeEventListener('seeked', onSeeked);
        
        try {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Failed to create thumbnail blob'));
              return;
            }

            // Upload thumbnail to S3
            const formData = new FormData();
            formData.append('thumbnail', blob, 'thumbnail.jpg');

            try {
              const response = await fetch('/api/upload-thumbnail', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                throw new Error('Thumbnail upload failed');
              }

              const data = await response.json();
              resolve(data.url);
            } catch (error) {
              reject(error);
            }
          }, 'image/jpeg', 0.85);
        } catch (error) {
          reject(error);
        }
      };

      video.addEventListener('seeked', onSeeked);
    });
  };

  const handleUploadVideo = async () => {
    if (!videoFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);
    setTimeRemaining(0);

    try {
      const fileSizeMB = videoFile.size / (1024 * 1024);
      const startTime = Date.now();
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('video', videoFile);

      // Use XMLHttpRequest for real progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
          
          // Calculate upload speed and time remaining
          const elapsedTime = (Date.now() - startTime) / 1000; // seconds
          const uploadedMB = e.loaded / (1024 * 1024);
          const speed = uploadedMB / elapsedTime;
          const remainingMB = fileSizeMB - uploadedMB;
          const timeLeft = remainingMB / speed;
          
          setUploadSpeed(speed);
          setTimeRemaining(Math.max(0, timeLeft));
        }
      });

      // Handle completion
      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setUploadedVideoUrl(response.url);
          
          // Generate thumbnail after upload
          try {
            const thumbUrl = await generateThumbnail();
            setThumbnailUrl(thumbUrl);
          } catch (error) {
            console.error('Thumbnail generation failed:', error);
            // Continue without thumbnail
          }
          
          setIsUploading(false);
          setUploadProgress(100);
          setUploadSpeed(0);
          setTimeRemaining(0);
          toast.success('Video uploaded successfully!');
        } else {
          throw new Error('Upload failed');
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        throw new Error('Upload failed');
      });

      // Send request
      xhr.open('POST', '/api/upload-video');
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSpeed(0);
      setTimeRemaining(0);
      toast.error('Failed to upload video');
    }
  };

  const handleCreateClip = () => {
    if (!user || !uploadedVideoUrl || !title) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }

    createClipMutation.mutate({
      title,
      description: description || undefined,
      videoUrl: uploadedVideoUrl,
      thumbnailUrl: thumbnailUrl || undefined,
      duration: Math.round(endTime - startTime),
      startTime: Math.round(startTime),
      endTime: Math.round(endTime),
      teamId: selectedTeamId || undefined,
      matchId: selectedMatchId || undefined,
    });
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setEndTime(videoDuration);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const setStartTimeToCurrentTime = () => {
    setStartTime(currentTime);
    toast.success(`Start time set to ${formatTime(currentTime)}`);
  };

  const setEndTimeToCurrentTime = () => {
    setEndTime(currentTime);
    toast.success(`End time set to ${formatTime(currentTime)}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <>
    <div className="text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/video-clip-library')}
              className="text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create Video Clip</h1>
              <p className="text-gray-600 mt-1">Upload a video and create clips for your library</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Video Upload & Player */}
          <div className="space-y-6">
            {/* Upload Section */}
            {!videoUrl && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                    Upload Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
                      isDragging 
                        ? 'border-cyan-500 bg-cyan-50 scale-[1.02]' 
                        : 'border-gray-300 hover:border-cyan-400 hover:bg-gray-50'
                    }`}
                  >
                    <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-gray-700 mb-2">Click to upload video</p>
                    <p className="text-sm text-muted-foreground">MP4, MOV, AVI up to 500MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </CardContent>
              </Card>
            )}

            {/* Video Player */}
            {videoUrl && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Video className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                    Video Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full rounded-lg mb-4"
                    onLoadedMetadata={handleVideoLoaded}
                    onTimeUpdate={handleTimeUpdate}
                    controls
                  />

                  {/* Video Controls */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Button onClick={handlePlayPause} size="sm">
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2">
                      <Label className="text-gray-900">Timeline</Label>
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        value={currentTime}
                        onChange={(e) => seekTo(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Clip Markers */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-900">Start Time: {formatTime(startTime)}</Label>
                        <Button
                          onClick={setStartTimeToCurrentTime}
                          size="sm"
                          className="w-full mt-2"
                          variant="outline"
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          Set Start
                        </Button>
                      </div>
                      <div>
                        <Label className="text-gray-900">End Time: {formatTime(endTime)}</Label>
                        <Button
                          onClick={setEndTimeToCurrentTime}
                          size="sm"
                          className="w-full mt-2"
                          variant="outline"
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          Set End
                        </Button>
                      </div>
                    </div>

                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                      <p className="text-sm text-cyan-700 dark:text-cyan-300">
                        Clip Duration: {formatTime(endTime - startTime)}
                      </p>
                    </div>

                    {!uploadedVideoUrl && (
                      <Button
                        onClick={handleUploadVideo}
                        disabled={isUploading}
                        className="w-full bg-cyan-500 hover:bg-cyan-600"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            <div className="flex flex-col items-center gap-1">
                              <span>Uploading... {Math.round(uploadProgress)}%</span>
                              {uploadSpeed > 0 && (
                                <span className="text-xs text-gray-600">
                                  {uploadSpeed.toFixed(2)} MB/s • {Math.round(timeRemaining)}s remaining
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Video to Cloud
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Clip Details */}
          {videoUrl && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                  Clip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-gray-900">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter clip title"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-900">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what happens in this clip"
                    className="bg-white border-gray-300 text-gray-900"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="clipType" className="text-gray-900">Clip Type</Label>
                  <Select value={clipType} onValueChange={setClipType}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[10001]">
                      <SelectItem value="training_clip">Training Clip</SelectItem>
                      <SelectItem value="match_highlight">Match Highlight</SelectItem>
                      <SelectItem value="skill_demo">Skill Demonstration</SelectItem>
                      <SelectItem value="tactical_analysis">Tactical Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="team" className="text-gray-900">Team (Optional)</Label>
                  <Select value={selectedTeamId?.toString() || ''} onValueChange={(val) => setSelectedTeamId(val ? parseInt(val) : null)}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent className="z-[10001]">
                      {teams?.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="match" className="text-gray-900">Match (Optional)</Label>
                  <Select value={selectedMatchId?.toString() || ''} onValueChange={(val) => setSelectedMatchId(val ? parseInt(val) : null)}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select match" />
                    </SelectTrigger>
                    <SelectContent className="z-[10001]">
                      {matches?.map((match) => (
                        <SelectItem key={match.id} value={match.id.toString()}>
                          {match.opponent} - {new Date(match.matchDate).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateClip}
                  disabled={!uploadedVideoUrl || !title || createClipMutation.isPending}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  {createClipMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Clip...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Clip
                    </>
                  )}
                </Button>

                {!uploadedVideoUrl && (
                  <p className="text-sm text-muted-foreground text-center">
                    Upload the video first before creating the clip
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
