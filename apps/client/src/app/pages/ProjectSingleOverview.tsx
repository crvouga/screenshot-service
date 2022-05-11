import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import * as Projects from '../projects';
import { routes } from '../routes';
import { useProfileSingleOutletContext } from './ProjectsSingle';
import * as uuid from 'uuid';

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
  const queryClient = useQueryClient();

  const [apiKeys, setApiKeys] = useState(project.apiKeys);

  const addMutation = useMutation(Projects.update);
  const removeMutation = useMutation(Projects.update);

  const snackbar = useSnackbar();

  const onGenerate = async () => {
    const nextApiKeys = [...apiKeys, uuid.v4()];

    const result = await addMutation.mutateAsync({
      projectId: project.projectId,
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

        snackbar.enqueueSnackbar('project updated', {
          variant: 'default',
        });

        queryClient.invalidateQueries(Projects.queryFilter);

        return;
    }
  };

  const onRemove = async (params: { apiKey: string }) => {
    const nextApiKeys = apiKeys.filter((apiKey) => apiKey !== params.apiKey);

    const result = await removeMutation.mutateAsync({
      projectId: project.projectId,
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
        api keys
      </Typography>

      <List>
        {apiKeys.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ p: 2 }}>
            project has no api keys
          </Typography>
        )}
        {apiKeys.map((apiKey) => (
          <ListItem key={apiKey}>
            <ListItemText primary={apiKey} />
            <ListItemSecondaryAction>
              <LoadingButton
                disabled={removeMutation.isLoading}
                loading={
                  removeMutation.isLoading &&
                  !removeMutation?.variables?.apiKeys?.includes(apiKey)
                }
                color="error"
                onClick={() => {
                  onRemove({ apiKey });
                }}
              >
                remove
              </LoadingButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Box sx={{ marginTop: 2, display: 'flex', flexDirection: 'row-reverse' }}>
        <LoadingButton
          variant="contained"
          onClick={onGenerate}
          loading={addMutation.status === 'loading'}
        >
          generate
        </LoadingButton>
      </Box>
    </Paper>
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
  const queryClient = useQueryClient();

  const [whitelistedUrls, setWhitelistedUrls] = useState(
    project.whitelistedUrls
  );

  const [url, setUrl] = useState('');
  const isUrlValid = url.length > 0 && !whitelistedUrls.includes(url);

  const addMutation = useMutation(Projects.update);
  const removeMutation = useMutation(Projects.update);

  const snackbar = useSnackbar();

  const onAdd = async () => {
    const result = await addMutation.mutateAsync({
      projectId: project.projectId,
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

  const onRemove = async (params: { url: string }) => {
    const nextWhitelistedUrls = whitelistedUrls.filter(
      (url) => url !== params.url
    );

    const result = await removeMutation.mutateAsync({
      projectId: project.projectId,
      whitelistedUrls: nextWhitelistedUrls,
    });

    switch (result.type) {
      case 'error':
        snackbar.enqueueSnackbar('failed to update project name', {
          variant: 'error',
        });
        return;

      case 'success':
        setUrl('');

        setWhitelistedUrls(nextWhitelistedUrls);

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
        whitelisted urls
      </Typography>

      <List>
        {whitelistedUrls.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ p: 2 }}>
            project has no whitelisted urls
          </Typography>
        )}
        {whitelistedUrls.map((url) => (
          <ListItem key={url}>
            <ListItemText primary={url} />
            <ListItemSecondaryAction>
              <LoadingButton
                disabled={removeMutation.isLoading}
                loading={
                  removeMutation.isLoading &&
                  !removeMutation?.variables?.whitelistedUrls?.includes(url)
                }
                color="error"
                onClick={() => {
                  onRemove({ url });
                }}
              >
                remove
              </LoadingButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Box sx={{ marginBottom: 2, display: 'flex' }}>
        <TextField
          label="url"
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
          loading={addMutation.status === 'loading'}
          disabled={!isUrlValid}
        >
          add
        </LoadingButton>
      </Box>
    </Paper>
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
        snackbar.enqueueSnackbar('failed to delete project', {
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
            delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
