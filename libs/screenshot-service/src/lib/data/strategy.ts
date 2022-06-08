import { makeDecode } from './result';

export type Strategy = 'cache-first' | 'network-first';

export const is = (value: unknown): value is Strategy => {
  return (
    typeof value === 'string' &&
    (value === 'cache-first' || value === 'network-first')
  );
};

export const decode = makeDecode(is, () => ({
  message: 'failed to decode strategy',
}));
