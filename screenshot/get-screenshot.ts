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
  imageType,
}: {
  imageType: "png" | "jpeg";
  browser: Browser;
  timeout: ITimeout;
  targetUrl: ITargetUrl;
}): Promise<{
  image?: {
    type: "png" | "jpeg";
    data: Buffer | string | void;
  };
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

    const data = await page.screenshot({
      type: imageType,
    });

    return {
      image: {
        data,
        type: imageType,
      },
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
