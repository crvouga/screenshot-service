import { CameraAlt } from '@mui/icons-material';
import { Avatar, Box, Toolbar } from '@mui/material';
import React from 'react';
import { ToggleCaptureScreenshotFormDrawerButton } from '../pages/CaptureScreenshot';
import * as ProfileAvatar from '../profile-avatar';
import { useProfileContext } from '../data-access';
import { Link, routes } from '../routes';

export const Header = () => {
  const { profile } = useProfileContext();
  return (
    <Toolbar>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Link
          to={routes['/'].make()}
          sx={{ display: 'flex', alignItems: 'center', marginLeft: -1 }}
          color="inherit"
          underline="none"
        >
          <CameraAlt sx={{ mr: 1 }} />
          screenshot service
        </Link>
      </Box>

      <Box sx={{ flex: 1 }}></Box>

      <ToggleCaptureScreenshotFormDrawerButton />

      <Link to={routes['/account'].make()}>
        <Avatar
          sx={{ ml: 2 }}
          src={ProfileAvatar.toUrl({
            seed: ProfileAvatar.toSeed(profile.avatarSeed),
          })}
        />
      </Link>
    </Toolbar>
  );
};
