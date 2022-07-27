export type Result<TError, TValue> = Err<TError> | Ok<TValue>;

export type Err<TError> = { type: 'Err'; error: TError };

export type Ok<TValue> = { type: 'Ok'; value: TValue };

export const isErr = <TError, TValue>(
  result: Result<TError, TValue>
): result is Err<TError> => {
  return result.type === 'Err';
};

export const Err = <TError>(error: TError): Err<TError> => ({
  type: 'Err',
  error,
});

export const Ok = <TValue>(value: TValue): Ok<TValue> => ({
  type: 'Ok',
  value,
});

export const isOk = <TError, TValue>(
  result: Result<TError, TValue>
): result is Ok<TValue> => {
  return result.type === 'Ok';
};

export const fold = <TError, TValue, T>(
  result: Result<TError, TValue>,
  err: (error: TError) => T,
  ok: (value: TValue) => T
): T => {
  if (isOk(result)) {
    return ok(result.value);
  }

  return err(result.error);
};

export const toValues = <TValue>(
  results: Result<unknown, TValue>[]
): TValue[] => {
  return results.flatMap((result) =>
    fold(
      result,
      () => [],
      (value) => [value]
    )
  );
};

export const toErrors = <TError>(
  results: Result<TError, unknown>[]
): TError[] => {
  return results.flatMap((result) =>
    fold(
      result,
      (error) => [error],
      () => []
    )
  );
};

export const makeDecode =
  <TError, TValue>(
    predicate: (value: unknown) => value is TValue,
    err: () => TError
  ) =>
  (value: unknown): Result<TError, TValue> => {
    if (predicate(value)) {
      return Ok(value);
    }

    return Err(err());
  };

export const combineValues = <TError, TValue>(
  results: Result<TError, TValue>[]
): Result<TError, TValue[]> => {
  return results.reduce<Result<TError, TValue[]>>((y, x) => {
    if (isErr(y)) {
      return y;
    }

    if (isOk(x)) {
      return Ok([...y.value, x.value]);
    }

    return x;
  }, Ok([]));
};

export const mapErr = <TError, TValue, A>(
  mapper: (error: TError) => A,
  result: Result<TError, TValue>
): Result<A, TValue> => {
  if (isOk(result)) {
    return result;
  }

  return Err(mapper(result.error));
};

export const mapOk = <TError, TValue, A>(
  mapper: (error: TValue) => A,
  result: Result<TError, TValue>
): Result<TError, A> => {
  if (isErr(result)) {
    return result;
  }

  return Ok(mapper(result.value));
};
