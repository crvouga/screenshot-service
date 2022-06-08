// docs: https://github.com/tiaanduplessis/kill-port
import killPort from 'kill-port';
import { main } from './app/main';

const runMain = async () => {
  const port = getPort();

  try {
    await killPort(port);
  } finally {
    main({
      port,
    });
  }
};

const fallbackPort = 8000;

const getPort = (): number => {
  const port =
    Number(process.env.PORT) ?? Number(process.env.port) ?? fallbackPort;

  if (isNaN(port)) {
    return fallbackPort;
  }

  return port;
};

runMain();
