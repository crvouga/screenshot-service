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
