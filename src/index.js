const express = require("express");
const startWagersCron = require("./cron/send-wagers");
const fs = require("fs");
const path = require("path");
const ENABLE_CRON = process.env.ENABLE_CRON;
const ENABLE_WAGERS_CRON = process.env.ENABLE_WAGERS_CRON;

const app = express();
app.use(express.json());

const apiDir = path.join(__dirname, "api");

fs.readdirSync(apiDir).forEach((feature) => {
  const routesPath = path.join(apiDir, feature, "routes.js");
  if (fs.existsSync(routesPath)) {
    const router = require(routesPath);
    app.use(`/api`, router);
    console.log(`Mounted /api for ${feature}`);
  }
});

const PORT = process.env.PORT || 8089;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

(async function main() {
  // Start all cron jobs
  if (ENABLE_CRON === "1") {
    if (ENABLE_WAGERS_CRON === "1") {
      startWagersCron();
    }
  }
})();
