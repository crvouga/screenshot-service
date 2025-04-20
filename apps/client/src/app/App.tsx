import { Box } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  AuthUserContext,
  useAuthState,
  useAuthUser,
} from './authentication/use-auth-state';
import { BrandedLoadingPage } from './components/Loading';
import {
  ConfigurationContext,
  ProfileContext,
  useProfileQuery,
  useQueryConfiguration,
} from './data-access';
import { AccountPage } from './pages/Account';
import { AccountCreatePage } from './pages/AccountCreate';
import { CaptureScreenshotFormDrawer } from './pages/CaptureScreenshot';
import { LoginPage } from './pages/Login';
import { LogoutPage } from './pages/Logout';
import {
  ProjectOverviewTab,
  ProjectPage,
  ProjectUsageTab,
} from './pages/Project';
import { ProjectsCreatePage } from './pages/ProjectCreate';
import { ProjectsPage } from './pages/Projects';
import { routes } from './routes';

export const App = () => {
  return (
    <Box
      sx={{
        maxWidth: 'sm',
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
          <LoadingConfiguration />
        </AuthUserContext>
      );
  }
};

const LoadingConfiguration = () => {
  const query = useQueryConfiguration();

  switch (query.status) {
    case 'error':
      return <BrandedLoadingPage />;

    case 'loading':
      return <BrandedLoadingPage />;

    case 'success': {
      const result = query.data;

      switch (result.type) {
        case 'Err':
          return (
            <Box>
              {result.error.map((problem) => problem.message).join(', ')}
            </Box>
          );

        case 'Ok': {
          const configuration = result.value;

          return (
            <ConfigurationContext configuration={configuration}>
              <LoadingProfile />
            </ConfigurationContext>
          );
        }
      }
    }
  }
};

const LoadingProfile = () => {
  const authUser = useAuthUser();
  const query = useProfileQuery(authUser);

  switch (query.status) {
    case 'error':
      return <BrandedLoadingPage />;

    case 'loading':
      return <BrandedLoadingPage />;

    case 'success': {
      const result = query.data;

      switch (result.type) {
        case 'Err':
          return (
            <Box>
              {result.error.map((problem) => problem.message).join(', ')}
            </Box>
          );

        case 'Ok': {
          const profile = result.value;

          if (profile) {
            return (
              <ProfileContext profile={profile}>
                <Loaded />
              </ProfileContext>
            );
          }

          return (
            <Routes>
              <Route path="/account/create" element={<AccountCreatePage />} />
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="*" element={<Navigate to="/account/create" />} />
            </Routes>
          );
        }
      }
    }
  }
};

export const Loaded = () => {
  return (
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
      <CaptureScreenshotFormDrawer />

      <Routes>
        <Route path={routes['/'].pattern} element={<ProjectsPage />} />

        <Route path={routes['/account'].pattern} element={<AccountPage />} />

        <Route path={routes['/projects'].pattern} element={<ProjectsPage />} />

        <Route path={routes['/projects/:id'].pattern} element={<ProjectPage />}>
          <Route
            path={routes['/projects/:id'].pattern}
            element={<ProjectOverviewTab />}
          />
          <Route
            path={routes['/projects/:id/usage'].pattern}
            element={<ProjectUsageTab />}
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
    </Box>
  );
};
