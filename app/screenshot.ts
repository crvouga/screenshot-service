import puppeteer from "puppeteer";
import { ITargetUrl } from "./target-url";
import { ITimeout } from "./timeout";

const setTimeoutPromise = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

export const createGetScreenshot = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });

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
    try {
      const page = await browser.newPage();

      await page.goto(targetUrl, {
        waitUntil: "networkidle2",
      });

      await setTimeoutPromise(timeout);

      const image = await page.screenshot({
        type: "png",
      });

      return {
        image,
        errors: [],
      };
    } catch (error) {
      //@ts-ignore
      const message = error?.toString?.();

      return {
        errors: [{ message }],
      };
    }
  };
};
