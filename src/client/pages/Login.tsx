import { Google } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Box, Container, Paper, Typography } from "@mui/material";
import { useState } from "react";
import { supabaseClient } from "../supabase";

type IState = { type: "Loading" } | { type: "Idle" };

export const LoginPage = () => {
  const [state, setState] = useState<IState>({ type: "Idle" });

  const loginWithGoogle = async () => {
    setState({ type: "Loading" });

    await supabaseClient.auth.signIn({ provider: "google" });

    setState({ type: "Idle" });
  };

  return (
    <Box
      sx={{
        position: "fixed",
        width: "100%",
        height: "80%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="h1" align="center">
          📸
        </Typography>
        <Typography variant="h3" align="center" sx={{ marginBottom: 4 }}>
          Screenshot Service
        </Typography>

        <LoadingButton
          startIcon={<Google />}
          variant="contained"
          size="large"
          fullWidth
          onClick={loginWithGoogle}
          loading={state.type === "Loading"}
        >
          Continue with Google
        </LoadingButton>
      </Container>
    </Box>
  );
};
