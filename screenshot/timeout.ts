export const validateTimeout = (
  timeout: unknown,
  options?: { name?: string }
) => {
  const name = options?.name ?? "timeout";

  const errors = [];

  if (!timeout) {
    errors.push({
      message: `${name} can not be undefined`,
    });
  }

  if (Number(timeout) === NaN) {
    errors.push({
      message: `${name} must be a valid number`,
    });
  }

  if (Number(timeout) < 0) {
    errors.push({
      message: `${name} must be a greater than 0`,
    });
  }

  if (Number(timeout) > 10000) {
    errors.push({
      message: `${name} must be a less than 10,000`,
    });
  }

  return errors;
};

export type ITimeout = number & { type: "ITimeout" };

export const castTimeout = (timeout: unknown) => {
  const errors = validateTimeout(timeout);

  if (errors.length > 0) {
    throw new Error("failed to cast timeout");
  }

  return timeout as ITimeout;
};
