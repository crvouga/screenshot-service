import { LoadingButton } from '@mui/lab';
import { Alert, Box, Collapse } from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { useSnackbar } from 'notistack';
import { useAuthUser } from '../../authentication';
import { useProjectsQuery, useUpdateProjectMutation } from '../../data-access';

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
      : query.data.type === 'Err'
        ? []
        : query.data.value;

  const currentProject = projects.find(
    (project) => project.projectId === projectId
  );

  const mutation = useUpdateProjectMutation();
  const snackbar = useSnackbar();

  const onAddToWhitelist = async () => {
    const decoded = Data.Url.decode(window.location.origin);

    if (decoded.type === 'Err') {
      snackbar.enqueueSnackbar('failed to decode url');
      return;
    }

    const url = decoded.value;

    const whitelistedUrlsUpdated = [
      ...(currentProject?.whitelistedUrls ?? []),
      url,
    ];

    const result = await mutation.mutateAsync({
      projectId,
      whitelistedUrls: whitelistedUrlsUpdated,
    });

    if (result.type === 'Err') {
      snackbar.enqueueSnackbar(`failed to add current url to whitelist`, {
        variant: 'error',
      });

      return;
    }

    snackbar.enqueueSnackbar(`added current url to whitelist`);
  };

  const showAlert =
    currentProject &&
    !currentProject.whitelistedUrls.some(
      (url) => url === window.location.origin
    );

  return (
    <Collapse in={showAlert}>
      {currentProject && (
        <Alert sx={{ marginBottom: 2 }} severity="warning" variant="standard">
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
  );
};
