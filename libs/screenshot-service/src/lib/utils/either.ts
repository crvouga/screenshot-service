import { either } from 'fp-ts';

export const toAllLeft = <Left>(
  eitherList: either.Either<Left, unknown>[]
): Left[] => {
  return eitherList.flatMap(
    either.fold(
      (left) => [left],
      () => []
    )
  );
};

export const toAllRight = <Right>(
  eitherList: either.Either<unknown, Right>[]
): Right[] => {
  return eitherList.flatMap(
    either.fold(
      () => [],
      (right) => [right]
    )
  );
};
