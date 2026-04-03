import { z } from "zod";
import { recordTypes, roles } from "./types.js";

const isoDateRefinement = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Invalid date. Use an ISO-8601 compatible value.",
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  password: z.string().min(6).max(72),
  role: z.enum(["viewer", "analyst"]).default("viewer"),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  password: z.string().min(6).max(72),
  role: z.enum(roles),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z.email().optional(),
    password: z.string().min(6).max(72).optional(),
    role: z.enum(roles).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const createRecordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(recordTypes),
  category: z.string().trim().min(2).max(60),
  date: isoDateRefinement,
  notes: z.string().trim().max(250).optional().default(""),
});

export const updateRecordSchema = z
  .object({
    amount: z.number().positive().optional(),
    type: z.enum(recordTypes).optional(),
    category: z.string().trim().min(2).max(60).optional(),
    date: isoDateRefinement.optional(),
    notes: z.string().trim().max(250).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const recordQuerySchema = z.object({
  type: z.enum(recordTypes).optional(),
  category: z.string().trim().min(1).optional(),
  fromDate: isoDateRefinement.optional(),
  toDate: isoDateRefinement.optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});
