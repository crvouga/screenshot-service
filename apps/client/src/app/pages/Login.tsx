import { CameraAlt, Google } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Container, Typography } from '@mui/material';
import { useState } from 'react';
import { supabaseClient } from '../supabase-client';

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
      <Container maxWidth="xs" sx={{ textAlign: 'center' }}>
        <CameraAlt sx={{ width: 64, height: 64, marginBottom: -1 }} />

        <Typography variant="h4" align="center" sx={{ marginBottom: 2 }}>
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
