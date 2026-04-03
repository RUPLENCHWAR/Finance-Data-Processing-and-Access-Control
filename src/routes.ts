import express from "express";
import { authenticateUser } from "./auth.js";
import type { FinanceDatabase } from "./db.js";
import { authorize, requireAuth, validateBody } from "./middleware.js";
import {
  createRecordSchema,
  createUserSchema,
  loginSchema,
  recordQuerySchema,
  registerSchema,
  updateRecordSchema,
  updateUserSchema,
} from "./schemas.js";

export function createRouter(db: FinanceDatabase, jwtSecret: string) {
  const router = express.Router();
  const authRequired = requireAuth(db, jwtSecret);

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.post("/auth/login", validateBody(loginSchema), (req, res) => {
    const { email, password } = req.body;
    const result = authenticateUser(db, jwtSecret, email, password);
    res.json(result);
  });

  router.post("/auth/register", validateBody(registerSchema), (req, res) => {
    const { name, email, password, role } = req.body;
    db.createUser({
      name,
      email,
      password,
      role,
      status: "active",
    });

    const result = authenticateUser(db, jwtSecret, email, password);
    res.status(201).json(result);
  });

  router.get("/auth/me", authRequired, (req, res) => {
    res.json({ user: req.user });
  });

  router.get("/users", authRequired, authorize("admin"), (_req, res) => {
    res.json({ data: db.listUsers() });
  });

  router.post("/users", authRequired, authorize("admin"), validateBody(createUserSchema), (req, res) => {
    const user = db.createUser(req.body);
    res.status(201).json({ data: user });
  });

  router.patch("/users/:id", authRequired, authorize("admin"), validateBody(updateUserSchema), (req, res) => {
    const user = db.updateUser(Number(req.params.id), req.body);
    res.json({ data: user });
  });

  router.get(
    "/records",
    authRequired,
    authorize("analyst", "admin"),
    (req, res) => {
      const filters = recordQuerySchema.parse(req.query);
      const result = db.listRecords(filters);
      res.json(result);
    },
  );

  router.get("/records/:id", authRequired, authorize("analyst", "admin"), (req, res) => {
    const record = db.getRecordById(Number(req.params.id));
    res.json({ data: record });
  });

  router.post("/records", authRequired, authorize("admin"), validateBody(createRecordSchema), (req, res) => {
    const record = db.createRecord({
      ...req.body,
      createdBy: req.user!.id,
    });
    res.status(201).json({ data: record });
  });

  router.patch("/records/:id", authRequired, authorize("admin"), validateBody(updateRecordSchema), (req, res) => {
    const record = db.updateRecord(Number(req.params.id), req.body);
    res.json({ data: record });
  });

  router.delete("/records/:id", authRequired, authorize("admin"), (req, res) => {
    db.deleteRecord(Number(req.params.id));
    res.status(204).send();
  });

  router.get("/dashboard/summary", authRequired, authorize("viewer", "analyst", "admin"), (_req, res) => {
    res.json({ data: db.getSummary() });
  });

  return router;
}
