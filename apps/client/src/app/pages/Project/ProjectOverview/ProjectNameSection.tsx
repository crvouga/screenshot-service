import { LoadingButton } from '@mui/lab';
import { Box, Paper, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import * as Projects from '../../../projects';

export const ProjectNameSection = ({
  project,
}: {
  project: Projects.IProject;
}) => {
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
