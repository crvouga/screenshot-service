export type Url = string & { type: 'Url' };

export const isUrl = (url: unknown): url is Url => {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
