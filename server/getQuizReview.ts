import { getDb } from './db';
import { quizAttempts, quizQuestions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function getQuizReview(attemptId: number) {
  const db = (await getDb())!;
  if (!db) throw new Error('Database not available');

  // Fetch the attempt
  const attempts = await db.select()
    .from(quizAttempts)
    .where(eq(quizAttempts.id, attemptId))
    .limit(1);

  if (attempts.length === 0) {
    throw new Error('Quiz attempt not found');
  }

  const attempt = attempts[0];

  // courseId is nullable on the attempt row, but every lookup below is keyed by
  // it, so fail loudly rather than querying with null.
  if (attempt.courseId == null) {
    throw new Error('Quiz attempt is not linked to a course');
  }
  const courseId = attempt.courseId;

  // Fetch the questions for this quiz
  const questions = await db.select()
    .from(quizQuestions)
    .where(eq(quizQuestions.courseId, courseId));

  // Parse user answers
  const userAnswers = typeof attempt.answers === 'string' 
    ? JSON.parse(attempt.answers) 
    : attempt.answers;

  // Calculate correct answers count
  let correctAnswers = 0;
  questions.forEach((q, index) => {
    if (userAnswers[index] === q.correctAnswer) {
      correctAnswers++;
    }
  });

  // Get course title from static data
  const courseNames: Record<number, string> = {
    1: 'Grassroots Coaching Certificate',
    2: 'UEFA/FIFA C License',
    3: 'UEFA/FIFA B License',
    4: 'UEFA/FIFA A License',
    5: 'UEFA Pro / FIFA Pro License'
  };

  return {
    attempt: {
      ...attempt,
      courseTitle: courseNames[courseId] || 'Coaching Certificate',
      correctAnswers
    },
    questions,
    userAnswers
  };
}
