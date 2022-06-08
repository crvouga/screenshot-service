import { CameraAlt, Create } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CircularProgress,
  InputAdornment,
  ListItemText,
  MenuItem,
  Select,
  SelectProps,
  Typography,
} from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appEventEmitter } from '../../app-event-emitter';
import { useAuthUser } from '../../authentication';
import { Project, useProjectsQuery } from '../../projects';
import { routes } from '../../routes';

const emptyValue = 'Empty';

type Props = {
  projectId: Data.ProjectId.ProjectId | null;
  setProjectId: (projectId: Data.ProjectId.ProjectId | null) => void;
  helperText?: string;
  SelectProps?: SelectProps;
};

export const ProjectInput = ({
  projectId,
  setProjectId,
  helperText,
  SelectProps,
}: Props) => {
  const authUser = useAuthUser();
  const query = useProjectsQuery({ ownerId: authUser.userId });

  switch (query.status) {
    case 'error':
      return <Err message="Something went wrong for an unknown reason" />;

    case 'idle':
      return <Loading />;

    case 'loading':
      return <Loading />;

    case 'success':
      switch (query.data.type) {
        case 'Err':
          return (
            <Err
              message={query.data.error
                .map((problem) => problem.message)
                .join('. ')}
            />
          );

        case 'Ok': {
          const projects = query.data.value;

          if (projects.length === 0) {
            return <CreateProjectCallToAction />;
          }
          return (
            <Loaded
              projects={projects}
              projectId={projectId}
              setProjectId={setProjectId}
              helperText={helperText}
              SelectProps={SelectProps}
            />
          );
        }
      }
  }
};

const Loaded = ({
  projectId,
  setProjectId,
  helperText,
  projects,
  SelectProps,
}: Props & { projects: Project[] }) => {
  const selectedProject =
    projects.find((project) => project.projectId === projectId) ?? projects[0];

  useEffect(() => {
    setProjectId(selectedProject.projectId);
  }, []);

  const currentValue = selectedProject.projectId;

  return (
    <Box>
      <Select
        fullWidth
        value={currentValue}
        placeholder="select a project"
        {...SelectProps}
      >
        {projects.map((project) => (
          <MenuItem
            value={project.projectId}
            key={project.projectId}
            onClick={() => {
              setProjectId(project.projectId);
            }}
          >
            <ListItemText primary={project.projectName} />
          </MenuItem>
        ))}
      </Select>

      {helperText && (
        <Typography
          color={SelectProps?.error ? 'error' : 'inherit'}
          variant="caption"
          sx={{ marginX: 1.5 }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

const CreateProjectCallToAction = () => {
  return (
    <Card sx={{ width: '100%', textAlign: 'center', p: 4 }}>
      {/* <CameraAlt sx={{ width: 64, height: 64 }} /> */}

      <Typography align="center" variant="h4" sx={{ mb: 1 }}>
        You don't have any projects.
      </Typography>

      <Typography align="center" color="text.secondary" sx={{ mb: 2 }}>
        You have to create a project before capturing any screenshots
      </Typography>

      <Link
        to={routes['/projects/create'].make()}
        onClick={() => {
          appEventEmitter.emit('ToggleCaptureScreenshotFormDrawer', 'closed');
        }}
      >
        <Button
          fullWidth
          startIcon={<Create />}
          variant="contained"
          size="large"
        >
          create a new project
        </Button>
      </Link>
    </Card>
  );
};

const Err = ({ message }: { message: string }) => {
  return (
    <Alert severity="error">
      <AlertTitle>Failed to load projects</AlertTitle>
      {message}
    </Alert>
  );
};

const Loading = () => {
  return (
    <Select
      fullWidth
      disabled
      value="Loading"
      endAdornment={
        <InputAdornment position="end" sx={{ marginRight: 3 }}>
          <CircularProgress size="2rem" />
        </InputAdornment>
      }
    >
      <MenuItem value="Loading" sx={{ display: 'flex' }}>
        <ListItemText
          primaryTypographyProps={{ color: 'text.secondary' }}
          primary={'Loading projects...'}
        />
      </MenuItem>
    </Select>
  );
};
