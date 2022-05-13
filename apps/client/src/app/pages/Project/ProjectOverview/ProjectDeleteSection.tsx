import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import * as Projects from '../../../projects';
import { routes } from '../../../routes';

export const ProjectDeleteSection = ({ projectId }: { projectId: string }) => {
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
