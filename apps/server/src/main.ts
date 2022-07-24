import { main } from './app/main';

const fallbackPort = 8000;

const getPort = (): number => {
  const port =
    Number(process.env.PORT) ?? Number(process.env.port) ?? fallbackPort;

  if (isNaN(port)) {
    return fallbackPort;
  }

  return port;
};

main({
  port: getPort(),
});
