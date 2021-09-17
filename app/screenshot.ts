import puppeteer from "puppeteer";
import { ITargetUrl } from "./target-url";
import { ITimeout } from "./timeout";

const setTimeoutPromise = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

//run on heroku: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-heroku

export const createGetScreenshot = async () => {
  console.log("started launching puppeteer browser");

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
      "--incognito",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  console.log("done launching puppeteer browser");

  return async ({
    timeout,
    targetUrl,
  }: {
    timeout: ITimeout;
    targetUrl: ITargetUrl;
  }): Promise<{
    image?: Buffer | string | void;
    errors: {
      message: string;
    }[];
  }> => {
    console.log("started getting screenshot");

    try {
      console.log("started new page");

      const page = await browser.newPage();

      console.log("done new page");

      console.log(`started goto ${targetUrl}`);

      await page.goto(targetUrl, {
        waitUntil: "networkidle2",
      });

      console.log("done goto");

      console.log(`started to wait ${timeout}ms`);

      await setTimeoutPromise(timeout);

      console.log(`done waiting`);

      console.log(`started screenshot`);

      const image = await page.screenshot({
        type: "png",
      });

      console.log(`done screenshot`);

      return {
        image,
        errors: [],
      };
    } catch (error) {
      //@ts-ignore
      const message = error?.toString?.();

      return {
        errors: [
          {
            message,
          },
        ],
      };
    }
  };
};
