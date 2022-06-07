import { either, eq } from 'fp-ts';
import * as Uuid from './uuid';

export type ProjectId = Uuid.Uuid & { tag: 'IProjectId' };

export const is = (value: unknown): value is ProjectId => Uuid.is(value);

export const decode = either.fromPredicate(is, () => ({
  message: 'failed to decode project id',
}));

export const Eq = eq.fromEquals<ProjectId>((a, b) => a === b);
