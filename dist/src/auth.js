"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = authenticateUser;
exports.verifyToken = verifyToken;
exports.hasRequiredRole = hasRequiredRole;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_js_1 = require("./errors.js");
function authenticateUser(db, jwtSecret, email, password) {
    const user = db.findUserByEmail(email);
    if (!user || !bcryptjs_1.default.compareSync(password, user.passwordHash)) {
        throw new errors_js_1.AppError(401, "Invalid email or password.");
    }
    if (user.status !== "active") {
        throw new errors_js_1.AppError(403, "This user is inactive and cannot sign in.");
    }
    const payload = {
        sub: user.id,
        role: user.role,
        email: user.email,
    };
    const token = jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: "8h" });
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
function verifyToken(jwtSecret, token) {
    try {
        return jsonwebtoken_1.default.verify(token, jwtSecret);
    }
    catch {
        throw new errors_js_1.AppError(401, "Invalid or expired token.");
    }
}
function hasRequiredRole(userRole, allowedRoles) {
    return allowedRoles.includes(userRole);
}
