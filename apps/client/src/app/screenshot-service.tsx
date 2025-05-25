import * as ScreenshotService from '@screenshot-service/screenshot-service';
import { environment } from '../environments/environment';
import { getServerBaseUrl } from '@screenshot-service/shared-core';

const config = {
  socketConfig: {
    serverBaseUrl: getServerBaseUrl({
      isServerSide: false,
      isProd: environment.production,
    }),
  },
};

export const screenshotService = ScreenshotService.makeClient(config);
