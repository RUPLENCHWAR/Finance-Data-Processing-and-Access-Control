"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordQuerySchema = exports.updateRecordSchema = exports.createRecordSchema = exports.updateUserSchema = exports.createUserSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const types_js_1 = require("./types.js");
const isoDateRefinement = zod_1.z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date. Use an ISO-8601 compatible value.",
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6),
});
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(80),
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6).max(72),
    role: zod_1.z.enum(["viewer", "analyst"]).default("viewer"),
});
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(80),
    email: zod_1.z.email(),
    password: zod_1.z.string().min(6).max(72),
    role: zod_1.z.enum(types_js_1.roles),
    status: zod_1.z.enum(["active", "inactive"]).default("active"),
});
exports.updateUserSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(2).max(80).optional(),
    email: zod_1.z.email().optional(),
    password: zod_1.z.string().min(6).max(72).optional(),
    role: zod_1.z.enum(types_js_1.roles).optional(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
});
exports.createRecordSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    type: zod_1.z.enum(types_js_1.recordTypes),
    category: zod_1.z.string().trim().min(2).max(60),
    date: isoDateRefinement,
    notes: zod_1.z.string().trim().max(250).optional().default(""),
});
exports.updateRecordSchema = zod_1.z
    .object({
    amount: zod_1.z.number().positive().optional(),
    type: zod_1.z.enum(types_js_1.recordTypes).optional(),
    category: zod_1.z.string().trim().min(2).max(60).optional(),
    date: isoDateRefinement.optional(),
    notes: zod_1.z.string().trim().max(250).optional(),
})
    .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
});
exports.recordQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(types_js_1.recordTypes).optional(),
    category: zod_1.z.string().trim().min(1).optional(),
    fromDate: isoDateRefinement.optional(),
    toDate: isoDateRefinement.optional(),
    search: zod_1.z.string().trim().min(1).optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(10),
});
