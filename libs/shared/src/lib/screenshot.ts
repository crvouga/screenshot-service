import { encode as toBase64 } from 'js-base64';

type ICastResult<T> =
  | { type: 'success'; data: T }
  | { type: 'error'; errors: { message: string }[] };

export const resultToErrors = <T>(result: ICastResult<T>) => {
  return result.type === 'error' ? result.errors : [];
};

/**
 *
 *
 *
 */

export const validateTargetUrl = (
  url: unknown,
  options?: { name?: string }
) => {
  const name = options?.name ?? 'url';

  if (typeof url !== 'string') {
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

export type ITargetUrl = string & { type: 'ITargetUrl' };

export const castTargetUrl = (
  url: unknown,
  name: string = 'targetUrl'
): ICastResult<ITargetUrl> => {
  const errors = validateTargetUrl(url, { name });

  if (errors.length === 0) {
    return {
      type: 'success',
      data: url as ITargetUrl,
    };
  }

  return {
    type: 'error',
    errors,
  };
};

/**
 *
 *
 *
 */

export const validateTimeoutMs = (
  timeoutMs: unknown,
  options?: { name?: string }
) => {
  const name = options?.name ?? 'timeout';

  const errors = [];

  if (!timeoutMs) {
    errors.push({
      message: `${name} can not be undefined`,
    });
  }

  if (isNaN(Number(timeoutMs))) {
    errors.push({
      message: `${name} must be a valid number`,
    });
  }

  if (Number(timeoutMs) < 0) {
    errors.push({
      message: `${name} must be a greater than 0`,
    });
  }

  if (Number(timeoutMs) > 10000) {
    errors.push({
      message: `${name} must be a less than 10,000`,
    });
  }

  return errors;
};

export type ITimeoutMs = number & { type: 'ITimeoutMs' };

export const castTimeoutMs = (
  timeoutMs: unknown,
  name: string = 'timeoutMs'
): ICastResult<ITimeoutMs> => {
  const errors = validateTimeoutMs(timeoutMs, { name });

  if (errors.length === 0) {
    return {
      type: 'success',
      data: Number(timeoutMs) as ITimeoutMs,
    };
  }

  return {
    type: 'error',
    errors,
  };
};

/**
 *
 *
 *
 */

export const validateMaxAgeMs = (
  timeoutMs: unknown,
  options?: { name?: string }
) => {
  const name = options?.name ?? 'maxAgeMs';

  const errors = [];

  if (!timeoutMs) {
    errors.push({
      message: `${name} can not be undefined`,
    });
  }

  if (isNaN(Number(timeoutMs))) {
    errors.push({
      message: `${name} must be a valid number`,
    });
  }

  if (Number(timeoutMs) < 0) {
    errors.push({
      message: `${name} must be a greater than 0`,
    });
  }

  return errors;
};

export type IMaxAgeMs = number & { type: 'IMaxAgeMs' };

export const castMaxAgeMs = (
  maxAgeMs: unknown,
  name = 'maxAgeMs'
): ICastResult<IMaxAgeMs> => {
  const maxAgeMsElseDefault = maxAgeMs || Infinity;

  const errors = validateMaxAgeMs(maxAgeMsElseDefault, { name });

  if (errors.length === 0) {
    return {
      type: 'success',
      data: Number(maxAgeMsElseDefault) as IMaxAgeMs,
    };
  }

  return {
    type: 'error',
    errors,
  };
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
  if (typeof imageType !== 'string') {
    return [
      {
        message: `${name} must be a string`,
      },
    ];
  }

  if (imageType === 'png' || imageType === 'jpeg') {
    return [];
  }

  return [
    {
      message: `${name} must equal 'png' or 'jpeg'`,
    },
  ];
};

export type IImageType = 'jpeg' | 'png';

export const castImageType = (
  imageType: unknown,
  name = 'imageType'
): ICastResult<IImageType> => {
  const errors = validateImageType(imageType, { name });

  if (errors.length === 0) {
    return {
      type: 'success',
      data: imageType as IImageType,
    };
  }

  return {
    type: 'error',
    errors,
  };
};

/**
 *
 *
 *
 *
 *
 */

export const BUCKET_NAME = 'screenshots';

export const toFilename = ({
  imageType,
  screenshotId,
}: {
  imageType: IImageType;
  screenshotId: string;
}) => {
  return `${screenshotId}.${imageType}`;
};
