import puppeteer from "puppeteer";
import { IImageType, ITargetUrl, ITimeoutMs } from "./screenshot-data";

type IFetchScreenshotResult =
  | {
      type: "success";
      image: {
        type: IImageType;
        data: Buffer | string;
      };
    }
  | {
      type: "error";
      errors: {
        message: string;
      }[];
    };

export const fetchScreenshot = async ({
  timeoutMs,
  targetUrl,
  imageType,
}: {
  imageType: IImageType;
  timeoutMs: ITimeoutMs;
  targetUrl: ITargetUrl;
}): Promise<IFetchScreenshotResult> => {
  try {
    const browser = await createBrowser();

    const page = await browser.newPage();

    await page.goto(targetUrl, {
      waitUntil: "networkidle2",
    });

    await setTimeoutPromise(timeoutMs);

    const data = await page.screenshot({
      type: imageType,
    });

    if (data) {
      return {
        type: "success",
        image: {
          type: imageType,
          data,
        },
      };
    }

    return {
      type: "error",
      errors: [
        {
          message: "puppeteer did not return an image",
        },
      ],
    };
  } catch (error) {
    const message = String(
      (error as any)?.toString?.() ?? "puppeteer threw an error"
    );

    return {
      type: "error",
      errors: [
        {
          message,
        },
      ],
    };
  }
};

export const createBrowser = async () => {
  const browser = await puppeteer.launch({
    //why?: https://www.bannerbear.com/blog/ways-to-speed-up-puppeteer-screenshots/
    args: [
      "--autoplay-policy=user-gesture-required",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-client-side-phishing-detection",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      "--disable-domain-reliability",
      "--disable-extensions",
      "--disable-features=AudioServiceOutOfProcess",
      "--disable-hang-monitor",
      "--disable-ipc-flooding-protection",
      "--disable-notifications",
      "--disable-offer-store-unmasked-wallet-cards",
      "--disable-popup-blocking",
      "--disable-print-preview",
      "--disable-prompt-on-repost",
      "--disable-renderer-backgrounding",
      "--disable-setuid-sandbox",
      "--disable-speech-api",
      "--disable-sync",
      "--hide-scrollbars",
      "--ignore-gpu-blacklist",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      "--no-pings",
      "--no-sandbox",
      "--no-zygote",
      "--password-store=basic",
      "--use-gl=swiftshader",
      "--use-mock-keychain",
    ],

    headless: true,
    ignoreHTTPSErrors: true,
  });

  return browser;
};

const setTimeoutPromise = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};
