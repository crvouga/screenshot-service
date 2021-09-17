import puppeteer from "puppeteer";

export const createPuppeteerBrowser = async () => {
  const browser = await puppeteer.launch({
    args: [
      "--hide-scrollbars",
      "--disable-web-security",
      "--incognito",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],

    headless: true,
    ignoreHTTPSErrors: true,
  });

  return browser;
};
