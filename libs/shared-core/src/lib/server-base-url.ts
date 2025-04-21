const SERVER_BASE_URL_DEV = 'http://localhost:8000';
const SERVER_BASE_URL_PROD = '';
export const getServerBaseUrl = ({ prod }: { prod: boolean }) => {
  return prod ? SERVER_BASE_URL_PROD : SERVER_BASE_URL_DEV;
};
