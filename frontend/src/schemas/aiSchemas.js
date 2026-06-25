// src/schemas/aiSchemas.js
import { z } from 'zod';

export const quizSubmitSchema = z.object({
  noteId: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.string().optional(),
  totalQuestions: z.number().int().positive(),
  answers: z.array(
    z.object({
      selectedAnswer: z.string(),
      correctAnswer: z.string(),
    })
  ),
});

export const aiChatSchema = z.object({
  question: z.string().min(2, 'Please type a question').max(500, 'Question too long'),
});
