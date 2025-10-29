const cron = require("node-cron");
const {
  generateFixedWager,
  generateNewWager,
} = require("../utils/fake-data-generator");
const { sendToKafka, initKafkaProducer } = require("../common/kafka/producer");

const TOPIC = process.env.KAFKA_WAGERS_TOPIC || "get-wagers-topic";
const CRON_SCHEDULE = process.env.WAGERS_CRON || "* * * * *";

async function startWagersCron() {
  try {
    await initKafkaProducer();
    console.log("Starting wagers cron job...");

    cron.schedule(CRON_SCHEDULE, async () => {
      try {
        const oldWagerWithNewUpdatedAt = generateFixedWager();
        const newWager = generateNewWager();
        await sendToKafka(TOPIC, [oldWagerWithNewUpdatedAt, newWager]);
        // console.log(
        //   "Producing wager to Kafka...",
        //   oldWagerWithNewUpdatedAt,
        //   newWager
        // );
      } catch (err) {
        console.error("Kafka producer error:", err);
      }
    });
  } catch (err) {
    console.error("Failed to initialize Kafka producer:", err);
    process.exit(1);
  }
}

module.exports = startWagersCron;
