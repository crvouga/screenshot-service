/**
 *
 *
 *
 */

export const validateTargetUrl = (
  url: unknown,
  options?: { name?: string }
) => {
  const name = options?.name ?? "url";

  if (typeof url !== "string") {
    return [
      {
        message: `${name} is invalid`,
      },
    ];
  }

  try {
    new URL(url);

    return [];
  } catch (error) {
    return [
      {
        message: `${name} is invalid`,
      },
    ];
  }
};

export type ITargetUrl = string & { type: "ITargetUrl" };

export const castTargetUrl = (url: unknown) => {
  const errors = validateTargetUrl(url);

  if (errors.length > 0) {
    throw new Error("failed to cast target url");
  }

  return url as ITargetUrl;
};

/**
 *
 *
 *
 */

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

/**
 *
 *
 *
 */

export const validateImageType = (
  imageType: unknown,
  { name }: { name: string }
) => {
  if (typeof imageType !== "string") {
    return [
      {
        message: `${name} must be a string`,
      },
    ];
  }

  if (imageType === "png" || imageType == "jpeg") {
    return [];
  }

  return [
    {
      message: `{name} must equal 'png' or 'jpeg'`,
    },
  ];
};

export type IImageType = "jpeg" | "png";

export const castImageType = (url: unknown) => {
  const errors = validateImageType(url, { name: "image type" });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return url as IImageType;
};
