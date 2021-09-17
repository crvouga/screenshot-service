export const importPuppeteer = async () => {
  const isRunningOnVercel = Boolean(process.env.AWS_LAMBDA_FUNCTION_VERSION);

  if (isRunningOnVercel) {
    console.log("using production puppeteer");

    const { default: chrome } = await import("chrome-aws-lambda");
    const { default: puppeteer } = await import("puppeteer-core");
    return {
      chrome,
      puppeteer,
    };
  }

  console.log("using development puppeteer");
  const { default: puppeteer } = await import("puppeteer");
  return {
    puppeteer,
  };
};

export const getPuppeteerBrowser = async () => {
  const { chrome, puppeteer } = await importPuppeteer();

  const browser = await puppeteer.launch({
    args: [
      ...(chrome ? chrome.args : []),
      "--hide-scrollbars",
      "--disable-web-security",
      "--incognito",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
    executablePath: await chrome?.executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  });

  return browser;
};
