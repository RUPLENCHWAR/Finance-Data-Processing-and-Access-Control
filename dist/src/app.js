"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const node_path_1 = __importDefault(require("node:path"));
const config_js_1 = require("./config.js");
const db_js_1 = require("./db.js");
const middleware_js_1 = require("./middleware.js");
const routes_js_1 = require("./routes.js");
function createApp(databasePath = (0, config_js_1.getConfig)().databasePath) {
    const config = (0, config_js_1.getConfig)();
    const db = new db_js_1.FinanceDatabase(databasePath);
    db.seed();
    const publicDir = node_path_1.default.join(process.cwd(), "public");
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use((0, morgan_1.default)("dev"));
    app.use("/api", (0, routes_js_1.createRouter)(db, config.jwtSecret));
    app.use(express_1.default.static(publicDir));
    app.get(/^\/(?!api).*/, (_req, res) => {
        res.sendFile(node_path_1.default.join(publicDir, "index.html"));
    });
    app.use(middleware_js_1.notFoundHandler);
    app.use(middleware_js_1.errorHandler);
    return { app, db };
}
