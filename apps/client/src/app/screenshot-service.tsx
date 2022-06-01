import { Client } from '@crvouga/screenshot-service';
import { environment } from '../environments/environment';

const devServerBaseUrl = 'http://localhost:8000';

const config = environment.production
  ? {}
  : {
      overrides: { baseUrl: devServerBaseUrl },
    };

export const screenshotClient = Client.create(config);
