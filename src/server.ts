import { getConfig } from "./config.js";
import { createApp } from "./app.js";

const config = getConfig();
const { app } = createApp(config.databasePath);

app.listen(config.port, () => {
  console.log(`Finance dashboard backend running on port ${config.port}`);
});
