import { Box, Container } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthUserContext, useAuthState } from "./authentication";
import { HomePage } from "./pages/Home";
import { BrandedLoadingPage } from "./pages/Loading";
import { LoginPage } from "./pages/Login";
import { LogoutPage } from "./pages/Logout";
import { NotFoundPage } from "./pages/NotFound";
import { ProjectsPage } from "./pages/Projects";
import { ProjectsCreatePage } from "./pages/ProjectsCreate";
import { ProjectSingleOverviewPage } from "./pages/ProjectSingleOverview";
import { TryPage } from "./pages/Try";
import { ProjectsSinglePage } from "./pages/ProjectsSingle";
import { routes } from "./routes";

export const App = () => {
  return (
    <Container disableGutters maxWidth="md">
      <LoadingAuth />
      <Box sx={{ p: 12 }}></Box>
    </Container>
  );
};

const LoadingAuth = () => {
  const authState = useAuthState();

  switch (authState.type) {
    case "Loading":
      return <BrandedLoadingPage />;

    case "LoggedOut":
      return (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      );

    case "LoggedIn":
      return (
        <AuthUserContext userId={authState.userId}>
          <Routes>
            <Route path={routes["/"].pattern} element={<HomePage />} />

            <Route path={routes["/try"].pattern} element={<TryPage />} />

            <Route
              path={routes["/projects"].pattern}
              element={<ProjectsPage />}
            />

            <Route
              path={routes["/projects/:id"].pattern}
              element={<ProjectsSinglePage />}
            >
              <Route
                path={routes["/projects/:id"].pattern}
                element={<ProjectSingleOverviewPage />}
              />
            </Route>

            <Route
              path={routes["/projects/create"].pattern}
              element={<ProjectsCreatePage />}
            />

            <Route path="/logout" element={<LogoutPage />} />

            <Route
              path="*"
              element={<Navigate to={routes["/projects"].pattern} />}
            />
          </Routes>
        </AuthUserContext>
      );
  }
};
