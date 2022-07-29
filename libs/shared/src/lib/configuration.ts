export const configuration = {
  MAX_DAILY_CAPTURE_SCREENSHOT_REQUESTS: 1000,
  MAX_PROJECT_COUNT: 3,
};

export const CAPTURE_SCREENSHOT_RATE_LIMIT_ERROR_MESSAGE = `Daily request limit has been reached. A max of ${configuration.MAX_DAILY_CAPTURE_SCREENSHOT_REQUESTS} capture screenshot requests are allowed.`;
