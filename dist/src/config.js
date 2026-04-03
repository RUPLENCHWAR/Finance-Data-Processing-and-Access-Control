"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
const node_path_1 = __importDefault(require("node:path"));
function getConfig() {
    return {
        port: Number(process.env.PORT ?? 3000),
        jwtSecret: process.env.JWT_SECRET ?? "finance-dashboard-dev-secret",
        databasePath: process.env.DATABASE_PATH ??
            node_path_1.default.join(process.cwd(), "data", "finance-dashboard.sqlite"),
    };
}
