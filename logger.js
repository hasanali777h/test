const express = require("express");
const app = express();
const { createLogger, format, transports } = require("winston");
const { combine, cli, colorize, errors, prettyPrint, printf, timestamp } = format;
const morgan = require("morgan");

const level = process.env.NODE_ENV === "development" ? "info" : "debug";
const logConfig = combine(
  colorize({
    all: true,
    color: cli({ colors: { info: "magenta", error: "red", warn: "yellow", debug: "green" } }),
  }),
  timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
  errors({ stack: true }),
  prettyPrint(),
  printf((info) => {
    return `[${info.timestamp}] [${info.level}]: ${info.message}`;
  }),
);

const log = createLogger({
  level: level,
  format: logConfig,
  transports: [new transports.Console()],
});

const stream = {
  write: (message) => log.http(message),
};

const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env !== "development";
};

const loggerMiddleware = morgan(
  ":remote-addr :method :url :status :res[content-length] - :response-time ms",
  { stream, skip },
);
app.use(loggerMiddleware);
module.exports = log;
