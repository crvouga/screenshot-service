import { v4, validate } from 'uuid';

export type Uuid = string & { type: 'Uuid' };

export const is = (id: unknown): id is Uuid => {
  return typeof id === 'string' && validate(id);
};

export const generate = (): Uuid => {
  return v4() as Uuid;
};
