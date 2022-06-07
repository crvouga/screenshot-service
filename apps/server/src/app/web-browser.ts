import { Data } from '@screenshot-service/screenshot-service';
import { either } from 'fp-ts';
import puppeteer, { Browser } from 'puppeteer';

//
//
//
//
//
//

export type WebBrowser = puppeteer.Browser;

//
//
//
//
//
//

export const openNewPage = async (browser: puppeteer.Browser) => {
  const page = await browser.newPage();
  return page;
};

export const goTo = async (page: puppeteer.Page, url: Data.Url.Url) => {
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
    });
    return either.right([]);
  } catch (error) {
    const message =
      error?.toString?.() ??
      'Web browser failed to navigate to url for an unknown reason';

    return either.left([{ message }]);
  }
};

export const captureScreenshot = async (
  page: puppeteer.Page,
  imageType: Data.ImageType.ImageType
): Promise<either.Either<Error[], Buffer>> => {
  try {
    const buffer = await page.screenshot({
      type: imageType,
    });

    if (typeof buffer === 'string' || !buffer) {
      return either.left([
        new Error(
          'puppeteer did not return a buffer when capturing the screenshot'
        ),
      ]);
    }

    return either.right(buffer);
  } catch (error) {
    const message = String(
      error?.toString?.() ?? 'puppeteer threw an unkwown error'
    );

    return either.left([new Error(message)]);
  }
};

//
//
//
//
//
//
//

let browser: Browser | null = null;

export const create = async () => {
  //
  if (browser) {
    return browser;
  }

  browser = await puppeteer.launch({
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
