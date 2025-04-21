import { IncomingMessage } from 'http';

export const getBaseUrl = (req?: IncomingMessage | undefined): string => {
  if (!req) {
    throw new Error('Request is required');
  }

  const origin = req.headers.origin;

  if (origin) {
    // Ensure origin is a valid URL
    try {
      new URL(origin);
      return origin;
    } catch {
      // If origin is not a valid URL, fall back to host
    }
  }

  const host = req.headers.host;

  if (host) {
    try {
      const url = new URL(`http://${host}`);
      return url.origin;
    } catch {
      // If host is not a valid URL, fall back to host
    }
  }

  throw new Error('Could not determine request origin');
};
