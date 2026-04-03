"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("./config.js");
const app_js_1 = require("./app.js");
const config = (0, config_js_1.getConfig)();
const { app } = (0, app_js_1.createApp)(config.databasePath);
app.listen(config.port, () => {
    console.log(`Finance dashboard backend running on port ${config.port}`);
});
