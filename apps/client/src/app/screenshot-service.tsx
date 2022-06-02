import { Client } from '@crvouga/screenshot-service';
import { useEffect, useState } from 'react';
import { environment } from '../environments/environment';

const devServerBaseUrl = 'http://localhost:8000';

const clientConfig = environment.production
  ? {}
  : { overrides: { baseUrl: devServerBaseUrl } };

export const screenshotClient = Client.create(clientConfig);

export const useScreenshotClient = () => {
  const [state, setState] = useState(screenshotClient.getState);

  useEffect(() => {
    screenshotClient.subscribe(() => {
      setState(screenshotClient.getState);
    });
  }, []);

  return {
    state,
    dispatch: screenshotClient.dispatch,
  };
};
