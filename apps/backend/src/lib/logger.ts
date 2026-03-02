import { pino } from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Use pino-pretty only in development; raw JSON in production for log aggregation
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        // Production: structured JSON with timestamp
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
  },
});

export default logger;
