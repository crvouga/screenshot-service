import { ChevronLeft } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  Fade,
  LinearProgress,
  Paper,
  TextField,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import * as ProfileAvatar from '../profile-avatar';
import {
  profileQueryFilter,
  useDeleteProfileMutation,
  useProfileContext,
  useUpdateProfileMutation,
} from '../profiles';
import { Link, routes } from '../routes';
import {
  IThemeMode,
  ThemeModeToggleButtonGroup,
  useThemeModeContext,
} from '../theme';

export const AccountPage = () => {
  const navigate = useNavigate();
  const { profile } = useProfileContext();

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
          {profile.name}
        </Typography>
        <Box sx={{ flex: 1 }}></Box>
      </Toolbar>

      <Container maxWidth="sm">
        <AvatarSection />

        <ThemeSection />

        <NameSection />

        <LogoutSection />

        <DeleteSection />
      </Container>
    </>
  );
};

//
//
//
//
//
//
//
//
//

const DeleteSection = () => {
  const { profile } = useProfileContext();
  const theme = useTheme();
  const mutation = useDeleteProfileMutation();
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
        snackbar.enqueueSnackbar('deleted profile', { variant: 'default' });
        queryClient.invalidateQueries(profileQueryFilter);
        return;
    }
  };
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px ${theme.palette.error.main} solid`,
        mb: 4,
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

//
//
//
//
//
//
//
//
//

const NameSection = () => {
  const { profile } = useProfileContext();
  const mutation = useUpdateProfileMutation();
  const snackbar = useSnackbar();
  const [name, setName] = useState(profile.name);
  const queryClient = useQueryClient();

  const onSave = async () => {
    const response = await mutation.mutateAsync({
      userId: profile.userId,
      name: name,
    });

    switch (response.type) {
      case 'error':
        snackbar.enqueueSnackbar('failed to change name', {
          variant: 'error',
        });
        return;

      case 'success':
        snackbar.enqueueSnackbar('changed name');
        queryClient.invalidateQueries(profileQueryFilter);
        return;
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 4,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        name
      </Typography>

      <TextField
        fullWidth
        sx={{ mb: 2 }}
        onChange={(e) => setName(e.currentTarget.value)}
        label="name"
        value={name}
      />

      <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
        <LoadingButton
          variant="contained"
          onClick={onSave}
          disabled={name === profile.name}
          loading={mutation.isLoading}
        >
          save
        </LoadingButton>
      </Box>
    </Paper>
  );
};

//
//
//
//
//
//
//
//
//

const AvatarSection = () => {
  const { profile } = useProfileContext();
  const mutation = useUpdateProfileMutation();
  const snackbar = useSnackbar();

  const [seed, setSeed] = useState(ProfileAvatar.toSeed(profile.avatarSeed));

  const avatarUrl = ProfileAvatar.toUrl({ seed });

  const queryClient = useQueryClient();

  const onSave = async () => {
    const response = await mutation.mutateAsync({
      userId: profile.userId,
      avatarSeed: seed,
    });

    switch (response.type) {
      case 'error':
        snackbar.enqueueSnackbar('failed to change avatar', {
          variant: 'error',
        });
        return;

      case 'success':
        snackbar.enqueueSnackbar('changed avatar');
        queryClient.invalidateQueries(profileQueryFilter);
        return;
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 4,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        avatar
      </Typography>

      <Avatar
        src={avatarUrl}
        sx={{ width: 150, height: 150, marginX: 'auto', mb: 4 }}
      />

      <TextField
        fullWidth
        sx={{ mb: 2 }}
        onChange={(e) => setSeed(ProfileAvatar.toSeed(e.currentTarget.value))}
        label="avatar seed"
        value={seed}
      />

      <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
        <LoadingButton
          variant="contained"
          onClick={onSave}
          disabled={profile.avatarSeed === seed}
          loading={mutation.isLoading}
        >
          save
        </LoadingButton>
      </Box>
    </Paper>
  );
};

//
//
//
//
//
//
//
//
//

const LogoutSection = () => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 4,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        logout
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
        <Link to={routes['/logout'].make()}>
          <Button variant="contained">Logout</Button>
        </Link>
      </Box>
    </Paper>
  );
};

//
//
//
//
//
//
//
//
//

const ThemeSection = () => {
  const snackbar = useSnackbar();
  const { themeMode, setThemeMode } = useThemeModeContext();
  const { profile } = useProfileContext();
  const mutation = useUpdateProfileMutation();
  const queryClient = useQueryClient();

  const onThemeModeChanged = async (nextThemeMode: IThemeMode) => {
    const result = await mutation.mutateAsync({
      userId: profile.userId,
      themeMode: nextThemeMode,
    });

    switch (result.type) {
      case 'error':
        setThemeMode(profile.themeMode);
        snackbar.enqueueSnackbar('failed to change theme', {
          variant: 'error',
        });
        return;

      case 'success':
        snackbar.enqueueSnackbar('changed theme');
        queryClient.invalidateQueries(profileQueryFilter);
        setThemeMode(nextThemeMode);
        return;
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 4,
      }}
    >
      <Fade in={mutation.isLoading}>
        <LinearProgress />
      </Fade>

      <Box sx={{ p: 2 }}>
        <Typography sx={{ mb: 2 }} variant="h6">
          theme
        </Typography>

        <ThemeModeToggleButtonGroup
          disabled={mutation.isLoading}
          themeMode={themeMode}
          onThemeModeChanged={onThemeModeChanged}
          sx={{ mb: 2 }}
        />
      </Box>
    </Paper>
  );
};
