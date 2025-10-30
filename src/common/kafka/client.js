const { Kafka, logLevel } = require("kafkajs");
const { logger } = require("../logger");

const logLevelToPino = (level) => {
  switch (level) {
    case logLevel.NOTHING: // NOTHING
      return null; // skip
    case logLevel.ERROR: // ERROR
      return "error";
    case logLevel.WARN: // WARN
      return "warn";
    case logLevel.INFO: // INFO
      return "info";
    case logLevel.DEBUG: // DEBUG
      return "debug";
    default:
      return "info";
  }
};

/**
 * KafkaJS logCreator that sends all internal Kafka logs to Pino
 */
const kafkaLogger =
  (logLevel) =>
  ({ namespace, level, label, log }) => {
    const pinoLevel = logLevelToPino(level);
    if (!pinoLevel) {
      return;
    } // skip if NOTHING

    logger[pinoLevel]({
      namespace,
      label,
      ...log,
    });
  };

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "app-producer",
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["kafka:9092"],
  logCreator: () => kafkaLogger,
});

module.exports = kafka;
