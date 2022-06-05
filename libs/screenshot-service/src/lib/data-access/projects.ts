import { SupabaseClient } from '@supabase/supabase-js';
import { array, either } from 'fp-ts';
import { pipe } from 'fp-ts/lib/function';
import * as Data from '../data';
import { definitions } from '../supabase';
import { toAllLeft, toAllRight } from '../utils';

export type Project = {
  projectId: Data.ProjectId.ProjectId;
  ownerId: Data.UserId.UserId;
  projectName: Data.ProjectName.ProjectName;
  whitelistedUrls: Data.Url.Url[];
};

const decodeRow = (
  row: definitions['projects']
): either.Either<Error[], Project> => {
  const projectId = Data.ProjectId.decode(row.id);
  const ownerId = Data.UserId.decode(row.owner_id);
  const projectName = Data.ProjectName.decode(row.name);
  const whitelistedUrls = pipe(
    row.whitelisted_urls,
    array.map(Data.Url.decode),
    array.sequence(either.Applicative)
  );

  if (
    either.isRight(projectId) &&
    either.isRight(ownerId) &&
    either.isRight(projectName) &&
    either.isRight(whitelistedUrls)
  ) {
    return either.right({
      projectId: projectId.right,
      ownerId: ownerId.right,
      projectName: projectName.right,
      whitelistedUrls: whitelistedUrls.right,
    });
  }

  return either.left(
    toAllLeft([projectId, ownerId, projectName, whitelistedUrls])
  );
};

export const findMany =
  (supabaseClient: SupabaseClient) =>
  async ({
    ownerId,
  }: {
    ownerId: Data.UserId.UserId;
  }): Promise<either.Either<Error[], Project[]>> => {
    const response = await supabaseClient
      .from<definitions['projects']>('projects')
      .select('*')
      .match({ owner_id: ownerId });

    if (response.error) {
      return either.left([new Error(response.error.message)]);
    }

    const decodings = response.data.map(decodeRow);

    const lefts = toAllLeft(decodings).flat();

    if (lefts.length > 0) {
      return either.left(lefts);
    }

    return either.right(toAllRight(decodings));
  };

export const findOne =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
  }: {
    projectId: Data.ProjectId.ProjectId;
  }): Promise<either.Either<Error[], Project>> => {
    const response = await supabaseClient
      .from<definitions['projects']>('projects')
      .select('*')
      .match({ id: projectId })
      .single();

    if (response.error) {
      return either.left([new Error(response.error.message)]);
    }

    const decoded = decodeRow(response.data);

    return decoded;
  };

export const deleteForever =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
  }: {
    projectId: Data.ProjectId.ProjectId;
  }): Promise<either.Either<Error[], Project>> => {
    const response = await supabaseClient
      .from<definitions['projects']>('projects')
      .delete()
      .match({ id: projectId })
      .single();

    if (response.error) {
      return either.left([new Error(response.error.message)]);
    }

    const decoded = decodeRow(response.data);

    return decoded;
  };

export const insert =
  (supabaseClient: SupabaseClient) =>
  async ({
    ownerId,
    projectName,
  }: {
    ownerId: Data.UserId.UserId;
    projectName: Data.ProjectName.ProjectName;
  }): Promise<either.Either<Error[], Project>> => {
    const response = await supabaseClient
      .from<definitions['projects']>('projects')
      .insert({ owner_id: ownerId, name: projectName })
      .single();

    if (response.error) {
      return either.left([new Error(response.error.message)]);
    }

    const decoded = decodeRow(response.data);

    return decoded;
  };

export const update =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
    ...updates
  }: Partial<Project> & { projectId: Data.ProjectId.ProjectId }): Promise<
    either.Either<Error[], Project>
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
      return either.left([new Error(response.error.message)]);
    }

    const decoded = decodeRow(response.data);

    return decoded;
  };
