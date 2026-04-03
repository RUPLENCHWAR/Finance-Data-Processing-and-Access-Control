import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { AppError } from "./errors.js";
import type { PaginationResult, Role, UserStatus } from "./types.js";

export interface DbUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbRecord {
  id: number;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecordFilters {
  type?: "income" | "expense";
  category?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface SummaryResponse {
  totals: {
    income: number;
    expenses: number;
    netBalance: number;
  };
  categoryBreakdown: Array<{
    category: string;
    type: "income" | "expense";
    total: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    netBalance: number;
  }>;
  recentActivity: DbRecord[];
}

export class FinanceDatabase {
  private readonly db: Database.Database;

  constructor(databasePath: string) {
    if (databasePath !== ":memory:") {
      fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    }

    this.db = new Database(databasePath);
    this.db.pragma("foreign_keys = ON");
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('viewer', 'analyst', 'admin')),
        status TEXT NOT NULL CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS financial_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL CHECK(amount > 0),
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        created_by INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT
      );
    `);
  }

  seed(): void {
    const count = this.db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    if (count.count > 0) {
      return;
    }

    const now = new Date().toISOString();
    const insertUser = this.db.prepare(`
      INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
      VALUES (@name, @email, @passwordHash, @role, @status, @createdAt, @updatedAt)
    `);

    const users = [
      {
        name: "Admin User",
        email: "admin@financedash.local",
        passwordHash: bcrypt.hashSync("Admin@123", 10),
        role: "admin",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ] as const;

    const transaction = this.db.transaction(() => {
      for (const user of users) {
        insertUser.run(user);
      }
    });

    transaction();
  }

  listUsers(): Omit<DbUser, "passwordHash">[] {
    return this.db
      .prepare(`
        SELECT id, name, email, role, status, created_at as createdAt, updated_at as updatedAt
        FROM users
        ORDER BY id ASC
      `)
      .all() as Omit<DbUser, "passwordHash">[];
  }

  createUser(input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    status: UserStatus;
  }): Omit<DbUser, "passwordHash"> {
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(input.password, 10);

    try {
      const result = this.db
        .prepare(`
          INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
          VALUES (@name, @email, @passwordHash, @role, @status, @createdAt, @updatedAt)
        `)
        .run({
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
          role: input.role,
          status: input.status,
          createdAt: now,
          updatedAt: now,
        });

      return this.getUserById(result.lastInsertRowid as number);
    } catch (error) {
      if (String(error).includes("UNIQUE")) {
        throw new AppError(409, "A user with this email already exists.");
      }
      throw error;
    }
  }

  updateUser(
    id: number,
    input: Partial<{
      name: string;
      email: string;
      password: string;
      role: Role;
      status: UserStatus;
    }>,
  ): Omit<DbUser, "passwordHash"> {
    const existing = this.findUserById(id);
    if (!existing) {
      throw new AppError(404, "User not found.");
    }

    const next = {
      name: input.name ?? existing.name,
      email: input.email?.toLowerCase() ?? existing.email,
      passwordHash: input.password ? bcrypt.hashSync(input.password, 10) : existing.passwordHash,
      role: input.role ?? existing.role,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };

    try {
      this.db
        .prepare(`
          UPDATE users
          SET name = @name,
              email = @email,
              password_hash = @passwordHash,
              role = @role,
              status = @status,
              updated_at = @updatedAt
          WHERE id = @id
        `)
        .run({ id, ...next });

      return this.getUserById(id);
    } catch (error) {
      if (String(error).includes("UNIQUE")) {
        throw new AppError(409, "A user with this email already exists.");
      }
      throw error;
    }
  }

  getUserById(id: number): Omit<DbUser, "passwordHash"> {
    const user = this.db
      .prepare(`
        SELECT id, name, email, role, status, created_at as createdAt, updated_at as updatedAt
        FROM users
        WHERE id = ?
      `)
      .get(id) as Omit<DbUser, "passwordHash"> | undefined;

    if (!user) {
      throw new AppError(404, "User not found.");
    }

    return user;
  }

  findUserById(id: number): DbUser | undefined {
    return this.db
      .prepare(`
        SELECT id, name, email, role, status, password_hash as passwordHash, created_at as createdAt, updated_at as updatedAt
        FROM users
        WHERE id = ?
      `)
      .get(id) as DbUser | undefined;
  }

  findUserByEmail(email: string): DbUser | undefined {
    return this.db
      .prepare(`
        SELECT id, name, email, role, status, password_hash as passwordHash, created_at as createdAt, updated_at as updatedAt
        FROM users
        WHERE lower(email) = lower(?)
      `)
      .get(email) as DbUser | undefined;
  }

  createRecord(input: {
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
    notes: string;
    createdBy: number;
  }): DbRecord {
    const now = new Date().toISOString();
    const result = this.db
      .prepare(`
        INSERT INTO financial_records (amount, type, category, date, notes, created_by, created_at, updated_at)
        VALUES (@amount, @type, @category, @date, @notes, @createdBy, @createdAt, @updatedAt)
      `)
      .run({ ...input, createdAt: now, updatedAt: now });

    return this.getRecordById(result.lastInsertRowid as number);
  }

  updateRecord(
    id: number,
    input: Partial<{
      amount: number;
      type: "income" | "expense";
      category: string;
      date: string;
      notes: string;
    }>,
  ): DbRecord {
    const existing = this.findRecordById(id);
    if (!existing) {
      throw new AppError(404, "Financial record not found.");
    }

    this.db
      .prepare(`
        UPDATE financial_records
        SET amount = @amount,
            type = @type,
            category = @category,
            date = @date,
            notes = @notes,
            updated_at = @updatedAt
        WHERE id = @id
      `)
      .run({
        id,
        amount: input.amount ?? existing.amount,
        type: input.type ?? existing.type,
        category: input.category ?? existing.category,
        date: input.date ?? existing.date,
        notes: input.notes ?? existing.notes,
        updatedAt: new Date().toISOString(),
      });

    return this.getRecordById(id);
  }

  deleteRecord(id: number): void {
    const result = this.db.prepare("DELETE FROM financial_records WHERE id = ?").run(id);
    if (result.changes === 0) {
      throw new AppError(404, "Financial record not found.");
    }
  }

  getRecordById(id: number): DbRecord {
    const record = this.findRecordById(id);
    if (!record) {
      throw new AppError(404, "Financial record not found.");
    }
    return record;
  }

  findRecordById(id: number): DbRecord | undefined {
    return this.db
      .prepare(`
        SELECT id, amount, type, category, date, notes, created_by as createdBy, created_at as createdAt, updated_at as updatedAt
        FROM financial_records
        WHERE id = ?
      `)
      .get(id) as DbRecord | undefined;
  }

  listRecords(filters: RecordFilters): PaginationResult<DbRecord> {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (filters.type) {
      conditions.push("type = @type");
      params.type = filters.type;
    }
    if (filters.category) {
      conditions.push("lower(category) = lower(@category)");
      params.category = filters.category;
    }
    if (filters.fromDate) {
      conditions.push("date >= @fromDate");
      params.fromDate = filters.fromDate;
    }
    if (filters.toDate) {
      conditions.push("date <= @toDate");
      params.toDate = filters.toDate;
    }
    if (filters.search) {
      conditions.push("(lower(category) LIKE lower(@search) OR lower(notes) LIKE lower(@search))");
      params.search = `%${filters.search}%`;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const totalRow = this.db
      .prepare(`SELECT COUNT(*) as total FROM financial_records ${whereClause}`)
      .get(params) as { total: number };

    const offset = (filters.page - 1) * filters.pageSize;
    const rows = this.db
      .prepare(`
        SELECT id, amount, type, category, date, notes, created_by as createdBy, created_at as createdAt, updated_at as updatedAt
        FROM financial_records
        ${whereClause}
        ORDER BY date DESC, id DESC
        LIMIT @limit OFFSET @offset
      `)
      .all({ ...params, limit: filters.pageSize, offset }) as DbRecord[];

    return {
      data: rows,
      meta: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: totalRow.total,
        totalPages: Math.max(1, Math.ceil(totalRow.total / filters.pageSize)),
      },
    };
  }

  getSummary(): SummaryResponse {
    const totals = this.db
      .prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as expenses
        FROM financial_records
      `)
      .get() as { income: number; expenses: number };

