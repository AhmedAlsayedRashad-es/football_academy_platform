import { extractJSON } from './_core/llm';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { storagePut } from './storage';
import { sdk } from './_core/sdk';
import { invokeLLM } from './_core/llm';

// Configure multer for video uploads
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// Configure multer for certificate template uploads
const uploadCertificate = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  },
});

// Configure multer for avatar/profile photo uploads
const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Configure multer for thumbnail uploads
const uploadThumbnail = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for thumbnails
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export function createUploadRouter() {
  const router = Router();

  // Video upload endpoint
  router.post('/upload-video', uploadVideo.single('video'), async (req: Request, res: Response) => {
    try {
      // Verify authentication using SDK
      let user;
      try {
        user = await sdk.authenticateRequest(req);
        if (!user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExtension = req.file.originalname.split('.').pop();
      const fileKey = `videos/${user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;

      // Upload to S3
      const { url } = await storagePut(
        fileKey,
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        fileKey,
        url,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Thumbnail upload endpoint
  router.post('/upload-thumbnail', uploadThumbnail.single('thumbnail'), async (req: Request, res: Response) => {
    try {
      // Verify authentication using SDK
      let user;
      try {
        user = await sdk.authenticateRequest(req);
        if (!user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `thumbnails/${user.id}/${timestamp}-${randomSuffix}.jpg`;

      // Upload to S3
      const { url } = await storagePut(
        fileKey,
        req.file.buffer,
        'image/jpeg'
      );

      res.json({
        success: true,
        fileKey,
        url,
      });
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      res.status(500).json({ 
        error: 'Thumbnail upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Certificate template upload endpoint
  router.post('/upload-certificate', uploadCertificate.single('certificate'), async (req: Request, res: Response) => {
    try {
      let user;
      try {
        user = await sdk.authenticateRequest(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
      } catch { return res.status(401).json({ error: 'Unauthorized' }); }
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExtension = req.file.originalname.split('.').pop();
      const fileKey = `certificates/${user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      res.json({ success: true, fileKey, url, originalName: req.file.originalname });
    } catch (error) {
      console.error('Certificate upload error:', error);
      res.status(500).json({ error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // General file upload endpoint (for medical reports, documents, etc.)
  const uploadGeneral = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
  router.post('/upload', uploadGeneral.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const ext = req.file.originalname.split('.').pop();
      const fileKey = `documents/${timestamp}-${randomSuffix}.${ext}`;
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      res.json({ success: true, fileKey, url, originalName: req.file.originalname });
    } catch (error) {
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  // AI Medical Report Analysis endpoint
  router.post('/analyze-medical-report', async (req: Request, res: Response) => {
    try {
      const { fileUrl, playerId, playerName } = req.body;
      const prompt = `You are an expert sports medicine physician and FIFA Medical Centre of Excellence consultant.
A medical report has been uploaded for football player: ${playerName || 'Unknown Player'} (ID: ${playerId || 'N/A'}).
File URL: ${fileUrl || 'Not provided - provide general FIFA/UEFA standard recommendations'}

Provide a comprehensive medical analysis following international sports medicine protocols (FIFA Medical Centre of Excellence, UEFA Medical Regulations, IOC Consensus Statements on athlete health).

Return ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence summary",
  "findings": ["finding 1", "finding 2"],
  "concerns": ["concern 1", "concern 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "protocol": "Applicable international protocol reference",
  "returnToPlay": "Return to play guidance if applicable",
  "missingData": ["Missing data point 1", "Missing data point 2"]
}`;

      const result = await invokeLLM({ messages: [{ role: 'user', content: prompt }], responseFormat: { type: 'json_object' } });
      let analysis;
      try {
        const rawContent = (result.choices?.[0]?.message?.content as string) || '{}';
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        analysis = extractJSON(rawContent);
      } catch {
        analysis = {
          summary: 'Medical report received. Please consult a qualified sports medicine physician for detailed analysis.',
          findings: ['Report uploaded successfully'],
          concerns: [],
          recommendations: ['Schedule a consultation with the team doctor', 'Ensure all FIFA pre-participation examination requirements are met'],
          protocol: 'FIFA Medical Centre of Excellence - Pre-participation Examination Guidelines (2023)'
        };
      }
      res.json(analysis);
    } catch (error) {
      console.error('Medical report analysis error:', error);
      res.status(500).json({ error: 'Analysis failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Cover photo upload endpoint
  router.post('/upload-cover', uploadAvatar.single('cover'), async (req: Request, res: Response) => {
    try {
      let user;
      try {
        user = await sdk.authenticateRequest(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
      } catch { return res.status(401).json({ error: 'Unauthorized' }); }
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const ext = req.file.originalname.split('.').pop() || 'jpg';
      const fileKey = `covers/${user.id}/${timestamp}-${randomSuffix}.${ext}`;
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      const { getDb } = await import('./db');
      const database = await getDb();
      if (database) {
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await (database as any).update(users).set({ coverPhotoUrl: url }).where(eq(users.id, user.id));
      }
      res.json({ success: true, fileKey, url });
    } catch (error) {
      console.error('Cover upload error:', error);
      res.status(500).json({ error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Player photo upload endpoint
  router.post('/upload-player-photo', uploadAvatar.single('photo'), async (req: Request, res: Response) => {
    try {
      let user;
      try {
        user = await sdk.authenticateRequest(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
      } catch { return res.status(401).json({ error: 'Unauthorized' }); }
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const playerId = parseInt(req.body.playerId || '0');
      if (!playerId) return res.status(400).json({ error: 'playerId required' });
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const ext = req.file.originalname.split('.').pop() || 'jpg';
      const fileKey = `player-photos/${playerId}/${timestamp}-${randomSuffix}.${ext}`;
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      const { getDb } = await import('./db');
      const database = await getDb();
      if (database) {
        const { players } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await database.update(players).set({ photoUrl: url }).where(eq(players.id, playerId));
      }
      res.json({ success: true, fileKey, url });
    } catch (error) {
      console.error('Player photo upload error:', error);
      res.status(500).json({ error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Avatar/profile photo upload endpoint
  router.post('/upload-avatar', uploadAvatar.single('avatar'), async (req: Request, res: Response) => {
    try {
      let user;
      try {
        user = await sdk.authenticateRequest(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
      } catch { return res.status(401).json({ error: 'Unauthorized' }); }
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const ext = req.file.originalname.split('.').pop() || 'jpg';
      const fileKey = `avatars/${user.id}/${timestamp}-${randomSuffix}.${ext}`;
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      // Update user's avatarUrl in the database
      const { updateUserAvatar } = await import('./db');
      await updateUserAvatar(user.id, url);
      res.json({ success: true, fileKey, url });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  return router;
}
