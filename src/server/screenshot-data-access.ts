import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { IImageType, ITargetUrl, ITimeoutMs } from "../shared/screenshot-data";
// import { firebaseAdminApp } from "./firebase";

// const screenshotsBucket = firebaseAdminApp.storage().bucket("screenshots");

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

export const fetchScreenshot = async (
  browser: puppeteer.Browser,
  {
    timeoutMs,
    targetUrl,
    imageType,
  }: {
    imageType: IImageType;
    timeoutMs: ITimeoutMs;
    targetUrl: ITargetUrl;
  }
): Promise<IFetchScreenshotResult> => {
  const page = await browser.newPage();

  try {
    await page.goto(targetUrl, {
      waitUntil: "networkidle2",
    });

    await setTimeoutPromise(timeoutMs);

    const data = await page.screenshot({
      type: imageType,
    });

    if (typeof data !== "string" && !data) {
      return {
        type: "error",
        errors: [
          {
            message: "puppeteer did not return an image",
          },
        ],
      };
    }

    await fs.writeFileSync(path.join(__dirname, "test.txt"), "test");
    console.log({ path: path.join(__dirname, "test.txt") });

    return {
      type: "success",
      image: {
        type: imageType,
        data,
      },
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
  } finally {
    await page.close();
  }
};

export const createPuppeteerBrowser = async () => {
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
