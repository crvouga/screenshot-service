import { isOnWhitelist } from "../server/security";
import { createPuppeteerBrowser } from "./puppeteer";
import { ITargetUrl } from "./target-url";
import { ITimeout } from "./timeout";

const setTimeoutPromise = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

//run on heroku: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-heroku

export const createGetScreenshot = async () => {
  const browser = await createPuppeteerBrowser();

  const getScreenshot = async ({
    timeout,
    targetUrl,
    whitelist,
  }: {
    whitelist: string[];
    timeout: ITimeout;
    targetUrl: ITargetUrl;
  }): Promise<{
    image?: Buffer | string | void;
    errors: {
      [key: string]: any;
    }[];
  }> => {
    if (isOnWhitelist(whitelist, targetUrl)) {
      return {
        errors: [
          {
            message:
              "To prevent infinte loops the targetUrl is not allowed to be on the whitelist when getting screenshots.",
            whitelist,
            targetUrl,
          },
        ],
      };
    }

    try {
      console.log(`START GET ${targetUrl}`);

      const page = await browser.newPage();

      await page.goto(targetUrl, {
        waitUntil: "networkidle2",
      });

      console.log(`DONE GET ${targetUrl}`);

      console.log(`START WAIT ${targetUrl}`);

      await setTimeoutPromise(timeout);

      console.log(`DONE WAIT ${targetUrl}`);

      console.log(`START SCREENSHOT ${targetUrl}`);

      const image = await page.screenshot({
        type: "png",
      });

      console.log(`DONE SCREENSHOT ${targetUrl}`);

      return {
        image,
        errors: [],
      };
    } catch (error) {
      //@ts-ignore
      const message = error?.toString?.();

      console.log(`ERROR ${targetUrl} ${message}`);

      return {
        errors: [
          {
            message,
          },
        ],
      };
    }
  };

  return getScreenshot;
};
