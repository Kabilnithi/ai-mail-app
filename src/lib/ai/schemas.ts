import { z } from "zod";

export const fillComposeSchema = z.object({
  to: z.array(z.string().email()).optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
});

export const searchEmailsSchema = z.object({
  query: z.string(),
});

export const filterEmailsSchema = z.object({
  unread: z.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sender: z.string().optional(),
  keyword: z.string().optional(),
});

export const openEmailSchema = z.object({
  emailId: z.string(),
});

export const navigateToViewSchema = z.object({
  view: z.enum(["inbox", "sent", "email-detail"]),
});
