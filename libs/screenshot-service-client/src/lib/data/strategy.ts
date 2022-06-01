import { either } from 'fp-ts';

export type Strategy = 'cache-first' | 'network-first';

export const is = (value: unknown): value is Strategy => {
  return (
    typeof value === 'string' &&
    (value === 'cache-first' || value === 'network-first')
  );
};

export const decode = either.fromPredicate(
  is,
  () => new Error('failed to decode strategy')
);
