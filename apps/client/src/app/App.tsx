import { CameraAlt, Close } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  Drawer,
  Fab,
  Toolbar,
  useTheme,
} from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthUserContext, useAuthState, useAuthUser } from './authentication';
import { AccountPage } from './pages/Account';
import { AccountCreatePage } from './pages/AccountCreate';
import { BrandedLoadingPage } from './pages/Loading';
import { LoginPage } from './pages/Login';
import { LogoutPage } from './pages/Logout';
import { ProjectsPage } from './pages/Projects';
import { ProjectsCreatePage } from './pages/ProjectsCreate';
import { ProjectSingleOverviewPage } from './pages/ProjectSingleOverview';
import { ProjectsSinglePage } from './pages/ProjectsSingle';
import { ProjectSingleScreenshotsPage } from './pages/ProjectsSingleScreenshots';
import { TryPage } from './pages/Try';
import * as Profiles from './profiles';
import { Link, routes, useLocation, useNavigate } from './routes';

export const App = () => {
  return (
    <Box
      sx={{
        maxWidth: 'md',
        position: 'fixed',
        width: '100%',
        height: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <LoadingAuth />
    </Box>
  );
};

const LoadingAuth = () => {
  const authState = useAuthState();

  switch (authState.type) {
    case 'Loading':
      return <BrandedLoadingPage />;

    case 'LoggedOut':
      return (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      );

    case 'LoggedIn':
      return (
        <AuthUserContext
          userId={authState.userId}
          defaultName={authState.defaultName}
        >
          <LoadingProfile />
        </AuthUserContext>
      );
  }
};

const LoadingProfile = () => {
  const authUser = useAuthUser();

  const query = Profiles.useProfileQuery(authUser);

  switch (query.status) {
    case 'error':
      return <BrandedLoadingPage />;

    case 'idle':
      return <BrandedLoadingPage />;

    case 'loading':
      return <BrandedLoadingPage />;

    case 'success': {
      const result = query.data;

      switch (result.type) {
        case 'error':
          return <BrandedLoadingPage />;

        case 'not-found':
          return (
            <Routes>
              <Route path="/account/create" element={<AccountCreatePage />} />
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="*" element={<Navigate to="/account/create" />} />
            </Routes>
          );

        case 'found':
          return (
            <Profiles.ProfileContext profile={result.profile}>
              <Loaded />
            </Profiles.ProfileContext>
          );
      }
    }
  }
};

export const Loaded = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'scroll',
        }}
      >
        <Routes>
          <Route path={routes['/'].pattern} element={<ProjectsPage />} />

          <Route path={routes['/try'].pattern} element={<TryPage />} />

          <Route path={routes['/account'].pattern} element={<AccountPage />} />

          <Route
            path={routes['/projects'].pattern}
            element={<ProjectsPage />}
          />

          <Route
            path={routes['/projects/:id'].pattern}
            element={<ProjectsSinglePage />}
          >
            <Route
              path={routes['/projects/:id'].pattern}
              element={<ProjectSingleOverviewPage />}
            />
            <Route
              path={routes['/projects/:id/screenshots'].pattern}
              element={<ProjectSingleScreenshotsPage />}
            />
          </Route>

          <Route
            path={routes['/projects/create'].pattern}
            element={<ProjectsCreatePage />}
          />

          <Route path="/logout" element={<LogoutPage />} />

          <Route
            path="*"
            element={<Navigate to={routes['/projects'].pattern} />}
          />
        </Routes>

        <Box sx={{ p: 8 }}></Box>
      </Box>

      <Link to={location.pathname} state="try-drawer-opened">
        <Fab
          variant="extended"
          sx={{
            position: 'absolute',
            bottom: theme.spacing(4),
            right: theme.spacing(2),
          }}
        >
          <CameraAlt sx={{ mr: 1 }} />
          Try
        </Fab>
      </Link>

      <Drawer
        open={location.state === 'try-drawer-opened'}
        anchor="right"
        keepMounted
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 'sm',
            overflow: 'hidden',
          },
        }}
        onClose={() => {
          navigate({ to: location.pathname, state: 'closed' });
        }}
      >
        <Toolbar>
          <Link to={location.pathname} state="closed">
            <Button sx={{ marginLeft: -1 }} startIcon={<Close />} size="large">
              Close
            </Button>
          </Link>
        </Toolbar>

        <Divider />

        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflowY: 'scroll',
            paddingBottom: 4,
            paddingX: 2,
            paddingTop: 2,
          }}
        >
          <TryPage />
        </Box>
      </Drawer>
    </>
  );
};
