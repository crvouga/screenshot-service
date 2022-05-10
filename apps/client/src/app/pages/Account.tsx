import { ChevronLeft, ChevronRight, Logout } from '@mui/icons-material';
import {
  ListItemSecondaryAction,
  ListItemIcon,
  ListItemButton,
  List,
  ListItemText,
  IconButton,
  Typography,
  Toolbar,
} from '@mui/material';
import { Link, routes } from '../routes';
import { useNavigate } from 'react-router-dom';

export const AccountPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <Toolbar>
        <IconButton onClick={() => navigate(-1)} edge="start">
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6">Account</Typography>
      </Toolbar>

      <List>
        <Link to={routes['/logout'].make()}>
          <ListItemButton>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
            <ListItemSecondaryAction>
              <ChevronRight />
            </ListItemSecondaryAction>
          </ListItemButton>
        </Link>
      </List>
    </>
  );
};
