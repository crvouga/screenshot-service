import { generateUuid, isUuid, Uuid } from './utils';

/**
 *
 *
 *
 */

type IResult<T> =
  | { type: 'success'; data: T }
  | { type: 'error'; errors: { message: string }[] };

export const resultToErrors = <T>(result: IResult<T>) => {
  return result.type === 'error' ? result.errors : [];
};

/**
 *
 *
 *
 */

export type IRequestId = Uuid & { tag: 'IRequestId' };

export const generateRequestId = () => {
  return generateUuid() as IRequestId;
};

export const castRequestId = (id: unknown): IResult<IRequestId> => {
  if (isUuid(id)) {
    return {
      type: 'success',
      data: id as IRequestId,
    };
  }

  return {
    type: 'error',
    errors: [{ message: 'request id must be a valid uuid' }],
  };
};

/**
 *
 *
 *
 */

export type IStrategy = 'cache-first' | 'network-first';

export const isStrategy = (strategy: unknown): strategy is IStrategy => {
  return (
    typeof strategy === 'string' &&
    (strategy === 'cache-first' || strategy === 'network-first')
  );
};

export const castStrategy = (strategy: unknown): IResult<IStrategy> => {
  if (isStrategy(strategy)) {
    return {
      type: 'success',
      data: strategy,
    };
  }

  return {
    type: 'error',
    errors: [{ message: `invalid strategy: ${String(strategy)}` }],
  };
};

/**
 *
 *
 *
 */

export type IProjectId = Uuid & { tag: 'IProjectId' };

export const castProjectId = (id: unknown): IResult<IProjectId> => {
  if (isUuid(id)) {
    return {
      type: 'success',
      data: id as IProjectId,
    };
  }

  return {
    type: 'error',
    errors: [{ message: 'projectIs is not a uuid' }],
  };
};

/**
 *
 *
 *
 */

export type IScreenshotId = Uuid & { tag: 'IScreenshotId' };

export const castScreenshotId = (id: unknown): IResult<IScreenshotId> => {
  if (isUuid(id)) {
    return {
      type: 'success',
      data: id as IScreenshotId,
    };
  }

  return {
    type: 'error',
    errors: [{ message: 'screenshot id is not a uuid' }],
  };
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
  name = 'targetUrl'
): IResult<ITargetUrl> => {
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

export const validateDelaySec = (
  delaySecUnknown: unknown,
  options?: { name?: string }
) => {
  const name = options?.name ?? 'delaySec';

  const errors = [];

  if (typeof delaySecUnknown !== 'number') {
    errors.push({
      message: `${name} mus be a number`,
    });
  }

  const delaySec = Number(delaySecUnknown);

  if (isNaN(delaySec)) {
    errors.push({
      message: `${name} must be a valid number`,
    });
  }

  if (delaySec < 0) {
    errors.push({
      message: `${name} must be greater than or equal to 0`,
    });
  }

  if (delaySec > 10) {
    errors.push({
      message: `${name} must be less than or equal to 10`,
    });
  }

  if (Math.floor(delaySec) !== delaySec) {
    errors.push({
      message: `${name} must be an integer`,
    });
  }

  return errors;
};

export type IDelaySec = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const isDelaySec = (delaySec: unknown): delaySec is IDelaySec => {
  return (
    delaySec === 0 ||
    delaySec === 1 ||
    delaySec === 2 ||
    delaySec === 3 ||
    delaySec === 4 ||
    delaySec === 5 ||
    delaySec === 6 ||
    delaySec === 7 ||
    delaySec === 8 ||
    delaySec === 9 ||
    delaySec === 10
  );
};

export const All_DELAY_SEC: IDelaySec[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const toDelaySec = (sec: number): IDelaySec => {
  const delaySec = Math.max(0, Math.min(10, Math.trunc(sec)));
  if (isDelaySec(delaySec)) {
    return delaySec;
  }
  return 0;
};

export const castDelaySec = (
  delaySec: unknown,
  name = 'delaySec'
): IResult<IDelaySec> => {
  const errors = validateDelaySec(delaySec, { name });

  if (errors.length > 0) {
    return {
      type: 'error',
      errors,
    };
  }

  const num = Number(delaySec);

  if (isDelaySec(num)) {
    return {
      type: 'success',
      data: num,
    };
  }

  return {
    type: 'error',
    errors: [{ message: `delaySec is invalid: ${num} is a ${typeof num}` }],
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
): IResult<IMaxAgeMs> => {
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
): IResult<IImageType> => {
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

/**
 *
 *
 *
 *
 */
