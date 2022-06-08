import { LoadingButton } from '@mui/lab';
import { Box, Paper, TextField, Typography } from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { Project, useUpdateProjectMutation } from '../../../projects';

export const ProjectNameSection = ({ project }: { project: Project }) => {
  const [projectName, setProjectName] = useState(project.projectName);
  const mutation = useUpdateProjectMutation();
  const snackbar = useSnackbar();

  const onSave = async () => {
    const result = await mutation.mutateAsync({
      projectId: project.projectId,
      projectName,
    });

    switch (result.type) {
      case 'Err':
        snackbar.enqueueSnackbar('failed to update project name', {
          variant: 'error',
        });
        return;

      case 'Ok':
        snackbar.enqueueSnackbar('project updated', {
          variant: 'default',
        });

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
        label="project name"
        value={projectName}
        onChange={(event) => {
          const value = event.currentTarget.value;
          const projectName = Data.ProjectName.fromString(value);
          setProjectName(projectName);
        }}
        fullWidth
        sx={{ marginBottom: 2 }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
        <LoadingButton
          variant="contained"
          onClick={onSave}
          disabled={project.projectName === projectName}
          loading={mutation.status === 'loading'}
        >
          save
        </LoadingButton>
      </Box>
    </Paper>
  );
};
