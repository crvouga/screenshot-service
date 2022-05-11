import { ChevronLeft, Logout } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  useTheme,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import * as Profiles from '../profiles';
import { Link, routes } from '../routes';

export const AccountPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <Toolbar>
        <Box sx={{ flex: 1 }}>
          <IconButton onClick={() => navigate(-1)} edge="start">
            <ChevronLeft />
          </IconButton>
        </Box>
        <Typography sx={{ flex: 2 }} align="center" variant="h6">
          Account
        </Typography>
        <Box sx={{ flex: 1 }}></Box>
      </Toolbar>

      <Container maxWidth="sm">
        <Link to={routes['/logout'].make()}>
          <Button
            sx={{ mt: 2 }}
            fullWidth
            variant="contained"
            startIcon={<Logout />}
          >
            Logout
          </Button>
        </Link>

        <DeleteSection />
      </Container>
    </>
  );
};

//
//
//
//
// Delete Section
//
//
//
//

const DeleteSection = () => {
  const { profile } = Profiles.useProfile();
  const theme = useTheme();
  const navigate = useNavigate();
  const mutation = useMutation(Profiles.remove);
  const snackbar = useSnackbar();
  const [open, setOpen] = useState(false);

  const onCancel = () => {
    setOpen(false);
  };

  const queryClient = useQueryClient();

  const onDelete = async () => {
    const response = await mutation.mutateAsync(profile);

    switch (response.type) {
      case 'error':
        snackbar.enqueueSnackbar('failed to delete profile', {
          variant: 'error',
        });
        return;

      case 'success':
        snackbar.enqueueSnackbar('profile deleted', { variant: 'success' });
        queryClient.invalidateQueries(Profiles.queryFilter);
        queryClient.invalidateQueries(Profiles.queryKeys.getOne(profile));
        return;
    }
  };
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px ${theme.palette.error.main} solid`,
        marginTop: 4,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        delete profile forever
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
