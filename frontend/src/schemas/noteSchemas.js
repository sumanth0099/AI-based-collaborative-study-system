// src/schemas/noteSchemas.js
import { z } from 'zod';

const IMPORTANCE_VALUES = ['high', 'medium', 'low'];

// Word count helper
const maxWords = (max) =>
  z.string().refine(
    (val) => val.trim().split(/\s+/).filter(Boolean).length <= max,
    { message: `Content must not exceed ${max} words` }
  );

export const createNoteSchema = z.object({
  name: z.string().min(1, 'Note name is required').max(100, 'Name too long'),
  subject: z.string().min(1, 'Subject is required').max(100),
  topic: z.string().min(1, 'Topic is required').max(100),
  content: z
    .string()
    .min(1, 'Content is required')
    .and(maxWords(700)),
  topicImportance: z.enum(IMPORTANCE_VALUES, {
    errorMap: () => ({ message: 'Select high, medium, or low' }),
  }),
  tags: z.array(z.string()).optional().default([]),
  groupId: z.string().optional(),
});

export const updateNoteSchema = createNoteSchema.partial();
