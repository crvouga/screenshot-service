import { IProjectId } from '@crvouga/screenshot-service';
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
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { CopyToClipboardField } from '../../../../lib/Clipboard';
import * as Projects from '../../../projects';

export const ProjectWhitelistedUrlsSection = ({
  project,
}: {
  project: Projects.IProject;
}) => {
  const [whitelistedUrls, setWhitelistedUrls] = useState(
    project.whitelistedUrls
  );

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
          access the backend api from this
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
  projectId: IProjectId;
  whitelistedUrls: string[];
  setWhitelistedUrls: (urls: string[]) => void;
}) => {
  const queryClient = useQueryClient();
  const mutation = useMutation(Projects.update);
  const snackbar = useSnackbar();
  const [url, setUrl] = useState('');

  const isUrlValid = url.length > 0 && !whitelistedUrls.includes(url);

  const onAdd = async () => {
    const result = await mutation.mutateAsync({
      projectId: projectId,
      whitelistedUrls: [...whitelistedUrls, url],
    });

    switch (result.type) {
      case 'error':
        snackbar.enqueueSnackbar('failed to update project name', {
          variant: 'error',
        });
        return;

      case 'success':
        setUrl('');

        setWhitelistedUrls([...whitelistedUrls, url]);

        snackbar.enqueueSnackbar('project updated', {
          variant: 'default',
        });

        queryClient.invalidateQueries(Projects.queryFilter);

        return;
    }
  };

  return (
    <>
      <Box sx={{ mt: 2, mb: 2, display: 'flex' }}>
        <TextField
          placeholder="https://example.com/"
          label="base url"
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
          fullWidth
          sx={{ flex: 1 }}
        />
      </Box>
      <Box sx={{ marginTop: 2, display: 'flex', flexDirection: 'row-reverse' }}>
        <LoadingButton
          variant="contained"
          onClick={onAdd}
          loading={mutation.status === 'loading'}
          disabled={!isUrlValid}
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
  projectId: IProjectId;
  whitelistedUrl: string;
  whitelistedUrls: string[];
  setWhitelistedUrls: (urls: string[]) => void;
}) => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [open, setOpen] = useState(false);
  const mutation = useMutation(Projects.update);

  const onRemove = async () => {
    const nextWhitelistedUrls = whitelistedUrls.filter(
      (url) => url !== whitelistedUrl
    );

    const result = await mutation.mutateAsync({
      projectId: projectId,
      whitelistedUrls: nextWhitelistedUrls,
    });

    switch (result.type) {
      case 'error':
        snackbar.enqueueSnackbar(
          result.error ?? 'failed to remove url from whitelist',
          {
            variant: 'error',
          }
        );
        return;

      case 'success':
        setWhitelistedUrls(nextWhitelistedUrls);

        snackbar.enqueueSnackbar('removed url from whitelist', {
          variant: 'default',
        });

        queryClient.invalidateQueries(Projects.queryFilter);

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
