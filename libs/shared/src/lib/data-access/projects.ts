import { Data } from '@screenshot-service/screenshot-service';
import { SupabaseClient } from '@supabase/supabase-js';
import * as Configuration from './configuration';
import { definitions } from '../supabase-types';

export type Project = {
  projectId: Data.ProjectId.ProjectId;
  ownerId: Data.UserId.UserId;
  projectName: Data.ProjectName.ProjectName;
  whitelistedUrls: Data.Url.Url[];
};

type Problem = { message: string };

const decodeRow = (
  row: definitions['projects']
): Data.Result.Result<Problem[], Project> => {
  const projectId = Data.ProjectId.decode(row.id);
  const ownerId = Data.UserId.decode(row.owner_id);
  const projectName = Data.ProjectName.decode(row.name);
  const whitelistedUrls = Data.Result.combineValues(
    row.whitelisted_urls.map(Data.Url.decode)
  );

  if (
    Data.Result.isOk(projectId) &&
    Data.Result.isOk(ownerId) &&
    Data.Result.isOk(projectName) &&
    Data.Result.isOk(whitelistedUrls)
  ) {
    return Data.Result.Ok({
      projectId: projectId.value,
      ownerId: ownerId.value,
      projectName: projectName.value,
      whitelistedUrls: whitelistedUrls.value,
    });
  }

  return Data.Result.Err(
    Data.Result.toErrors([projectId, ownerId, projectName, whitelistedUrls])
  );
};

export const findManyByOwnerId =
  (supabaseClient: SupabaseClient) =>
  async ({
    ownerId,
  }: {
    ownerId: Data.UserId.UserId;
  }): Promise<Data.Result.Result<Problem[], Project[]>> => {
    const response = await supabaseClient
      .from<definitions['projects']>('projects')
      .select('*')
      .match({ owner_id: ownerId });

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const decodings = response.data.map(decodeRow);

    const problems = Data.Result.toErrors(decodings).flat();

    if (problems.length > 0) {
      return Data.Result.Err(problems);
    }

    return Data.Result.Ok(Data.Result.toValues(decodings));
  };

export const findManyById =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
  }: {
    projectId: Data.ProjectId.ProjectId;
  }): Promise<Data.Result.Result<Problem[], Project[]>> => {
    const response = await supabaseClient
      .from<definitions['projects']>('projects')
      .select('*')
      .match({ id: projectId });

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const decodings = response.data.map(decodeRow);

    const problems = Data.Result.toErrors(decodings).flat();

    if (problems.length > 0) {
      return Data.Result.Err(problems);
    }

    return Data.Result.Ok(Data.Result.toValues(decodings));
  };

export const deleteForever =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
  }: {
    projectId: Data.ProjectId.ProjectId;
  }): Promise<Data.Result.Result<Problem[], Project>> => {
    const captureScreenshotResponse = await supabaseClient
      .from<definitions['capture_screenshot_requests']>(
        'capture_screenshot_requests'
      )
      .delete()
      .eq('project_id', projectId);

    if (captureScreenshotResponse.error) {
      return Data.Result.Err([
        { message: captureScreenshotResponse.error.message },
      ]);
    }

    const response = await supabaseClient
      .from<definitions['projects']>('projects')
      .delete()
      .match({ id: projectId })
      .single();

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const decoded = decodeRow(response.data);

    return decoded;
  };

export const insert =
  (supabaseClient: SupabaseClient) =>
  async ({
    ownerId,
    projectName,
    whilelistedUrls,
  }: {
    ownerId: Data.UserId.UserId;
    projectName: Data.ProjectName.ProjectName;
    whilelistedUrls: Data.Url.Url[];
  }): Promise<Data.Result.Result<Problem[], Project>> => {
    const projectsResult = await findManyByOwnerId(supabaseClient)({ ownerId });

    if (projectsResult.type === 'Err') {
      return projectsResult;
    }

    const projects = projectsResult.value;

    const configurationResult = await Configuration.findOne(supabaseClient)();

    if (configurationResult.type === 'Err') {
      return configurationResult;
    }

    const configuration = configurationResult.value;

    if (projects.length >= configuration.maxProjectCount) {
      return Data.Result.Err([
        {
          message: `Users are not allowed to have more than ${configuration.maxProjectCount} projects.`,
        },
      ]);
    }

    const response = await supabaseClient
      .from<definitions['projects']>('projects')
      .insert({
        owner_id: ownerId,
        name: projectName,
        whitelisted_urls: whilelistedUrls,
      })
      .single();

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const decoded = decodeRow(response.data);

    if (decoded.type === 'Err') {
      return decoded;
    }

    const project = decoded.value;

    return Data.Result.Ok(project);
  };

export const update =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
    ...updates
  }: Partial<Project> & { projectId: Data.ProjectId.ProjectId }): Promise<
    Data.Result.Result<Problem[], Project>
  > => {
    const response = await supabaseClient
      .from<definitions['projects']>('projects')
      .update({
        name: updates.projectName,
        whitelisted_urls: updates.whitelistedUrls,
      })
      .match({
        id: projectId,
      })
      .single();

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const decoded = decodeRow(response.data);

    return decoded;
  };

export const ProjectDataAccess = (supabaseClient: SupabaseClient) => {
  return {
    findManyOwnerId: findManyByOwnerId(supabaseClient),
    findManyById: findManyById(supabaseClient),
    update: update(supabaseClient),
    deleteForever: deleteForever(supabaseClient),
    insert: insert(supabaseClient),
  };
};
