import { Create } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Container, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../authentication';
import { Header } from '../Header';
import * as Projects from '../projects';
import { Link, routes } from '../routes';

export const ProjectsCreatePage = () => {
  const authUser = useAuthUser();

  const mutation = useMutation(Projects.create);

  const [projectName, setProjectName] = useState('My Cool Project');

  const navigate = useNavigate();

  const snackbar = useSnackbar();

  const onCreate = async () => {
    const result = await mutation.mutateAsync({
      ownerId: authUser.userId,
      projectName,
    });

    switch (result.type) {
      case 'error':
        snackbar.enqueueSnackbar('failed to create project', {
          variant: 'error',
        });
        return;

      case 'success':
        snackbar.enqueueSnackbar('project created', { variant: 'success' });
        navigate(routes['/projects/:id'].make(result.projectId));
        return;
    }
  };

  return (
    <>
      <Header
        breadcrumbs={[<Typography color="text.primary">create</Typography>]}
      />
      <Container maxWidth="sm">
        <TextField
          value={projectName}
          onChange={(event) => setProjectName(event.currentTarget.value)}
          fullWidth
          label="Project Name"
          sx={{ marginTop: 2, marginBottom: 4 }}
        />

        <LoadingButton
          startIcon={<Create />}
          fullWidth
          variant="outlined"
          onClick={onCreate}
          loading={mutation.status === 'loading'}
        >
          Create Project
        </LoadingButton>
      </Container>
    </>
  );
};
