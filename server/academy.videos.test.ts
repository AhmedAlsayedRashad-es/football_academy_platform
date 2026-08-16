import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Academy Video Management System', () => {
  let testVideoId: number;
  const testUserId = 1; // Assuming admin user exists

  it('should create a new academy video', async () => {
    const videoData = {
      title: 'Test Training Video',
      description: 'A test video for the academy',
      category: 'training' as const,
      videoUrl: 'https://storage.example.com/test-video.mp4',
      thumbnailUrl: 'https://storage.example.com/test-thumbnail.jpg',
      fileKey: 'academy-videos/test-123.mp4',
      duration: 300,
      fileSize: 50000000,
      uploadedBy: testUserId,
      displayOrder: 0,
    };

    const video = await db.createAcademyVideo(videoData);
    
    expect(video).toBeDefined();
    expect(video.title).toBe('Test Training Video');
    expect(video.category).toBe('training');
    expect(video.videoUrl).toBe('https://storage.example.com/test-video.mp4');
    expect(video.isActive).toBe(true);
    
    testVideoId = video.id;
  });

  it('should retrieve video by ID', async () => {
    const video = await db.getAcademyVideoById(testVideoId);
    
    expect(video).toBeDefined();
    expect(video?.id).toBe(testVideoId);
    expect(video?.title).toBe('Test Training Video');
  });

  it('should get all active academy videos', async () => {
    const videos = await db.getAllAcademyVideos();
    
    expect(videos).toBeDefined();
    expect(Array.isArray(videos)).toBe(true);
    expect(videos.length).toBeGreaterThan(0);
    
    const testVideo = videos.find(v => v.id === testVideoId);
    expect(testVideo).toBeDefined();
  });

  it('should get videos by category', async () => {
    const trainingVideos = await db.getAcademyVideosByCategory('training');
    
    expect(trainingVideos).toBeDefined();
    expect(Array.isArray(trainingVideos)).toBe(true);
    
    const testVideo = trainingVideos.find(v => v.id === testVideoId);
    expect(testVideo).toBeDefined();
    expect(testVideo?.category).toBe('training');
  });

  it('should create and retrieve hero video', async () => {
    const heroVideoData = {
      title: 'Academy Hero Video',
      description: 'Main hero video for homepage',
      category: 'hero' as const,
      videoUrl: 'https://storage.example.com/hero-video.mp4',
      fileKey: 'academy-videos/hero-456.mp4',
      uploadedBy: testUserId,
      displayOrder: 0,
    };

    const heroVideo = await db.createAcademyVideo(heroVideoData);
    expect(heroVideo).toBeDefined();
    expect(heroVideo.category).toBe('hero');

    const retrievedHero = await db.getHeroVideo();
    expect(retrievedHero).toBeDefined();
    expect(retrievedHero?.category).toBe('hero');
  });

  it('should update academy video', async () => {
    const updatedData = {
      title: 'Updated Training Video',
      description: 'Updated description',
      displayOrder: 5,
    };

    const updatedVideo = await db.updateAcademyVideo(testVideoId, updatedData);
    
    expect(updatedVideo).toBeDefined();
    expect(updatedVideo?.title).toBe('Updated Training Video');
    expect(updatedVideo?.description).toBe('Updated description');
    expect(updatedVideo?.displayOrder).toBe(5);
  });

  it('should soft delete academy video', async () => {
    await db.deleteAcademyVideo(testVideoId);
    
    const video = await db.getAcademyVideoById(testVideoId);
    expect(video).toBeDefined();
    expect(video?.isActive).toBe(false);
    
    // Video should not appear in active videos list
    const activeVideos = await db.getAllAcademyVideos();
    const deletedVideo = activeVideos.find(v => v.id === testVideoId);
    expect(deletedVideo).toBeUndefined();
  });

  it('should create gallery videos for different categories', async () => {
    const categories = ['gallery_drills', 'gallery_highlights', 'gallery_skills'] as const;
    
    for (const category of categories) {
      const videoData = {
        title: `Test ${category} Video`,
        category,
        videoUrl: `https://storage.example.com/${category}.mp4`,
        fileKey: `academy-videos/${category}-test.mp4`,
        uploadedBy: testUserId,
        displayOrder: 0,
      };

      const video = await db.createAcademyVideo(videoData);
      expect(video).toBeDefined();
      expect(video.category).toBe(category);
    }

    // Verify we can retrieve each category
    for (const category of categories) {
      const videos = await db.getAcademyVideosByCategory(category);
      expect(videos.length).toBeGreaterThan(0);
      expect(videos[0].category).toBe(category);
    }
  });
});
