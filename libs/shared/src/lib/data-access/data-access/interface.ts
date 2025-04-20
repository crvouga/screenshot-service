import { ICaptureScreenshotRequestDataAccess } from '../capture-screenshot-request/interface';
import { IConfigurationDataAccess } from '../configuration/interface';
import { IProfileDataAccess } from '../profiles/interface';
import { IProjectDataAccess } from '../projects/interface';

export type IDataAccess = {
  profile: IProfileDataAccess;
  project: IProjectDataAccess;
  captureScreenshotRequest: ICaptureScreenshotRequestDataAccess;
  configuration: IConfigurationDataAccess;
};
