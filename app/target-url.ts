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
