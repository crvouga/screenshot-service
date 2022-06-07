import { LoadingButton } from '@mui/lab';
import { Alert, Box, Collapse } from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { either } from 'fp-ts';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useQueryClient } from 'react-query';
import { useAuthUser } from '../../authentication';
import {
  projectsQueryFilter,
  useProjectsQuery,
  useUpdateProjectMutation,
} from '../../projects';

export const NotOnWhitelistAlert = ({
  projectId,
}: {
  projectId: Data.ProjectId.ProjectId;
}) => {
  const authUser = useAuthUser();
  const query = useProjectsQuery({ ownerId: authUser.userId });

  const projects =
    query.status !== 'success'
      ? []
      : either.isLeft(query.data)
      ? []
      : query.data.right;

  const currentProject = projects.find(
    (project) => project.projectId === projectId
  );

  const mutation = useUpdateProjectMutation();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();

  const onAddToWhitelist = async () => {
    const decoded = Data.Url.decode(window.location.origin);

    if (either.isLeft(decoded)) {
      snackbar.enqueueSnackbar('failed to decode url');
      return;
    }

    const url = decoded.right;

    const whitelistedUrlsUpdated = [
      ...(currentProject?.whitelistedUrls ?? []),
      url,
    ];

    const result = await mutation.mutateAsync({
      projectId,
      whitelistedUrls: whitelistedUrlsUpdated,
    });

    if (either.isLeft(result)) {
      snackbar.enqueueSnackbar(`failed to add current url to whitelist`, {
        variant: 'error',
      });

      return;
    }

    snackbar.enqueueSnackbar(`added current url to whitelist`);

    queryClient.invalidateQueries(projectsQueryFilter);
  };

  const showAlert =
    currentProject &&
    !currentProject.whitelistedUrls.some(
      (url) => url === window.location.origin
    );

  return (
    <Box>
      <Collapse in={showAlert}>
        {currentProject && (
          <Alert severity="warning" variant="outlined">
            <Box sx={{ marginBottom: 1 }}>
              The url for this website, {window.location.origin} is not on the
              selected project's url whitelist.
            </Box>

            <LoadingButton
              sx={{ marginLeft: 'auto' }}
              variant="contained"
              onClick={onAddToWhitelist}
              loading={mutation.isLoading}
            >
              Add To Whitelist
            </LoadingButton>
          </Alert>
        )}
      </Collapse>
    </Box>
  );
};