    const categoryBreakdown = this.db
      .prepare(`
        SELECT category, type, ROUND(SUM(amount), 2) as total
        FROM financial_records
        GROUP BY category, type
        ORDER BY total DESC, category ASC
      `)
      .all() as SummaryResponse["categoryBreakdown"];

    const monthlyRows = this.db
      .prepare(`
        SELECT
          substr(date, 1, 7) as month,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as expenses
        FROM financial_records
        GROUP BY substr(date, 1, 7)
        ORDER BY month ASC
      `)
      .all() as Array<{ month: string; income: number; expenses: number }>;

    const recentActivity = this.db
      .prepare(`
        SELECT id, amount, type, category, date, notes, created_by as createdBy, created_at as createdAt, updated_at as updatedAt
        FROM financial_records
        ORDER BY date DESC, id DESC
        LIMIT 5
      `)
      .all() as DbRecord[];

    return {
      totals: {
        income: Number(totals.income.toFixed(2)),
        expenses: Number(totals.expenses.toFixed(2)),
        netBalance: Number((totals.income - totals.expenses).toFixed(2)),
      },
      categoryBreakdown,
      monthlyTrend: monthlyRows.map((row) => ({
        ...row,
        income: Number(row.income.toFixed(2)),
        expenses: Number(row.expenses.toFixed(2)),
        netBalance: Number((row.income - row.expenses).toFixed(2)),
      })),
      recentActivity,
    };
  }

  close(): void {
    this.db.close();
  }
}
