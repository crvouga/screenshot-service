import { either } from 'fp-ts';

export type LogLevel = 'info' | 'notice' | 'warn' | 'error';

export const logLevels = new Set(['info', 'notice', 'warn', 'error']);

export const is = (value: unknown): value is LogLevel =>
  typeof value === 'string' && logLevels.has(value);

export const deocode = either.fromPredicate(is, () => ({
  message: 'failed to decode log level',
}));
