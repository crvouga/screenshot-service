import {
  IDelaySec,
  IImageType,
  ILogLevel,
  IProjectId,
  IScreenshotId,
  IStrategy,
  ITargetUrl,
} from '@crvouga/screenshot-service';
import { createAction } from '@reduxjs/toolkit';
import { call, takeEvery } from 'redux-saga/effects';
import * as WebBrowser from '../data-access/web-browser';
import { IScreenshotBuffer } from '../types';
//
//
//
//
//
//
//
//

type IRequest = {
  strategy: IStrategy;
  projectId: IProjectId;
  imageType: IImageType;
  delaySec: IDelaySec;
  targetUrl: ITargetUrl;
};

type IResponse =
  | {
      type: 'success';
      buffer: IScreenshotBuffer;
      screenshotId: IScreenshotId;
      imageType: IImageType;
    }
  | {
      type: 'aborted';
    }
  | {
      type: 'error';
      errors: { message: string }[];
    };

type IDependencies = {
  webBrowser: WebBrowser.WebBrowser;
};

//
//
//
//
//
//
//

type StartRequestMsg = {
  type: 'startRequest';
  request: IRequest;
};

type Msg =
  | {
      type: 'log';
      level: ILogLevel;
      message: string;
    }
  | {
      type: 'success';
      buffer: IScreenshotBuffer;
      screenshotId: IScreenshotId;
      imageType: IImageType;
    }
  | {
      type: 'aborted';
    }
  | {
      type: 'error';
      errors: { message: string }[];
    };

export const actions = {
  log: createAction('Log', (level: ILogLevel, message: string) => ({
    payload: {
      level,
      message,
    },
  })),

  startScreenshotRequest: createAction(
    'StartScreenshotRequest',
    (request: IRequest) => ({ payload: request })
  ),
};

export function* saga() {
  yield takeEvery(actions.startScreenshotRequest, function* (action) {
    yield call(() => {
      console.log(action);
    });
  });
}
