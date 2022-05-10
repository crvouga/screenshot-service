import { Web, CameraAlt, Logout } from "@mui/icons-material";
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
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthUserContext } from "./Auth";
import { ScreenshotPage } from "./pages/Screenshot";
import { LoadingPage } from "./pages/Loading";
import { LoginPage } from "./pages/Login";
import { LogoutPage } from "./pages/Logout";
import { ProjectsPage } from "./pages/Projects";
import { supabaseClient } from "./supabase";

const pathnames = {
  "/": "/",
  "/screenshot": "/screenshot",
  "/logout": "/logout",
  "/projects": "/projects",
};

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
      return <LoadingPage />;

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
              </Route>
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="*" element={<Navigate to="/" />} />
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
        <Link to={pathnames["/projects"]}>
          <ListItemButton
            selected={location.pathname === pathnames["/projects"]}
          >
            <ListItemIcon>
              <Web />
            </ListItemIcon>
            <ListItemText primary="projects" />
          </ListItemButton>
        </Link>

        <Link to={pathnames["/screenshot"]}>
          <ListItemButton
            selected={location.pathname === pathnames["/screenshot"]}
          >
            <ListItemIcon>
              <CameraAlt />
            </ListItemIcon>
            <ListItemText primary="try it out" />
          </ListItemButton>
        </Link>

        <Link to={pathnames["/logout"]}>
          <ListItemButton selected={location.pathname === pathnames["/logout"]}>
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

//
//
//
//
// Auth
//
//
//
//

type IAuthState =
  | { type: "Loading" }
  | { type: "LoggedIn"; userId: string }
  | { type: "LoggedOut" };

const toAuthState = (session: Session | null): IAuthState => {
  const userId = session?.user?.id;

  if (userId) {
    return { type: "LoggedIn", userId: userId };
  }

  return { type: "LoggedOut" };
};

export const useAuthState = () => {
  const [authState, setAuthState] = useState<IAuthState>({ type: "Loading" });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAuthState(toAuthState(supabaseClient.auth.session()));
    }, 1000);

    supabaseClient.auth.onAuthStateChange((event, session) => {
      clearTimeout(timeout);
      setAuthState(toAuthState(session));
    });
  }, []);

  return authState;
};
