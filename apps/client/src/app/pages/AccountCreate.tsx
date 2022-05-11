import { ChevronLeft } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Avatar,
  Button,
  Container,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { Box } from '@mui/system';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useAuthUser } from '../authentication';
import * as ProfileAvatar from '../profile-avatar';
import * as Profiles from '../profiles';
import { Link, routes } from '../routes';

export const AccountCreatePage = () => {
  const authUser = useAuthUser();

  const [name, setName] = useState(authUser.defaultName);
  const [avatarSeed, setAvatarSeed] = useState<ProfileAvatar.Seed>(
    ProfileAvatar.toSeed(authUser.defaultName)
  );

  const avatarUrl = ProfileAvatar.toUrl({
    seed: avatarSeed,
    style: 'jdenticon',
  });

  const mutation = useMutation(Profiles.create);

  const snackbar = useSnackbar();

  const queryClient = useQueryClient();

  const onCreate = async () => {
    const result = await mutation.mutateAsync({
      userId: authUser.userId,
      name: name,
      avatarUrl: avatarUrl,
    });

    switch (result.type) {
      case 'error':
        snackbar.enqueueSnackbar('failed to create profile', {
          variant: 'error',
        });
        return;
      case 'success':
        snackbar.enqueueSnackbar('profile created', {
          variant: 'default',
        });
        queryClient.invalidateQueries(Profiles.queryFilter);
        queryClient.invalidateQueries(
          Profiles.queryKeys.getOne({ userId: authUser.userId })
        );
        return;
    }
  };

  return (
    <>
      <Toolbar>
        <Box sx={{ flex: 1 }}>
          <Link to={routes['/logout'].make()}>
            <Button sx={{ marginLeft: -2 }} startIcon={<ChevronLeft />}>
              Logout
            </Button>
          </Link>
        </Box>

        <Typography sx={{ flex: 3 }} variant="h6" align="center">
          create profile
        </Typography>

        <Box sx={{ flex: 1 }}></Box>
      </Toolbar>

      <Container maxWidth="sm">
        <Avatar
          src={avatarUrl}
          sx={{ marginX: 'auto', width: 150, height: 150, mb: 4 }}
        />

        <TextField
          value={avatarSeed}
          onChange={(e) =>
            setAvatarSeed(ProfileAvatar.toSeed(e.currentTarget.value))
          }
          label="Avatar Seed"
          fullWidth
          sx={{ mb: 4 }}
        />

        <TextField
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          label="Name"
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
