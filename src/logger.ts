import * as winston from "winston";

export const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.align(),
        winston.format.printf((log) => {
            return `${log.timestamp} | ${log.level}: ${log.message}`;
        }),
    ),

    transports: [
        new winston.transports.Console(),
    ],
});
