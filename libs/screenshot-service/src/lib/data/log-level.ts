import { makeDecode } from './result';

export type LogLevel = 'info' | 'notice' | 'warn' | 'error';

export const logLevels = new Set(['info', 'notice', 'warn', 'error']);

export const is = (value: unknown): value is LogLevel =>
  typeof value === 'string' && logLevels.has(value);

export const deocode = makeDecode(is, () => ({
  message: 'failed to decode log level',
}));
