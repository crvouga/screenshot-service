import { main } from './app/main';

const defaultPort = 8000;

const getPort = (): number => {
  const port =
    Number(process.env.PORT) ?? Number(process.env.port) ?? defaultPort;

  if (isNaN(port)) {
    return defaultPort;
  }

  return port;
};

main({ port: getPort() });
