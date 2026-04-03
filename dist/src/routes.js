"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = createRouter;
const express_1 = __importDefault(require("express"));
const auth_js_1 = require("./auth.js");
const middleware_js_1 = require("./middleware.js");
const schemas_js_1 = require("./schemas.js");
function createRouter(db, jwtSecret) {
    const router = express_1.default.Router();
    const authRequired = (0, middleware_js_1.requireAuth)(db, jwtSecret);
    router.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    router.post("/auth/login", (0, middleware_js_1.validateBody)(schemas_js_1.loginSchema), (req, res) => {
        const { email, password } = req.body;
        const result = (0, auth_js_1.authenticateUser)(db, jwtSecret, email, password);
        res.json(result);
    });
    router.post("/auth/register", (0, middleware_js_1.validateBody)(schemas_js_1.registerSchema), (req, res) => {
        const { name, email, password, role } = req.body;
        db.createUser({
            name,
            email,
            password,
            role,
            status: "active",
        });
        const result = (0, auth_js_1.authenticateUser)(db, jwtSecret, email, password);
        res.status(201).json(result);
    });
    router.get("/auth/me", authRequired, (req, res) => {
        res.json({ user: req.user });
    });
    router.get("/users", authRequired, (0, middleware_js_1.authorize)("admin"), (_req, res) => {
        res.json({ data: db.listUsers() });
    });
    router.post("/users", authRequired, (0, middleware_js_1.authorize)("admin"), (0, middleware_js_1.validateBody)(schemas_js_1.createUserSchema), (req, res) => {
        const user = db.createUser(req.body);
        res.status(201).json({ data: user });
    });
    router.patch("/users/:id", authRequired, (0, middleware_js_1.authorize)("admin"), (0, middleware_js_1.validateBody)(schemas_js_1.updateUserSchema), (req, res) => {
        const user = db.updateUser(Number(req.params.id), req.body);
        res.json({ data: user });
    });
    router.get("/records", authRequired, (0, middleware_js_1.authorize)("analyst", "admin"), (req, res) => {
        const filters = schemas_js_1.recordQuerySchema.parse(req.query);
        const result = db.listRecords(filters);
        res.json(result);
    });
    router.get("/records/:id", authRequired, (0, middleware_js_1.authorize)("analyst", "admin"), (req, res) => {
        const record = db.getRecordById(Number(req.params.id));
        res.json({ data: record });
    });
    router.post("/records", authRequired, (0, middleware_js_1.authorize)("admin"), (0, middleware_js_1.validateBody)(schemas_js_1.createRecordSchema), (req, res) => {
        const record = db.createRecord({
            ...req.body,
            createdBy: req.user.id,
        });
        res.status(201).json({ data: record });
    });
    router.patch("/records/:id", authRequired, (0, middleware_js_1.authorize)("admin"), (0, middleware_js_1.validateBody)(schemas_js_1.updateRecordSchema), (req, res) => {
        const record = db.updateRecord(Number(req.params.id), req.body);
        res.json({ data: record });
    });
    router.delete("/records/:id", authRequired, (0, middleware_js_1.authorize)("admin"), (req, res) => {
        db.deleteRecord(Number(req.params.id));
        res.status(204).send();
    });
    router.get("/dashboard/summary", authRequired, (0, middleware_js_1.authorize)("viewer", "analyst", "admin"), (_req, res) => {
        res.json({ data: db.getSummary() });
    });
    return router;
}
