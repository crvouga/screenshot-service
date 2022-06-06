import * as ScreenshotService from '@screenshot-service/screenshot-service';
import { environment } from '../environments/environment';

const devServerBaseUrl = 'http://localhost:8000';

const config = environment.production
  ? {}
  : { overrides: { serverBaseUrl: devServerBaseUrl } };

export const screenshotService = ScreenshotService.Client.create(config);
