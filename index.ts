import { createApp } from "./app/app";

const runApp = async () => {
  const app = await createApp();

  const port = process.env.PORT || 8000;

  app.listen(port, () => {
    console.log(`App is run http://localhost:${port}/`);
  });
};

runApp();
