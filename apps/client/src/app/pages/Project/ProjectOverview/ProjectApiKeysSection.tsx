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
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import * as uuid from 'uuid';
import { CopyToClipboardField } from '../../../../lib/Clipboard';
import * as Projects from '../../../projects';

export const ProjectApiKeysSection = ({
  project,
}: {
  project: Projects.IProject;
}) => {
  const [apiKeys, setApiKeys] = useState(project.apiKeys);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        marginBottom: 4,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        api keys
      </Typography>

      {apiKeys.length === 0 && (
        <Alert severity="warning">
          <AlertTitle>no api keys</AlertTitle>
          you're going need to generate an api key to use this project
        </Alert>
      )}

      {apiKeys.map((apiKey) => (
        <ApiKeyField
          projectId={project.projectId}
          key={apiKey}
          apiKey={apiKey}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
        />
      ))}

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row-reverse' }}>
        <ApiKeyGenerateButton
          projectId={project.projectId}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
        />
      </Box>
    </Paper>
  );
};

const ApiKeyGenerateButton = ({
  projectId,
  apiKeys,
  setApiKeys,
}: {
  projectId: string;
  apiKeys: string[];
  setApiKeys: (apiKeys: string[]) => void;
}) => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const mutation = useMutation(Projects.update);

  const onGenerate = async () => {
    const nextApiKeys = [...apiKeys, uuid.v4()];

    const result = await mutation.mutateAsync({
      projectId: projectId,
      apiKeys: nextApiKeys,
    });

    switch (result.type) {
      case 'error':
        snackbar.enqueueSnackbar('failed to update project name', {
          variant: 'error',
        });
        return;

      case 'success':
        setApiKeys(nextApiKeys);

        snackbar.enqueueSnackbar('api key created', {
          variant: 'default',
        });

        queryClient.invalidateQueries(Projects.queryFilter);

        return;
    }
  };

  return (
    <LoadingButton
      variant="contained"
      onClick={onGenerate}
      loading={mutation.status === 'loading'}
    >
      generate
    </LoadingButton>
  );
};

const ApiKeyField = ({
  projectId,
  apiKey,
  apiKeys,
  setApiKeys,
}: {
  projectId: string;
  apiKey: string;
  apiKeys: string[];
  setApiKeys: (apiKeys: string[]) => void;
}) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const snackbar = useSnackbar();
  const mutation = useMutation(Projects.update);

  const onRemove = async (params: { apiKey: string }) => {
    const nextApiKeys = apiKeys.filter((apiKey) => apiKey !== params.apiKey);

    const result = await mutation.mutateAsync({
      projectId: projectId,
      apiKeys: nextApiKeys,
    });

    switch (result.type) {
      case 'error':
        snackbar.enqueueSnackbar('failed to delete api key', {
          variant: 'error',
        });
        return;

      case 'success':
        setApiKeys(nextApiKeys);

        setOpen(false);

        snackbar.enqueueSnackbar('deleted api key');

        queryClient.invalidateQueries(Projects.queryFilter);

        return;
    }
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CopyToClipboardField text={apiKey} />

          <Tooltip title="delete forever">
            <IconButton onClick={() => setOpen(true)}>
              <DeleteForever />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>delete api key forever?</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            <AlertTitle>danger!</AlertTitle>
            deleting this api key will break projects using it
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
            onClick={() => onRemove({ apiKey })}
          >
            delete forever
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};
