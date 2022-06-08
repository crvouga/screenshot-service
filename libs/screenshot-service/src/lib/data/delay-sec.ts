import { makeDecode } from './result';

export type DelaySec = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const delaySecs: DelaySec[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const is = (value: unknown): value is DelaySec => {
  return delaySecs.some((delaySec) => delaySec === value);
};

export const decode = makeDecode(is, () => ({
  message: 'failed to decode delay sec',
}));

export const fromNumber = (value: number): DelaySec => {
  const clamped = Math.max(0, Math.min(10, Math.trunc(value)));

  if (is(clamped)) {
    return clamped;
  }

  return 0;
};
