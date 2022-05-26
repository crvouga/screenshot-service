import { CameraAlt, Close } from '@mui/icons-material';
import { Box, Button, Divider, Drawer, Toolbar } from '@mui/material';
import { useState } from 'react';
import { appEventEmitter, useAppEventListener } from '../../app-event-emitter';
import { TryPage } from '.';
import useLocalStorage from '../../../lib/use-local-storage';

export const TryDrawerButton = () => {
  return (
    <Button
      variant="contained"
      onClick={() => {
        appEventEmitter.emit('OpenedTryDrawer', null);
      }}
      startIcon={<CameraAlt />}
    >
      Try
    </Button>
  );
};

export const TryDrawer = () => {
  const [state, setState] = useLocalStorage<'opened' | 'closed'>(
    'tryDrawerState',
    'closed'
  );

  useAppEventListener('OpenedTryDrawer', () => {
    setState('opened');
  });

  const onClose = () => {
    setState('closed');
  };

  return (
    <Drawer
      open={state === 'opened'}
      anchor="right"
      keepMounted
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 'sm',
          overflow: 'hidden',
        },
      }}
      onClose={() => {
        onClose();
      }}
    >
      <Toolbar>
        <Button
          onClick={() => {
            onClose();
          }}
          sx={{ marginLeft: -1 }}
          startIcon={<Close />}
          size="large"
        >
          Close
        </Button>
      </Toolbar>

      <Divider />

      <Box
        sx={{
          width: '100%',
          height: '100%',
          overflowY: 'scroll',
          paddingBottom: 4,
          paddingX: 2,
          paddingTop: 2,
        }}
      >
        <TryPage />
      </Box>
    </Drawer>
  );
};
