import { CameraAlt, NavigateNext } from '@mui/icons-material';
import { Avatar, Box, Breadcrumbs, Toolbar } from '@mui/material';
import React, { ReactNode } from 'react';
import * as ProfileAvatar from './profile-avatar';
import { useProfileContext } from './profiles';
import { Link, routes } from './routes';
import { ScreenshotDrawerButton } from './ScreenshotDrawer';

export const Header = ({ breadcrumbs }: { breadcrumbs: ReactNode[] }) => {
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
        <Breadcrumbs separator={<NavigateNext />}>
          <Link
            to={routes['/'].make()}
            sx={{ display: 'flex', alignItems: 'center' }}
            color="inherit"
          >
            <CameraAlt />
          </Link>
          {React.Children.map(breadcrumbs, (x) => x)}
        </Breadcrumbs>
      </Box>

      <Box sx={{ flex: 1 }}></Box>

      <ScreenshotDrawerButton />

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
