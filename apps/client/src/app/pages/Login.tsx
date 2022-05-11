import { Google } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Container, Typography } from '@mui/material';
import { useState } from 'react';
import { supabaseClient } from '../supabase';

type IState = { type: 'Loading' } | { type: 'Idle' };

export const LoginPage = () => {
  const [state, setState] = useState<IState>({ type: 'Idle' });

  const loginWithGoogle = async () => {
    setState({ type: 'Loading' });

    const redirectTo = window.location.origin;

    await supabaseClient.auth.signIn({ provider: 'google' }, { redirectTo });
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="h1" align="center">
          📸
        </Typography>
        <Typography variant="h5" align="center" sx={{ marginBottom: 4 }}>
          screenshot service
        </Typography>

        <LoadingButton
          startIcon={<Google />}
          variant="contained"
          size="large"
          fullWidth
          onClick={loginWithGoogle}
          loading={state.type === 'Loading'}
        >
          continue with google
        </LoadingButton>
      </Container>
    </Box>
  );
};
