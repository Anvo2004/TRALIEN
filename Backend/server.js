const mongoose = require("mongoose");
const config = require("./src/config");
const app = require("./src/app");
const catDienService = require("./src/services/catDienService");
const vanBanService = require("./src/services/vanBanTraLienService");
const newsScrapeService = require("./src/services/newsScrapeService");
const zaloNewsService = require("./src/services/zaloNewsService");
const newsCardService = require("./src/services/newsCardService");
const { startCgy1022Retry } = require("./src/services/cgy1022RetryService");
const { startCgy1022StatusPolling } = require("./src/services/cgy1022StatusService");

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("[server] MongoDB connected");

  app.listen(config.port, () => {
    console.log(`[server] Listening on port ${config.port}`);
  });

  catDienService.startAutoSync();
  vanBanService.startAutoSync();
  newsScrapeService.startAutoSync();
  zaloNewsService.startAutoPost();
  newsCardService.startAutoSend();
  startCgy1022Retry();
  startCgy1022StatusPolling();
}

main().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
