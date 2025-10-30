const pino = require("pino");

const IS_DEV = process.env.NODE_ENV !== "production";
const LOG_LEVEL = process.env.LOG_LEVEL || (IS_DEV ? "debug" : "info");

const logger = pino({
  level: LOG_LEVEL,
  transport: IS_DEV
    ? {
        target: "pino-pretty", // pretty print for local dev
        options: {
          colorize: true,
          translateTime: "yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

module.exports = logger;
