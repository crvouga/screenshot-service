import { Configuration } from './data-access/configuration/interface';

export const toRateLimitErrorMessage = (configuration: Configuration) =>
  `Daily request limit has been reached. A max of ${configuration.maxDailyRequests} capture screenshot requests are allowed.`;
