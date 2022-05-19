import { v4, validate } from 'uuid';

export type Uuid = string & { type: 'Uuid' };

export const isUuid = (id: unknown): id is Uuid => {
  return typeof id === 'string' && validate(id);
};

export const generateUuid = (): Uuid => {
  return v4() as Uuid;
};
