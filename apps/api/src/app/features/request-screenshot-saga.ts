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

export const actions = {
  log: createAction('Log', (level: ILogLevel, message: string) => ({
    payload: {
      level,
      message,
    },
  })),

  fetchScreenshot: createAction('FetchScreenshot', (request: IRequest) => ({
    payload: request,
  })),
};

export function* fetchScreenshot() {
  yield takeEvery(actions.fetchScreenshot, fetchScreenshotFlow);
}

function* fetchScreenshotFlow(
  action: ReturnType<typeof actions.fetchScreenshot>
) {
  yield console.log(action);
}
