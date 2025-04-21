import { Data } from '@screenshot-service/screenshot-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { definitions } from '../../supabase-types';
import { IConfigurationDataAccess } from '../configuration/interface';
import { IProjectDataAccess, Project } from './interface';
import { Problem } from '../shared';

const decodeRow = (
  row: definitions['projects']
): Data.Result.Result<Problem[], Project> => {
  const projectId = Data.ProjectId.decode(row.id);
  const ownerId = Data.UserId.decode(row.owner_id);
  const projectName = Data.ProjectName.decode(row.name);
  const whitelistedUrls = Data.Result.combineValues(
    row.whitelisted_urls?.map(Data.Url.decode)
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

export const ProjectDataAccess = ({
  supabaseClient,
  configurationDataAccess,
}: {
  supabaseClient: SupabaseClient;
  configurationDataAccess: IConfigurationDataAccess;
}): IProjectDataAccess => {
  return {
    findManyOwnerId: async ({ ownerId }) => {
      const response = await supabaseClient
        .from<definitions['projects']>('projects')
        .select('*')
        .match({ owner_id: ownerId });

      if (response.error) {
        return Data.Result.Err([{ message: response.error.message }]);
      }

      const decodings = response.data?.map(decodeRow);

      const problems = Data.Result.toErrors(decodings).flat();

      if (problems?.length > 0) {
        return Data.Result.Err(problems);
      }

      return Data.Result.Ok(Data.Result.toValues(decodings));
    },

    findManyById: async ({ projectId }) => {
      const response = await supabaseClient
        .from<definitions['projects']>('projects')
        .select('*')
        .match({ id: projectId });

      if (response.error) {
        return Data.Result.Err([{ message: response.error.message }]);
      }

      const decodings = response.data?.map(decodeRow);

      const problems = Data.Result.toErrors(decodings).flat();

      if (problems?.length > 0) {
        return Data.Result.Err(problems);
      }

      return Data.Result.Ok(Data.Result.toValues(decodings));
    },

    deleteForever: async ({ projectId }) => {
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
    },

    insert: async ({ ownerId, projectName, whilelistedUrls }) => {
      const findManyByOwnerIdFn = async (ownerId: Data.UserId.UserId) => {
        const response = await supabaseClient
          .from<definitions['projects']>('projects')
          .select('*')
          .match({ owner_id: ownerId });

        if (response.error) {
          return Data.Result.Err([{ message: response.error.message }]);
        }

        const decodings = response.data?.map(decodeRow);

        const problems = Data.Result.toErrors(decodings).flat();

        if (problems?.length > 0) {
          return Data.Result.Err(problems);
        }

        return Data.Result.Ok(Data.Result.toValues(decodings));
      };

      const projectsResult = await findManyByOwnerIdFn(ownerId);

      if (projectsResult.type === 'Err') {
        return projectsResult;
      }

      const projects = projectsResult.value;

      const configurationResult = await configurationDataAccess.findOne();

      if (configurationResult.type === 'Err') {
        return configurationResult;
      }

      const configuration = configurationResult.value;

      if (projects?.length >= configuration.maxProjectCount) {
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
    },

    update: async ({ projectId, ...updates }) => {
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
    },
  };
};
