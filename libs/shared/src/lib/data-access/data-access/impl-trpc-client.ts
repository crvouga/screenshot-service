import { TrpcClientCaptureScreenshotRequestDataAccess } from '../capture-screenshot-request/impl-trpc-client';
import { TrpcClientConfigurationDataAccess } from '../configuration/impl-trpc-client';
import { TrpcClientProfileDataAccess } from '../profiles/impl-trpc-client';
import { TrpcClientProjectDataAccess } from '../projects/impl-trpc-client';
import { IDataAccess } from './interface';

export const TrpcClientDataAccess = (): IDataAccess => {
  console.log('Creating TrpcClientDataAccess');
  return {
    profile: TrpcClientProfileDataAccess(),
    project: TrpcClientProjectDataAccess(),
    captureScreenshotRequest: TrpcClientCaptureScreenshotRequestDataAccess(),
    configuration: TrpcClientConfigurationDataAccess(),
  };
};
