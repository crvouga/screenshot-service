import { useEffect, useState } from "react";
import { supabaseClient } from "./supabase";
import { GetScreenshotPage } from "./pages/GetScreenshot";
import { Box, CircularProgress, Typography } from "@mui/material";
import { LoginPage } from "./pages/Login";
import { Session } from "@supabase/supabase-js";

export const App = () => {
  const authState = useAuthState();

  switch (authState.type) {
    case "Loading":
      return <LoadingPage />;

    case "LoggedIn":
      return <GetScreenshotPage />;

    case "LoggedOut":
      return <LoginPage />;
  }
};

const LoadingPage = () => {
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
    setAuthState(toAuthState(supabaseClient.auth.session()));

    supabaseClient.auth.onAuthStateChange((event, session) => {
      setAuthState(toAuthState(session));
    });
  }, []);

  return authState;
};
