import { CameraAlt } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
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
        <Breadcrumbs>
          <Link to={routes['/'].make()}>
            <Typography variant="h4">📸</Typography>
          </Link>
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
