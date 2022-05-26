import { createClient } from '@crvouga/screenshot-service';
import { environment } from '../environments/environment';

const devServerBaseUrl = 'http://localhost:8000';

export const screenshotClient = createClient({
  overrides: environment.production ? {} : { baseUrl: devServerBaseUrl },
});
