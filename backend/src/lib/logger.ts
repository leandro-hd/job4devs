import pino from 'pino';
import { config } from '../config';

export const logger = pino(
  config.nodeEnv === 'production'
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true } } }
);
