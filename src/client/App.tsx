import { useEffect, useState } from "react";
import { supabaseClient } from "./supabase";
import { GetScreenshotPage } from "./pages/GetScreenshot";
import { Box, CircularProgress, Typography } from "@mui/material";
import { LoginPage } from "./pages/Login";

export const App = () => {
  const authState = useAuthState();

  switch (authState.type) {
    case "Loading":
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      );

    case "LoggedIn":
      return <GetScreenshotPage />;

    case "LoggedOut":
      return <LoginPage />;
  }
};

type IAuthState =
  | { type: "Loading" }
  | { type: "LoggedIn"; userId: string }
  | { type: "LoggedOut" };

export const useAuthState = () => {
  const [authState, setAuthState] = useState<IAuthState>({ type: "Loading" });

  useEffect(() => {
    const session = supabaseClient.auth.session();

    const userId = session?.user?.id;

    if (userId) {
      setAuthState({ type: "LoggedIn", userId: userId });
      return;
    }
    setAuthState({ type: "LoggedOut" });

    supabaseClient.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id;

      if (userId) {
        setAuthState({ type: "LoggedIn", userId: userId });
        return;
      }
      setAuthState({ type: "LoggedOut" });
    });
  }, []);

  return authState;
};
