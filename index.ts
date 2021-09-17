import { createServer } from "./server/create-server";

const run = async () => {
  const server = await createServer();

  const port = process.env.PORT || 8000;

  server.listen(port, () => {
    console.log(`App is running on http://localhost:${port}/`);
  });
};

run();
