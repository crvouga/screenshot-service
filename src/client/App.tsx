import { CameraAlt, Logout } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { GetScreenshotPage } from "./pages/GetScreenshot";
import { LoginPage } from "./pages/Login";
import { supabaseClient } from "./supabase";
import {
  Link,
  Outlet,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { LogoutPage } from "./pages/Logout";
import { LoadingPage } from "./pages/Loading";

const pathnames = {
  "/": "/",
  "/logout": "/logout",
};

export const App = () => {
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
              <Route path={pathnames["/"]} element={<GetScreenshotPage />} />
            </Route>
            <Route path={pathnames["/logout"]} element={<LogoutPage />} />
            <Route path="*" element={<Navigate to={pathnames["/"]} />} />
          </Routes>
        </Box>
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
        <Typography>📸 Screenshot Service</Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItemButton selected={location.pathname === pathnames["/"]}>
          <ListItemIcon>
            <CameraAlt />
          </ListItemIcon>
          <ListItemText primary="Try out" />
        </ListItemButton>

        <Link to={pathnames["/logout"]}>
          <ListItemButton selected={location.pathname === pathnames["/logout"]}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
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
