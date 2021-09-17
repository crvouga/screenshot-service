export const getWhitelist = async () => {
  const urlWhiteListCsv = process.env.URL_WHITELIST_CSV;

  return urlWhiteListCsv?.split(", ") ?? [];
};

const toHostname = (maybeUrl: string) => {
  try {
    return new URL(maybeUrl).hostname;
  } catch (_error) {
    return maybeUrl;
  }
};

export const isOnWhitelist = (whitelist: string[], item: string) => {
  return whitelist.some((whitelistedItem) => {
    return toHostname(whitelistedItem) === toHostname(item);
  });
};
