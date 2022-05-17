import { CameraAlt, Close } from '@mui/icons-material';
import { Box, Button, Divider, Drawer, Toolbar } from '@mui/material';
import { useState } from 'react';
import { appEventEmitter, useAppEventListener } from './event-emitter';
import { TryPage } from './pages/Try';

export const ScreenshotDrawerButton = () => {
  return (
    <Button
      variant="contained"
      onClick={() => {
        appEventEmitter.emit('OpenedScreenshotDrawer', null);
      }}
      startIcon={<CameraAlt />}
    >
      Try
    </Button>
  );
};

export const ScreenshotDrawer = () => {
  const [state, setState] = useState<'opened' | 'closed'>('closed');

  useAppEventListener('OpenedScreenshotDrawer', () => {
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
