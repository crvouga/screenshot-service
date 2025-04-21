import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteProjectMutation } from '../../../data-access';
import { routes } from '../../../routes';

export const ProjectDeleteSection = ({
  projectId,
  projectName,
}: {
  projectId: Data.ProjectId.ProjectId;
  projectName: Data.ProjectName.ProjectName;
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const onCancel = () => {
    setOpen(false);
  };
  const navigate = useNavigate();
  const mutation = useDeleteProjectMutation();
  const snackbar = useSnackbar();
  const [inputValue, setInputValue] = useState('');

  const verifyPhrase = `delete ${projectName} forever`;

  const canDelete = inputValue === verifyPhrase;

  const onDelete = async () => {
    if (!canDelete) {
      return;
    }

    const result = await mutation.mutateAsync({ projectId });

    switch (result.type) {
      case 'Err':
        snackbar.enqueueSnackbar(
          result.error?.map((error) => error.message).join(', ') ??
            'failed to delete project',
          {
            variant: 'error',
          }
        );
        return;

      case 'Ok':
        snackbar.enqueueSnackbar('project deleted', { variant: 'default' });
        navigate(routes['/projects'].make());
    }
  };

  return (
    <Card
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

        <DialogContent>
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            This action is not reversible. Please be certain.
          </Alert>

          <Alert severity="warning" sx={{ marginBottom: 2 }}>
            Deleting will break websites using this project's id.
          </Alert>

          <Typography color="text.secondary" sx={{ fontWeight: 400 }}>
            To verify, type "
            <Box
              component="span"
              sx={{ color: 'text.primary', fontWeight: 900 }}
            >
              {verifyPhrase}
            </Box>
            " below:
          </Typography>
          <TextField
            fullWidth
            onChange={(event) => setInputValue(event.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button color="inherit" onClick={onCancel}>
            cancel
          </Button>
          <LoadingButton
            variant="contained"
            onClick={onDelete}
            color="error"
            loading={mutation.status === 'loading'}
            disabled={!canDelete}
          >
            delete forever
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
