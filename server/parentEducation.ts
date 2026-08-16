import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { eq, and, sql } from 'drizzle-orm';

export const parentEducationRouter = router({
  // Get all courses
  getAllCourses: protectedProcedure.query(async () => {
    const db = (await getDb())!;
    const result = await db.execute(sql`
      SELECT * FROM education_courses 
      WHERE isPublished = true 
      ORDER BY orderIndex ASC
    `);
    return (result as any[]);
  }),

  // Get course by ID
  getCourseById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const result = await db.execute(sql`
        SELECT * FROM education_courses WHERE id = ${input.id}
      `);
      return (result as any[])[0] || null;
    }),

  // Get course lessons
  getCourseLessons: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const result = await db.execute(sql`
        SELECT * FROM course_lessons 
        WHERE courseId = ${input.courseId} AND isPublished = true
        ORDER BY orderIndex ASC
      `);
      return (result as any[]);
    }),

  // Get lesson by ID
  getLessonById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const result = await db.execute(sql`
        SELECT * FROM course_lessons WHERE id = ${input.id}
      `);
      return (result as any[])[0] || null;
    }),

  // Get lesson content
  getLessonContent: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const result = await db.execute(sql`
        SELECT * FROM lesson_content 
        WHERE lessonId = ${input.lessonId}
        ORDER BY orderIndex ASC
      `);
      return (result as any[]);
    }),

  // Get course progress for user
  getCourseProgress: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const result = await db.execute(sql`
        SELECT ulp.* 
        FROM user_lesson_progress ulp
        JOIN course_lessons cl ON ulp.lessonId = cl.id
        WHERE cl.courseId = ${input.courseId} AND ulp.userId = ${ctx.user.id}
      `);
      return (result as any[]);
    }),

  // Get lesson progress for user
  getLessonProgress: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const result = await db.execute(sql`
        SELECT * FROM user_lesson_progress 
        WHERE lessonId = ${input.lessonId} AND userId = ${ctx.user.id}
      `);
      return (result as any[])[0] || null;
    }),

  // Mark lesson as complete
  markLessonComplete: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      
      // Check if progress record exists
      const existing = await db.execute(sql`
        SELECT * FROM user_lesson_progress 
        WHERE lessonId = ${input.lessonId} AND userId = ${ctx.user.id}
      `);

      if ((existing as any[]).length > 0) {
        // Update existing record
        await db.execute(sql`
          UPDATE user_lesson_progress 
          SET completed = true, completedAt = NOW(), progress = 100
          WHERE lessonId = ${input.lessonId} AND userId = ${ctx.user.id}
        `);
      } else {
        // Insert new record
        await db.execute(sql`
          INSERT INTO user_lesson_progress (userId, lessonId, completed, completedAt, progress)
          VALUES (${ctx.user.id}, ${input.lessonId}, true, NOW(), 100)
        `);
      }

      return { success: true };
    }),

  // Update lesson progress
  updateLessonProgress: protectedProcedure
    .input(z.object({ 
      lessonId: z.number(),
      progress: z.number().min(0).max(100)
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      
      // Check if progress record exists
      const existing = await db.execute(sql`
        SELECT * FROM user_lesson_progress 
        WHERE lessonId = ${input.lessonId} AND userId = ${ctx.user.id}
      `);

      if ((existing as any[]).length > 0) {
        // Update existing record
        await db.execute(sql`
          UPDATE user_lesson_progress 
          SET progress = ${input.progress}
          WHERE lessonId = ${input.lessonId} AND userId = ${ctx.user.id}
        `);
      } else {
        // Insert new record
        await db.execute(sql`
          INSERT INTO user_lesson_progress (userId, lessonId, progress)
          VALUES (${ctx.user.id}, ${input.lessonId}, ${input.progress})
        `);
      }

      return { success: true };
    }),

  // Get user's enrolled courses with progress
  getEnrolledCoursesWithProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const result = await db.execute(sql`
      SELECT 
        ec.*,
        COUNT(DISTINCT cl.id) as totalLessons,
        COUNT(DISTINCT CASE WHEN ulp.completed = true THEN ulp.id END) as completedLessons,
        ROUND(
          (COUNT(DISTINCT CASE WHEN ulp.completed = true THEN ulp.id END) * 100.0) / 
          NULLIF(COUNT(DISTINCT cl.id), 0), 
          0
        ) as progressPercentage
      FROM education_courses ec
      LEFT JOIN course_lessons cl ON ec.id = cl.courseId
      LEFT JOIN user_lesson_progress ulp ON cl.id = ulp.lessonId AND ulp.userId = ${ctx.user.id}
      WHERE ec.isPublished = true
      GROUP BY ec.id
      ORDER BY ec.orderIndex ASC
    `);
    return (result as any[]);
  }),

  // Get quiz questions for a course
  getQuizQuestions: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const result = await db.execute(sql`
        SELECT * FROM quiz_questions 
        WHERE courseId = ${input.courseId}
        ORDER BY id ASC
      `);
      return (result as any[]);
    }),

  // Submit quiz answers
  submitQuiz: protectedProcedure
    .input(z.object({
      courseId: z.number(),
      answers: z.array(z.object({
        questionId: z.number(),
        answerIndex: z.number()
      }))
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      
      // Get all questions for the course
      const questionsResult = await db.execute(sql`
        SELECT * FROM quiz_questions WHERE courseId = ${input.courseId}
      `);
      const questions = (questionsResult as any[]);
      
      // Calculate score
      let correctAnswers = 0;
      const answersMap = new Map(input.answers.map(a => [a.questionId, a.answerIndex]));
      
      for (const question of questions) {
        const userAnswer = answersMap.get(question.id);
        if (userAnswer === question.correctAnswer) {
          correctAnswers++;
        }
      }
      
      const totalQuestions = questions.length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = score >= 70;
      
      // Save quiz attempt
      await db.execute(sql`
        INSERT INTO quiz_attempts (userId, courseId, score, answers, passed, attemptedAt)
        VALUES (
          ${ctx.user.id},
          ${input.courseId},
          ${score},
          ${JSON.stringify(input.answers)},
          ${passed},
          NOW()
        )
      `);
      
      return {
        score,
        totalQuestions,
        correctAnswers,
        passed
      };
    }),

  // Get quiz attempts for a course
  getQuizAttempts: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const result = await db.execute(sql`
        SELECT * FROM quiz_attempts 
        WHERE courseId = ${input.courseId} AND userId = ${ctx.user.id}
        ORDER BY attemptedAt DESC
      `);
      return (result as any[]);
    }),
});
