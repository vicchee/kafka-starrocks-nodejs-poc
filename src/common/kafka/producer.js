const kafka = require("./client");
const producer = kafka.producer();

const net = require("net");
const BROKERS = (process.env.KAFKA_BROKERS || "kafka:9092").split(",");

async function waitForKafka(host, port, delay = 5000) {
  while (true) {
    try {
      await new Promise((resolve, reject) => {
        const socket = net.connect(port, host, () => {
          socket.end();
          resolve();
        });
        socket.on("error", () => reject());
      });
      console.log(`Kafka is up at ${host}:${port}`);
      return;
    } catch (_) {
      console.log(`Waiting for Kafka at ${host}:${port}...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/**
 * Initialize Kafka producer: wait for broker, then ready to send
 */
async function initKafkaProducer() {
  for (const broker of BROKERS) {
    const [host, port] = broker.split(":");
    await waitForKafka(host, parseInt(port, 10));
  }
  console.log("Kafka producer ready.");
}

async function sendToKafka(topic, messages = []) {
  await producer.connect();
  try {
    for (const msg of messages) {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(msg) }],
      });
    }
  } finally {
    await producer.disconnect();
  }
}

module.exports = { initKafkaProducer, sendToKafka };
