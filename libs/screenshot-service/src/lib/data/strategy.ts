import { makeDecode } from './result';

export type Strategy = 'CacheFirst' | 'NetworkFirst';

export const is = (value: unknown): value is Strategy => {
  return (
    typeof value === 'string' &&
    (value === 'CacheFirst' || value === 'NetworkFirst')
  );
};

export const decode = makeDecode(is, () => ({
  message: 'failed to decode strategy',
}));
