import { createClient } from '@crvouga/screenshot-service';
import { environment } from '../environments/environment';

export const screenshotClient = createClient({
  url: environment.production ? '' : environment.devServerBaseUrl,
});
