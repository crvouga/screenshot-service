import {
  Alert,
  AlertTitle,
  Box,
  CircularProgress,
  InputAdornment,
  ListItemText,
  MenuItem,
  Select,
  SelectProps,
  Typography,
} from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { useEffect } from 'react';
import { appEventEmitter } from '../../app-event-emitter';
import { useAuthUser } from '../../authentication/use-auth-state';
import { CreateProjectCallToAction } from '../../components/CreateProjectCallToAction';
import { Project, useProjectsQuery } from '../../data-access';

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
            return (
              <CreateProjectCallToAction
                onClickLink={() =>
                  appEventEmitter.emit(
                    'ToggleCaptureScreenshotFormDrawer',
                    'closed'
                  )
                }
              />
            );
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
