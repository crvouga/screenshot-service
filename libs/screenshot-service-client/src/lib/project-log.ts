export type ILogLevel = 'info' | 'notice' | 'warn' | 'error';

export type IProjectLog = {
  id: string;
  projectId: string;
  message: string;
  logLevel: ILogLevel;
  requestId: string;
};
