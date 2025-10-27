const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "app-producer",
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["kafka:9092"],
});

module.exports = kafka;
