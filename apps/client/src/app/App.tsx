import { Box } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthUserContext, useAuthState, useAuthUser } from './authentication';
import { BrandedLoadingPage } from './components/Loading';
import { AccountPage } from './pages/Account';
import { AccountCreatePage } from './pages/AccountCreate';
import { CaptureScreenshotFormDrawer } from './pages/CaptureScreenshot';
import { LoginPage } from './pages/Login';
import { LogoutPage } from './pages/Logout';
import {
  ProjectOverviewTab,
  ProjectPage,
  ProjectScreenshotsTab,
} from './pages/Project';
import { ProjectsCreatePage } from './pages/ProjectCreate';
import { ProjectsPage } from './pages/Projects';
import * as Profiles from './data-access';
import { routes } from './routes';

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
        case 'Err':
          return <Box>
            {result.error.map(problem => problem.message).join(", ")}
          </Box>

        case 'Ok': {
          const profile = result.value

          if (profile) {
            return (
              <Profiles.ProfileContext profile={profile}>
                <Loaded />
              </Profiles.ProfileContext>
            )
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
            path={routes['/projects/:id/screenshots'].pattern}
            element={<ProjectScreenshotsTab />}
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
