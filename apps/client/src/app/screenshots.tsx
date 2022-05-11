import { definitions } from '@screenshot-service/shared';
import { supabaseClient } from './supabase';

export type IScreenshot = {
  screenshotId: string;
  projectId: string;
  imageType: string;
  timeoutMs: number;
  targetUrl: string;
};

export const queryKeys = {
  findManyByProjectId: ({ projectId }: { projectId: string }) => [
    'screenshots',
    projectId,
  ],
};

const fromRow = (row: definitions['screenshots']): IScreenshot => {
  return {
    projectId: row.id,
    screenshotId: row.id,
    imageType: row.image_type,
    timeoutMs: row.timeout_ms,
    targetUrl: row.target_url,
  };
};

export const findManyByProjectId = async ({
  projectId,
}: {
  projectId: string;
}): Promise<
  | { type: 'error'; error: string }
  | { type: 'success'; screenshots: IScreenshot[] }
> => {
  const response = await supabaseClient
    .from<definitions['screenshots']>('screenshots')
    .select('*')
    .match({ project_id: projectId });

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  return { type: 'success', screenshots: response.data.map(fromRow) };
};
