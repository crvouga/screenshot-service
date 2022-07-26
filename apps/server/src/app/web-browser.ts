import { Data } from '@screenshot-service/screenshot-service';
import puppeteer, { Browser } from 'puppeteer';

//
//
//
//
//
//

export type WebBrowser = puppeteer.Browser;

type Problem = { message: string };

//
//
//
//
//
//

export const openNewPage = async (
  browser: puppeteer.Browser
): Promise<Data.Result.Result<Problem, puppeteer.Page>> => {
  try {
    const page = await browser.newPage();
    return Data.Result.Ok(page);
  } catch (error) {
    return Data.Result.Err({
      message: 'Something went wrong when trying to open up a new web page',
    });
  }
};

export const goTo = async (
  page: puppeteer.Page,
  url: Data.Url.Url
): Promise<Data.Result.Result<Problem, null>> => {
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
    });
    return Data.Result.Ok(null);
  } catch (error) {
    const message =
      error?.toString?.() ??
      'Web browser failed to navigate to url for an unknown reason';

    return Data.Result.Err({ message });
  }
};

export const captureScreenshot = async (
  page: puppeteer.Page,
  imageType: Data.ImageType.ImageType
): Promise<Data.Result.Result<Problem[], Buffer>> => {
  try {
    const buffer = await page.screenshot({
      type: imageType,
    });

    if (typeof buffer === 'string' || !buffer) {
      return Data.Result.Err([
        new Error(
          'puppeteer did not return a buffer when capturing the screenshot'
        ),
      ]);
    }

    return Data.Result.Ok(buffer);
  } catch (error) {
    const message = String(
      error?.toString?.() ?? 'puppeteer threw an unkwown error'
    );

    return Data.Result.Err([{ message }]);
  }
};

//
//
//
//
//
//
//

export const create = async () => {
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
