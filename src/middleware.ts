import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { AppError, isAppError } from "./errors.js";
import { hasRequiredRole, verifyToken } from "./auth.js";
import type { FinanceDatabase } from "./db.js";
import type { AuthenticatedUser, Role } from "./types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAuth(db: FinanceDatabase, jwtSecret: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      next(new AppError(401, "Authorization header with Bearer token is required."));
      return;
    }

    const token = header.replace("Bearer ", "");
    const payload = verifyToken(jwtSecret, token);
    const user = db.findUserById(payload.sub);

    if (!user) {
      next(new AppError(401, "User linked to this token no longer exists."));
      return;
    }

    if (user.status !== "active") {
      next(new AppError(403, "Inactive users cannot access the API."));
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    next();
  };
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, "Authentication is required."));
      return;
    }

    if (!hasRequiredRole(req.user.role, allowedRoles)) {
      next(new AppError(403, "You do not have permission to perform this action."));
      return;
    }

    next();
  };
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "Route not found."));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed.",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (isAppError(error)) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details ?? null,
    });
    return;
  }

  res.status(500).json({
    error: "Internal server error.",
  });
}
