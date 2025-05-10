import { z } from 'zod';

// Zod schema for Link
export const linkSchema = z.object({
  title: z.string().min(1, "Link title is required"),
  description: z.string().min(1, "Link description is required"),
  url: z.string().url("Invalid URL"),
});

// Zod schema for Attachment
export const attachmentSchema = z.object({
  title: z.string().min(1, "Attachment title is required"),
  url: z.string().url("Invalid URL"),
});

// Main Zod schema for Event Assignment
export const eventAssignmentSchema = z.object({
  event: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid MongoDB ObjectId"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  submissionDeadline: z.coerce.date(), // accepts string/Date and coerces
  leadOnly:z.boolean(),
  form:z.string(),
  links: z.array(linkSchema).optional(),
  attachements: z.array(attachmentSchema).optional(),
});
