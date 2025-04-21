const FALLBACK_PORT = 8000;

export const getPort = (): number => {
  const port =
    Number(process.env.PORT) ?? Number(process.env.port) ?? FALLBACK_PORT;

  if (isNaN(port)) {
    return FALLBACK_PORT;
  }

  return port;
};
