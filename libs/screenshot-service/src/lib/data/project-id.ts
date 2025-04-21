import { makeDecode } from './result';
import * as Uuid from './uuid';

export type ProjectId = Uuid.Uuid & { tag: 'IProjectId' };

export const is = (value: unknown): value is ProjectId =>
  typeof value === 'string';

export const decode = makeDecode(is, () => ({
  message: 'failed to decode project id',
}));
