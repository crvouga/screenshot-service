import { CameraAlt, Close } from '@mui/icons-material';
import { Box, Button, Divider, Drawer, Toolbar } from '@mui/material';
import useLocalStorage from '../../../lib/use-local-storage';
import { appEventEmitter, useAppEventListener } from '../../app-event-emitter';
import { CaptureScreenshotForm } from './CaptureScreenshotForm';

export const ToggleCaptureScreenshotFormDrawerButton = () => {
  return (
    <Button
      variant="contained"
      onClick={() => {
        appEventEmitter.emit('ToggleCaptureScreenshotFormDrawer', null);
      }}
      startIcon={<CameraAlt />}
    >
      Try
    </Button>
  );
};

export const CaptureScreenshotFormDrawer = () => {
  const [state, setState] = useLocalStorage<'opened' | 'closed'>(
    'captureScreenshotFormDrawerStatus',
    'closed'
  );

  useAppEventListener('ToggleCaptureScreenshotFormDrawer', () => {
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
        <CaptureScreenshotForm />
      </Box>
    </Drawer>
  );
};
