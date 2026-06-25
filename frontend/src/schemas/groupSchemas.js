// src/schemas/groupSchemas.js
import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(80, 'Group name too long'),
  description: z.string().max(500, 'Description too long').optional().default(''),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isPrivate: z.boolean().default(false),
});

export const updateGroupSchema = createGroupSchema.partial();
