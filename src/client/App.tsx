import { CameraAlt, Logout, Web } from "@mui/icons-material";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthUserContext, useAuthState } from "./auth";
import { BrandedLoadingPage, LoadingPage } from "./pages/Loading";
import { LoginPage } from "./pages/Login";
import { LogoutPage } from "./pages/Logout";
import { NotFoundPage } from "./pages/NotFound";
import { ProjectsPage } from "./pages/Projects";
import { ProjectsCreatePage } from "./pages/ProjectsCreate";
import { ProjectsSinglePage } from "./pages/ProjectsSingle";
import { ScreenshotPage } from "./pages/Screenshot";
import { isMatch, routes } from "./routes";

export const App = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        maxWidth: "lg",
        position: "fixed",
        width: "100%",
        height: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        border: `1px solid ${theme.palette.divider}`,
        display: "flex",
      }}
    >
      <LoadingAuth />
    </Box>
  );
};

const LoadingAuth = () => {
  const authState = useAuthState();

  const theme = useTheme();

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
          <Box
            sx={{
              maxWidth: "lg",
              position: "fixed",
              width: "100%",
              height: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              border: `1px solid ${theme.palette.divider}`,
              display: "flex",
            }}
          >
            <Routes>
              <Route path="/" element={<Main />}>
                <Route path="/screenshot" element={<ScreenshotPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route
                  path="/projects/create"
                  element={<ProjectsCreatePage />}
                />
                <Route
                  path={routes["/projects/:id"].pattern}
                  element={<ProjectsSinglePage />}
                />
                <Route
                  path="*"
                  element={<NotFoundPage message="page not found" />}
                />
              </Route>
              <Route path="/logout" element={<LogoutPage />} />
            </Routes>
          </Box>
        </AuthUserContext>
      );
  }
};

const Main = () => {
  return (
    <>
      <SideNav />

      <Box sx={{ flex: 1, height: "100%", overflowY: "scroll" }}>
        <Outlet />
      </Box>
    </>
  );
};

const SideNav = () => {
  const drawerWidth = 240;
  const theme = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const location = useLocation();

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar>
        <Typography variant="h2" sx={{ marginRight: 2 }}>
          📸
        </Typography>
        <Box>
          <Typography>screenshot</Typography>
          <Typography>service</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        <Link to={routes["/projects"].make()}>
          <ListItemButton
            selected={isMatch(location.pathname, routes["/projects"])}
          >
            <ListItemIcon>
              <Web />
            </ListItemIcon>
            <ListItemText primary="projects" />
          </ListItemButton>
        </Link>

        <Link to={routes["/screenshot"].make()}>
          <ListItemButton
            selected={isMatch(location.pathname, routes["/screenshot"])}
          >
            <ListItemIcon>
              <CameraAlt />
            </ListItemIcon>
            <ListItemText primary="try it out" />
          </ListItemButton>
        </Link>

        <Link to={routes["/logout"].make()}>
          <ListItemButton
            selected={isMatch(location.pathname, routes["/logout"])}
          >
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="logout" />
          </ListItemButton>
        </Link>
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ height: "100%", width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Box
        sx={{
          display: { xs: "none", sm: "block" },
          width: drawerWidth,
          height: "100%",
          zIndex: 2,
          borderRight: `1px solid ${theme.palette.divider}`,
        }}
      >
        {drawer}
      </Box>
    </Box>
  );
};
