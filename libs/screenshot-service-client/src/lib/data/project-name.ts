import { either } from 'fp-ts';

export type ProjectName = string & { type: 'ProjectName' };

const MAX_NAME_LENGTH = 100;

export const is = (value: unknown): value is ProjectName => {
  return typeof value === 'string' && value.length < MAX_NAME_LENGTH;
};

export const decode = either.fromPredicate(
  is,
  () => new Error('failed to decode project name')
);
