import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "./errors.js";
import type { FinanceDatabase } from "./db.js";
import type { AuthenticatedUser, JwtPayload, Role } from "./types.js";

export function authenticateUser(
  db: FinanceDatabase,
  jwtSecret: string,
  email: string,
  password: string,
): { token: string; user: AuthenticatedUser } {
  const user = db.findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    throw new AppError(401, "Invalid email or password.");
  }

  if (user.status !== "active") {
    throw new AppError(403, "This user is inactive and cannot sign in.");
  }

  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
  };

  const token = jwt.sign(payload, jwtSecret, { expiresIn: "8h" });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
  };
}

export function verifyToken(jwtSecret: string, token: string): JwtPayload {
  try {
    return jwt.verify(token, jwtSecret) as unknown as JwtPayload;
  } catch {
    throw new AppError(401, "Invalid or expired token.");
  }
}

export function hasRequiredRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}
