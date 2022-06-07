import { either } from 'fp-ts';

export type ProjectName = string & { type: 'ProjectName' };

const MAX_NAME_LENGTH = 100;

export const is = (value: unknown): value is ProjectName => {
  return typeof value === 'string' && value.length <= MAX_NAME_LENGTH;
};

export const decode = either.fromPredicate(is, () => ({
  message: 'failed to decode project name',
}));

export const fromString = (value: string): ProjectName => {
  const projectName = value.slice(0, MAX_NAME_LENGTH);

  if (is(projectName)) {
    return projectName;
  }

  throw new Error(
    'project name from string function is implemented incorrectly'
  );
};
