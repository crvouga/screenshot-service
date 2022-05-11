import { NavigateNext } from '@mui/icons-material';
import { Avatar, Box, Breadcrumbs, Toolbar } from '@mui/material';
import { ReactNode } from 'react';
import { useProfile } from './profiles';
import { Link, routes } from './routes';

export const Header = ({ breadcrumbs }: { breadcrumbs: ReactNode[] }) => {
  const { profile } = useProfile();
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
          <Link to={routes['/'].make()}>📸</Link>
          {breadcrumbs}
        </Breadcrumbs>
      </Box>

      <Box sx={{ flex: 1 }}></Box>

      <Link to={routes['/account'].make()}>
        <Avatar src={profile.avatarUrl} />
      </Link>
    </Toolbar>
  );
};
