import { ChevronLeft, Create } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Alert,
  Button,
  Container,
  TextField,
  Toolbar,
  Typography,
  Grow,
} from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../authentication/use-auth-state';
import { useCreateProjectMutation } from '../../data-access';
import { routes } from '../../routes';

export const ProjectsCreatePage = () => {
  const authUser = useAuthUser();
  const mutation = useCreateProjectMutation();
  const [projectName, setProjectName] = useState<Data.ProjectName.ProjectName>(
    Data.ProjectName.fromString('My Cool Website')
  );
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  const onCreate = async () => {
    const result = await mutation.mutateAsync({
      ownerId: authUser.userId,
      projectName,
      whilelistedUrls: [],
    });

    if (result.type === 'Ok') {
      snackbar.enqueueSnackbar('project created');
      navigate(routes['/projects/:id'].make(result.value.projectId));
    }
  };

  return (
    <>
      <Toolbar>
        <Box sx={{ flex: 1 }}>
          <Button
            sx={{ marginLeft: -1 }}
            onClick={() => navigate(-1)}
            startIcon={<ChevronLeft />}
          >
            Back
          </Button>
        </Box>
        <Typography noWrap sx={{ flex: 2 }} align="center" variant="h6">
          Create New Project
        </Typography>
        <Box sx={{ flex: 1 }}></Box>
      </Toolbar>

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
          sx={{ marginY: 2 }}
        />

        <LoadingButton
          startIcon={<Create />}
          fullWidth
          variant="contained"
          onClick={onCreate}
          loading={mutation.status === 'loading'}
          sx={{ marginBottom: 2 }}
        >
          Create Project
        </LoadingButton>

        <Grow in={mutation.data?.type === 'Err'}>
          <Box>
            {mutation.data?.type === 'Err' && (
              <Alert severity="error" sx={{ marginBottom: 2 }}>
                {mutation.data.error
                  .map((problem) => problem.message)
                  .join(', ')}
              </Alert>
            )}
          </Box>
        </Grow>
      </Container>
    </>
  );
};
