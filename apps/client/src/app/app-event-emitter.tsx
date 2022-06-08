import EventEmitter from 'events';
import { useEffect } from 'react';
import { IEventEmitter } from '../lib/event-emitter';
import { Profile } from './profiles';

export type IAppEvent = {
  ToggleCaptureScreenshotFormDrawer: 'opened' | 'closed';
  Profile: { profile: Profile };
};

export const appEventEmitter: IEventEmitter<IAppEvent> = new EventEmitter();

export const useAppEventListener = <Key extends keyof IAppEvent>(
  key: Key,
  handler: (payload: IAppEvent[Key]) => void
) => {
  useEffect(() => {
    appEventEmitter.on(key, handler);
    return () => {
      appEventEmitter.off(key, handler);
    };
  }, [key, handler]);
};
