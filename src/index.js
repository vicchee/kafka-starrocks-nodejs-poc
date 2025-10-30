const express = require("express");
const startWagersCron = require("./cron/send-wagers");
const fs = require("fs");
const path = require("path");
const { logger } = require("./common/logger");

const ENABLE_CRON = process.env.ENABLE_CRON === "1";
const ENABLE_WAGERS_CRON = process.env.ENABLE_WAGERS_CRON === "1";
const PORT = process.env.PORT || 8089;

const app = express();
app.use(express.json());

// mount API routes dynamically
const apiDir = path.resolve(__dirname, "api");
fs.readdirSync(apiDir).forEach((feature) => {
  const routesPath = path.join(apiDir, feature, "routes.js");
  if (!fs.existsSync(routesPath)) {
    return;
  }

  const router = require(routesPath);
  app.use("/api", router);
  logger.info({ feature }, "Mounted /api routes");
});

// start server
app.listen(PORT, () => logger.info({ port: PORT }, "Server started"));

// start cron jobs if enabled
(async function startCrons() {
  if (!ENABLE_CRON) {
    return;
  }
  if (ENABLE_WAGERS_CRON) {
    await startWagersCron();
  }
})();
