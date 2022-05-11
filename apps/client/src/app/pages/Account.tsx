import { ChevronLeft, Logout } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
          <Button fullWidth variant="contained" startIcon={<Logout />}>
            Logout
          </Button>
        </Link>
      </Container>
    </>
  );
};
