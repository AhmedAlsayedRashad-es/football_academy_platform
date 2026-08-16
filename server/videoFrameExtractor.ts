import { storagePut, storageGet } from "./storage";

interface FrameExtractionResult {
  frames: {
    timestamp: number;
    url: string;
    base64?: string;
  }[];
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
}

/**
 * Extract key frames from a video for AI analysis
 * Since we can't do actual video processing in the browser/Node without ffmpeg,
 * we'll use a smart approach:
 * 1. For videos uploaded to S3, we create frame timestamps
 * 2. The frontend will capture frames using HTML5 video element
 * 3. Those frames are sent to the backend for AI analysis
 */
export async function extractFrameTimestamps(
  videoDuration: number,
  frameCount: number = 5
): Promise<number[]> {
  // Extract frames at regular intervals throughout the video
  const timestamps: number[] = [];
  const interval = videoDuration / (frameCount + 1);
  
  for (let i = 1; i <= frameCount; i++) {
    timestamps.push(Math.round(interval * i * 10) / 10);
  }
  
  return timestamps;
}

/**
 * Store extracted frame for analysis
 */
export async function storeFrame(
  analysisId: string,
  frameIndex: number,
  frameData: string, // base64 encoded image
  contentType: string = "image/jpeg"
): Promise<{ url: string; key: string }> {
  // Convert base64 to buffer
  const base64Data = frameData.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  
  const key = `video-analysis/${analysisId}/frame-${frameIndex}.jpg`;
  const result = await storagePut(key, buffer, contentType);
  
  return { url: result.url, key };
}

/**
 * Get frame URLs for an analysis
 */
export async function getFrameUrls(
  analysisId: string,
  frameCount: number
): Promise<string[]> {
  const urls: string[] = [];
  
  for (let i = 0; i < frameCount; i++) {
    const key = `video-analysis/${analysisId}/frame-${i}.jpg`;
    try {
      const result = await storageGet(key);
      urls.push(result.url);
    } catch {
      // Frame not found, skip
    }
  }
  
  return urls;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  frameRate?: number;
}

/**
 * Parse video metadata from frontend
 */
export function parseVideoMetadata(metadata: Partial<VideoMetadata>): VideoMetadata {
  return {
    duration: metadata.duration || 60,
    width: metadata.width || 1920,
    height: metadata.height || 1080,
    frameRate: metadata.frameRate || 30,
  };
}
