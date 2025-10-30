const cron = require("node-cron");
const {
  generateFixedWager,
  generateNewWager,
} = require("../utils/fake-data-generator");
const { producer } = require("../common/kafka");
const { logger } = require("../common/logger");

const TOPIC = process.env.KAFKA_WAGERS_TOPIC || "get-wagers-topic";
const CRON_SCHEDULE = process.env.WAGERS_CRON || "* * * * *";

async function startWagersCron() {
  try {
    await producer.init();
    logger.info("Starting wagers cron...");

    const shutdown = async () => {
      logger.info("Shutting down wagers cron...");
      await producer.close();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    cron.schedule(CRON_SCHEDULE, async () => {
      try {
        const oldWager = generateFixedWager();
        const newWager = generateNewWager();
        await producer.send(TOPIC, [oldWager, newWager]);
        logger.debug({ oldWager, newWager }, "Produced wagers to Kafka");
      } catch (err) {
        logger.error(err, "Kafka producer error during cron execution");
      }
    });
  } catch (err) {
    logger.error(err, "Failed to initialize Kafka producer");
    process.exit(1);
  }
}

module.exports = startWagersCron;
