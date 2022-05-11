import { IImageType, ITargetUrl, ITimeoutMs } from '@screenshot-service/shared';
import puppeteer from 'puppeteer';
import { IScreenshotData } from './types';

type GetResult =
  | {
      type: 'success';
      updatedAtMs: number;
      data: IScreenshotData;
      imageType: IImageType;
    }
  | { type: 'error'; errors: [{ message: string }] };

export const get = async (
  browser: puppeteer.Browser,
  {
    imageType,
    timeoutMs,
    targetUrl,
  }: {
    targetUrl: ITargetUrl;
    timeoutMs: ITimeoutMs;
    imageType: IImageType;
  }
): Promise<GetResult> => {
  const page = await browser.newPage();

  try {
    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
    });

    await setTimeoutPromise(timeoutMs);

    const screenshotData = await page.screenshot({
      type: imageType,
    });

    if (typeof screenshotData !== 'string' && !screenshotData) {
      return {
        type: 'error',
        errors: [
          {
            message: 'puppeteer did not return an image',
          },
        ],
      };
    }

    return {
      type: 'success',
      updatedAtMs: Date.now(),
      imageType: imageType,
      data: screenshotData,
    };
  } catch (error) {
    const message = String(error?.toString?.() ?? 'puppeteer threw an error');

    return {
      type: 'error',
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
      '--autoplay-policy=user-gesture-required',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-domain-reliability',
      '--disable-extensions',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-speech-api',
      '--disable-sync',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--single-process',
      '--password-store=basic',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
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
