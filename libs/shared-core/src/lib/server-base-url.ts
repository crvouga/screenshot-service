const SERVER_BASE_URL_LOCAL = 'http://localhost:8000';
const SERVER_BASE_URL_PROD_FOR_CLIENT = '';
const SERVER_BASE_URL_PROD_FOR_SERVER =
  'https://screenshotservice.chrisvouga.dev';

export const getServerBaseUrl = (input: {
  isServerSide: boolean;
  isProd: boolean;
}) => {
  if (!input.isProd) return SERVER_BASE_URL_LOCAL;
  if (input.isServerSide) return SERVER_BASE_URL_PROD_FOR_SERVER;
  return SERVER_BASE_URL_PROD_FOR_CLIENT;
};
