const kafka = require("./client");
const producerClient = kafka.producer();
const net = require("net");
const { logger } = require("../logger");

const BROKERS = (process.env.KAFKA_BROKERS || "kafka:9092").split(",");

/**
 * Wait until a host:port is reachable
 */
async function waitForBroker(host, port, delay = 5000) {
  while (true) {
    try {
      await new Promise((resolve, reject) => {
        const socket = net.connect(port, host, () => {
          socket.end();
          resolve();
        });
        socket.on("error", reject);
      });
      logger.info({ host, port }, "Broker reachable");
      return;
    } catch {
      logger.warn({ host, port }, `Waiting for broker... retry in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function waitForBrokers() {
  for (const broker of BROKERS) {
    const [host, port] = broker.split(":");
    await waitForBroker(host, parseInt(port, 10));
  }
}

const producer = {
  /**
   * Connect the producer after waiting for brokers
   */
  init: async () => {
    await waitForBrokers();
    await producerClient.connect();
    logger.info("Kafka producer connected");
  },

  /**
   * Send messages to a topic
   * @param {string} topic
   * @param {Array<any>} messages
   */
  send: async (topic, messages = []) => {
    if (!messages.length) {
      return;
    }
    try {
      const kafkaMessages = messages.map((msg) => ({
        value: JSON.stringify(msg),
      }));
      await producerClient.send({ topic, messages: kafkaMessages });
      logger.info({ topic, count: messages.length }, "Messages sent to Kafka");
    } catch (err) {
      logger.error(err, "Failed to send messages to Kafka");
      throw err;
    }
  },

  /**
   * Disconnect the producer
   */
  close: async () => {
    await producerClient.disconnect();
    logger.info("Kafka producer disconnected");
  },
};

module.exports = { producer };
