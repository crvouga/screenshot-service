import { LoadingButton } from '@mui/lab';
import {
  Avatar,
  Button,
  Container,
  TextField, Toolbar,
  Typography
} from '@mui/material';
import { Box } from '@mui/system';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useAuthUser } from '../authentication';
import { profileQueryFilter, useCreateProfileMutation } from '../data-access';
import * as ProfileAvatar from '../profile-avatar';
import { Link, routes } from '../routes';
import {
  ThemeMode,
  ThemeModeToggleButtonGroup,
  useThemeModeContext
} from '../theme';

export const AccountCreatePage = () => {
  const authUser = useAuthUser();

  const [name, setName] = useState(authUser.defaultName);
  const [avatarSeed, setAvatarSeed] = useState<ProfileAvatar.Seed>(
    ProfileAvatar.toSeed(authUser.defaultName)
  );
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const themeModeContext = useThemeModeContext();

  useEffect(() => {
    themeModeContext.setThemeMode(themeMode);
  }, [themeModeContext, themeMode]);

  const avatarUrl = ProfileAvatar.toUrl({
    seed: avatarSeed,
  });

  const mutation = useCreateProfileMutation();

  const snackbar = useSnackbar();

  const queryClient = useQueryClient();

  const onCreate = async () => {
    const result = await mutation.mutateAsync({
      userId: authUser.userId,
      name: name,
      avatarSeed: avatarSeed,
      themeMode: themeMode,
    });

    switch (result.type) {
      case 'Err':
        snackbar.enqueueSnackbar('failed to create profile', {
          variant: 'error',
        });
        return;
      case 'Ok':
        snackbar.enqueueSnackbar('profile created', {
          variant: 'default',
        });
        queryClient.invalidateQueries([profileQueryFilter]);
        return;
    }
  };

  return (
    <>
      <Toolbar>
        <Box sx={{ flex: 1 }}>
          <Link to={routes['/logout'].make()}>
            <Button size="small">Logout</Button>
          </Link>
        </Box>

        <Typography sx={{ flex: 2 }} variant="h6" align="center">
          create profile
        </Typography>

        <Box sx={{ flex: 1 }}></Box>
      </Toolbar>

      <Container maxWidth="sm">
        <Avatar
          src={avatarUrl}
          sx={{ marginX: 'auto', width: 150, height: 150, mb: 4 }}
        />

        <Typography
          color="text.secondary"
          variant="subtitle2"
          sx={{ mb: 1 / 2 }}
        >
          theme mode
        </Typography>

        <ThemeModeToggleButtonGroup
          themeMode={themeMode}
          onThemeModeChanged={setThemeMode}
          sx={{ mb: 4 }}
        />

        <TextField
          value={avatarSeed}
          onChange={(e) =>
            setAvatarSeed(ProfileAvatar.toSeed(e.currentTarget.value))
          }
          label="avatar seed"
          fullWidth
          sx={{ mb: 4 }}
        />

        <TextField
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          label="name"
          fullWidth
          sx={{ mb: 4 }}
        />

        <LoadingButton
          loading={mutation.isLoading}
          onClick={onCreate}
          variant="contained"
          fullWidth
        >
          create profile
        </LoadingButton>
      </Container>
    </>
  );
};
