import { Browser } from "puppeteer";
import { ITargetUrl } from "./target-url";
import { ITimeout } from "./timeout";

const setTimeoutPromise = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

export const getScreenshot = async ({
  browser,
  timeout,
  targetUrl,
}: {
  browser: Browser;
  timeout: ITimeout;
  targetUrl: ITargetUrl;
}): Promise<{
  image?: Buffer | string | void;
  errors: {
    [key: string]: any;
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
      errors: [
        {
          message,
        },
      ],
    };
  }
};
