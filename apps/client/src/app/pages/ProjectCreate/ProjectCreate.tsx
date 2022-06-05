import { Data } from '@screenshot-service/screenshot-service';
import { Create } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Container, TextField, Typography } from '@mui/material';
import { either } from 'fp-ts';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../authentication';
import { Header } from '../../Header';
import { useCreateProjectMutation } from '../../projects';
import { routes } from '../../routes';

export const ProjectsCreatePage = () => {
  const authUser = useAuthUser();
  const mutation = useCreateProjectMutation();
  const [projectName, setProjectName] = useState<Data.ProjectName.ProjectName>(
    Data.ProjectName.fromString('My Cool Project')
  );
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  const onCreate = async () => {
    const result = await mutation.mutateAsync({
      ownerId: authUser.userId,
      projectName,
    });

    if (either.isLeft(result)) {
      snackbar.enqueueSnackbar('failed to create project', {
        variant: 'error',
      });
    }

    if (either.isRight(result)) {
      snackbar.enqueueSnackbar('project created');
      navigate(routes['/projects/:id'].make(result.right.projectId));
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
          onChange={(event) => {
            const value = event.currentTarget.value;
            const projectName = Data.ProjectName.fromString(value);
            setProjectName(projectName);
          }}
          fullWidth
          label="Project Name"
          sx={{ mt: 2, mb: 4 }}
        />

        <LoadingButton
          startIcon={<Create />}
          fullWidth
          variant="contained"
          onClick={onCreate}
          loading={mutation.status === 'loading'}
        >
          Create Project
        </LoadingButton>
      </Container>
    </>
  );
};
