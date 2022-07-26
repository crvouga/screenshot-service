import { DeleteForever } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { CopyToClipboardField } from '../../../../lib/Clipboard';
import { Project, useUpdateProjectMutation } from '../../../data-access';

export const ProjectWhitelistedUrlsSection = ({
  project,
}: {
  project: Project;
}) => {
  const [whitelistedUrls, setWhitelistedUrls] = useState(
    project.whitelistedUrls
  );

  useEffect(() => {
    setWhitelistedUrls(project.whitelistedUrls);
  }, [project.whitelistedUrls]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        marginBottom: 4,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        whitelisted urls
      </Typography>

      {whitelistedUrls.length === 0 && (
        <Alert severity="warning">
          <AlertTitle>no whitelisted urls</AlertTitle>
          you're going to need to add a url to the white list to be able to
          access the screenshot api
        </Alert>
      )}

      {whitelistedUrls.map((url) => (
        <WhitelistedUrlField
          key={url}
          projectId={project.projectId}
          whitelistedUrl={url}
          whitelistedUrls={whitelistedUrls}
          setWhitelistedUrls={setWhitelistedUrls}
        />
      ))}

      <AddToWhitelistInput
        projectId={project.projectId}
        whitelistedUrls={whitelistedUrls}
        setWhitelistedUrls={setWhitelistedUrls}
      />
    </Paper>
  );
};

const AddToWhitelistInput = ({
  projectId,
  whitelistedUrls,
  setWhitelistedUrls,
}: {
  projectId: Data.ProjectId.ProjectId;
  whitelistedUrls: Data.Url.Url[];
  setWhitelistedUrls: (urls: Data.Url.Url[]) => void;
}) => {
  const mutation = useUpdateProjectMutation();
  const snackbar = useSnackbar();
  const [urlInput, setUrlInput] = useState<string>('');
  const [problems, setProblems] = useState<{ message: string }[]>([]);

  const onAdd = async () => {
    const decodedUrl = Data.Url.decode(urlInput);

    if (decodedUrl.type === 'Err') {
      setProblems([decodedUrl.error]);
      return;
    }

    const url = decodedUrl.value;

    const result = await mutation.mutateAsync({
      projectId: projectId,
      whitelistedUrls: [...whitelistedUrls, url],
    });

    switch (result.type) {
      case 'Err':
        snackbar.enqueueSnackbar('failed to update project name', {
          variant: 'error',
        });
        return;

      case 'Ok':
        setUrlInput('');

        setWhitelistedUrls(result.value.whitelistedUrls);

        snackbar.enqueueSnackbar('project updated', {
          variant: 'default',
        });

        return;
    }
  };

  const canAddUrl = Data.Url.is(urlInput);

  return (
    <>
      <Box sx={{ mt: 2, mb: 2, display: 'flex' }}>
        <TextField
          placeholder="https://example.com/"
          label="base url"
          value={urlInput}
          onChange={(event) => {
            setProblems([]);
            setUrlInput(event.currentTarget.value);
          }}
          fullWidth
          sx={{ flex: 1 }}
        />
      </Box>

      {problems.length > 0 && (
        <Box sx={{ marginY: 2 }}>
          {problems.map((problem) => (
            <Alert severity="error" key={problem.message}>
              {problem.message}
            </Alert>
          ))}
        </Box>
      )}

      <Box sx={{ marginTop: 2, display: 'flex', flexDirection: 'row-reverse' }}>
        <LoadingButton
          variant="contained"
          onClick={onAdd}
          loading={mutation.status === 'loading'}
          disabled={!canAddUrl}
        >
          add
        </LoadingButton>
      </Box>
    </>
  );
};

const WhitelistedUrlField = ({
  projectId,
  whitelistedUrls,
  setWhitelistedUrls,
  whitelistedUrl,
}: {
  projectId: Data.ProjectId.ProjectId;
  whitelistedUrl: Data.Url.Url;
  whitelistedUrls: Data.Url.Url[];
  setWhitelistedUrls: (urls: Data.Url.Url[]) => void;
}) => {
  const snackbar = useSnackbar();
  const [open, setOpen] = useState(false);
  const mutation = useUpdateProjectMutation();

  const onRemove = async () => {
    const nextWhitelistedUrls = whitelistedUrls.filter(
      (url) => url !== whitelistedUrl
    );

    const result = await mutation.mutateAsync({
      projectId: projectId,
      whitelistedUrls: nextWhitelistedUrls,
    });

    switch (result.type) {
      case 'Err':
        snackbar.enqueueSnackbar(
          result.error.map((error) => error.message).join(', ') ??
          'failed to remove url from whitelist',
          {
            variant: 'error',
          }
        );
        return;

      case 'Ok':
        setWhitelistedUrls(nextWhitelistedUrls);

        snackbar.enqueueSnackbar('removed url from whitelist', {
          variant: 'default',
        });

        return;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <CopyToClipboardField text={whitelistedUrl} />

      <Tooltip title="delete forever">
        <IconButton onClick={() => setOpen(true)}>
          <DeleteForever />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>remove whitelisted url?</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            <AlertTitle>danger!</AlertTitle>
            removing from whitelist will block projects located at this url
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setOpen(false)}>
            cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="error"
            loading={mutation.isLoading}
            onClick={onRemove}
          >
            remove
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
