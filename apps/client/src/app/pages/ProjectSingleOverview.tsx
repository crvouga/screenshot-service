import { DeleteForever } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import * as uuid from 'uuid';
import { CopyToClipboardField } from '../../lib/Clipboard';
import * as Projects from '../projects';
import { routes } from '../routes';
import { useProfileSingleOutletContext } from './ProjectsSingle';

export const ProjectSingleOverviewPage = () => {
  const { project } = useProfileSingleOutletContext();

  return (
    <Container maxWidth="sm">
      <ProjectApiKeysSection project={project} />

      <ProjectUrlWhitelistSection project={project} />

      <ProjectNameSection project={project} />

      <DeleteProjectSection projectId={project.projectId} />
    </Container>
  );
};

//
//
//
//
// Project Url Whitelist
//
//
//
//

const ProjectApiKeysSection = ({ project }: { project: Projects.IProject }) => {
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
          <CopyToClipboardField text={apiKey} sx={{ mr: 1 }} />

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

//
//
//
//
// Project Url Whitelist
//
//
//
//

const ProjectUrlWhitelistSection = ({
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
          you're going to need to add a url to the white list to be able to use
          this project
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
  projectId: string;
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
      <Alert sx={{ mt: 2, mb: 1 }} severity="info">
        must be the base url of your website. an example url could be:
        https://example.com/
      </Alert>
      <Box sx={{ mb: 2, display: 'flex' }}>
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
  projectId: string;
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

//
//
//
//
// Project Name
//
//
//
//

const ProjectNameSection = ({ project }: { project: Projects.IProject }) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState(project.name);

  const mutation = useMutation(Projects.update);

  const snackbar = useSnackbar();

  const onSave = async () => {
    const result = await mutation.mutateAsync({
      projectId: project.projectId,
      name,
    });

    switch (result.type) {
      case 'error':
        snackbar.enqueueSnackbar('failed to update project name', {
          variant: 'error',
        });
        return;

      case 'success':
        snackbar.enqueueSnackbar('project updated', {
          variant: 'default',
        });

        queryClient.invalidateQueries(Projects.queryFilter);

        return;
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        marginBottom: 4,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        project name
      </Typography>
      <TextField
        label="name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        fullWidth
        sx={{ marginBottom: 2 }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
        <LoadingButton
          variant="contained"
          onClick={onSave}
          disabled={project.name === name}
          loading={mutation.status === 'loading'}
        >
          save
        </LoadingButton>
      </Box>
    </Paper>
  );
};

//
//
//
//
// Delete Project
//
//
//
//

const DeleteProjectSection = ({ projectId }: { projectId: string }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const onCancel = () => {
    setOpen(false);
  };
  const navigate = useNavigate();
  const mutation = useMutation(Projects.remove);
  const snackbar = useSnackbar();

  const onDelete = async () => {
    const response = await mutation.mutateAsync({ projectId });

    switch (response.type) {
      case 'error':
        snackbar.enqueueSnackbar(response.error || 'failed to delete project', {
          variant: 'error',
        });
        return;

      case 'success':
        snackbar.enqueueSnackbar('project deleted', { variant: 'default' });
        navigate(routes['/projects'].make());
    }
  };
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px ${theme.palette.error.main} solid`,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        delete project forever
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
        <Button variant="contained" color="error" onClick={() => setOpen(true)}>
          delete
        </Button>
      </Box>
      <Dialog open={open} onClose={onCancel}>
        <DialogTitle>delete project forever?</DialogTitle>
        <DialogActions>
          <Button color="inherit" onClick={onCancel}>
            cancel
          </Button>
          <LoadingButton
            variant="contained"
            onClick={onDelete}
            color="error"
            loading={mutation.status === 'loading'}
          >
            delete forever
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
