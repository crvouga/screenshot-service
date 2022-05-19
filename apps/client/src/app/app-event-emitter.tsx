import { IEventEmitter } from '@screenshot-service/shared';
import EventEmitter from 'events';
import { useEffect } from 'react';
import { IProfile } from './profiles';

export type IAppEvent = {
  OpenedTryDrawer: null;
  Profile: { profile: IProfile };
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
