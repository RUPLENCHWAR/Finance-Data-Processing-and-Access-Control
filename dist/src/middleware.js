"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.requireAuth = requireAuth;
exports.authorize = authorize;
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const errors_js_1 = require("./errors.js");
const auth_js_1 = require("./auth.js");
function validateBody(schema) {
    return (req, _res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
function requireAuth(db, jwtSecret) {
    return (req, _res, next) => {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            next(new errors_js_1.AppError(401, "Authorization header with Bearer token is required."));
            return;
        }
        const token = header.replace("Bearer ", "");
        const payload = (0, auth_js_1.verifyToken)(jwtSecret, token);
        const user = db.findUserById(payload.sub);
        if (!user) {
            next(new errors_js_1.AppError(401, "User linked to this token no longer exists."));
            return;
        }
        if (user.status !== "active") {
            next(new errors_js_1.AppError(403, "Inactive users cannot access the API."));
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
function authorize(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            next(new errors_js_1.AppError(401, "Authentication is required."));
            return;
        }
        if (!(0, auth_js_1.hasRequiredRole)(req.user.role, allowedRoles)) {
            next(new errors_js_1.AppError(403, "You do not have permission to perform this action."));
            return;
        }
        next();
    };
}
function notFoundHandler(_req, _res, next) {
    next(new errors_js_1.AppError(404, "Route not found."));
}
function errorHandler(error, _req, res, _next) {
    if (error instanceof zod_1.ZodError) {
        res.status(400).json({
            error: "Validation failed.",
            details: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }
    if ((0, errors_js_1.isAppError)(error)) {
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
