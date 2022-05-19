import {
  All_DELAY_SEC,
  castTargetUrl,
  generateUuid,
  IApiErrorBody,
  IDelaySec,
  IImageType,
  ILogLevel,
  IProjectId,
  IScreenshotId,
  toDelaySec,
} from '@crvouga/screenshot-service';
import { Cancel, SettingsInputAntennaTwoTone } from '@mui/icons-material';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import DownloadIcon from '@mui/icons-material/Download';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Divider,
  ListItemText,
  MenuItem,
  Paper,
  PaperProps,
  Select,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import * as React from 'react';
import { useState } from 'react';
import { screenshotClient } from '../../screenshot-service';
import { getScreenshotSrc } from '../../screenshots';
import { ProjectInput } from './ProjectInput';
import { TargetUrlInput } from './TargetUrlInput';

type ILog = { level: ILogLevel; message: string };

type IQueryState =
  | { type: 'idle' }
  | { type: 'loading'; logs: ILog[] }
  | { type: 'error'; errors: IApiErrorBody; logs: ILog[] }
  | { type: 'success'; src: string; logs: ILog[] };

export const TryPage = () => {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [imageType, setImageType] = useState<IImageType>('jpeg');
  const [delaySec, setDelaySec] = useState<IDelaySec>(0);
  const [projectId, setProjectId] = useState<IProjectId | null>(null);
  const [query, setQuery] = useState<IQueryState>({ type: 'idle' });

  const appendLog = (log: ILog) => {
    setQuery((query) => {
      if (query.type === 'loading') {
        return {
          ...query,
          logs: [...query.logs, log],
        };
      }

      return query;
    });
  };

  const submit = async () => {
    const requestId = generateUuid();

    setQuery({ type: 'loading', logs: [] });

    if (!projectId) {
      setQuery({
        type: 'error',
        logs: [],
        errors: [{ message: 'project is required' }],
      });
      return;
    }

    const targetUrlResult = castTargetUrl(targetUrl);

    if (targetUrlResult.type === 'error') {
      setQuery({ type: 'error', logs: [], errors: targetUrlResult.errors });
      return;
    }

    const request = {
      requestId: requestId,
      projectId: projectId,
      targetUrl: targetUrlResult.data,
      imageType: imageType,
      delaySec: delaySec,
    };

    console.log('EMIT requestScreenshot', request);

    screenshotClient.socket.emit('requestScreenshot', request);

    const logs: ILog[] = [];

    const onLog = (level: ILogLevel, message: string) => {
      const log: ILog = { level, message };
      console.log(log);
      logs.push(log);
      appendLog(log);
    };

    screenshotClient.socket.on('log', onLog);

    type IResponse =
      | { type: 'failed'; errors: { message: string }[] }
      | {
          type: 'succeeded';
          screenshotId: IScreenshotId;
          imageType: IImageType;
        };

    const response = await new Promise<IResponse>((resolve) => {
      screenshotClient.socket.once('requestScreenshotFailed', (errors) => {
        resolve({ type: 'failed', errors });
      });

      screenshotClient.socket.once('requestScreenshotSucceeded', (payload) => {
        resolve({ type: 'succeeded', ...payload });
      });
    });

    screenshotClient.socket.off('log', onLog);

    if (response.type === 'failed') {
      console.log('requestScreenshotFailed', response);
      setQuery({ logs, type: 'error', errors: response.errors });
      return;
    }

    console.log('requestScreenshotSucceeded');

    const screenshotSrcResult = await getScreenshotSrc(response);

    if (screenshotSrcResult.type === 'error') {
      setQuery({
        type: 'error',
        logs,
        errors: [{ message: screenshotSrcResult.error }],
      });
      return;
    }

    setQuery({ type: 'success', logs, src: screenshotSrcResult.src });
  };

  const snackbar = useSnackbar();

  const onCancel = () => {
    if (query.type === 'loading') {
      try {
        // this throws an error
        // query.abortController.abort();
      } finally {
        setQuery({ type: 'idle' });
        snackbar.enqueueSnackbar('cancelled screenshot request');
      }
    }
  };

  const error = query.type === 'error' ? query.errors : [];

  return (
    <>
      <Typography gutterBottom color="text.secondary">
        project
      </Typography>

      <ProjectInput projectId={projectId} onChange={setProjectId} />

      <Typography sx={{ mt: 2 }} gutterBottom color="text.secondary">
        target url
      </Typography>

      <TargetUrlInput targetUrl={targetUrl} setTargetUrl={setTargetUrl} />

      <Typography sx={{ mt: 2 }} gutterBottom color="text.secondary">
        image type
      </Typography>

      <ToggleButtonGroup
        value={imageType}
        onChange={(_event, value) => {
          if (value === 'png' || value === 'jpeg') {
            setImageType(value);
          }
        }}
        exclusive
        sx={{
          marginBottom: 2,
        }}
      >
        <ToggleButton value="png">PNG</ToggleButton>
        <ToggleButton value="jpeg">JPEG</ToggleButton>
      </ToggleButtonGroup>

      <Typography gutterBottom color="text.secondary">
        delay
      </Typography>

      <Select
        value={delaySec}
        onChange={(event) =>
          setDelaySec(toDelaySec(Number(event?.target.value ?? 0)))
        }
      >
        {All_DELAY_SEC.map((delaySec) => (
          <MenuItem value={delaySec} key={delaySec}>
            <ListItemText primary={`${delaySec} seconds`} />
          </MenuItem>
        ))}
      </Select>

      {error.length > 0 && (
        <Box sx={{ marginY: 2 }}>
          {error.map((error) => (
            <Alert
              key={error.message}
              severity="error"
              sx={{ marginBottom: 2 }}
            >
              <AlertTitle>Server Error</AlertTitle>
              {error.message}
            </Alert>
          ))}
        </Box>
      )}

      <LoadingButton
        startIcon={<PhotoCameraIcon />}
        fullWidth
        size="large"
        variant="contained"
        sx={{
          mt: 2,
        }}
        onClick={submit}
        loading={query.type === 'loading'}
      >
        take screenshot
      </LoadingButton>

      <LoadingButton
        startIcon={<Cancel />}
        fullWidth
        size="large"
        variant="contained"
        disabled={query.type !== 'loading'}
        sx={{
          mt: 2,
          mb: 4,
        }}
        onClick={onCancel}
      >
        cancel
      </LoadingButton>

      <Divider
        sx={{
          marginBottom: 4,
        }}
      />

      <Box sx={{ mb: 4 }}>
        {query.type === 'idle' && (
          <Typography color="disabled">no logs to show</Typography>
        )}

        {query.type !== 'idle' && (
          <Typography>
            {query.logs[query.logs.length - 1]?.message ?? 'no logs yet'}
          </Typography>
        )}
      </Box>

      <Screenshot
        state={query.type}
        alt={`screenshot of ${targetUrl}`}
        src={query.type === 'success' ? query.src : undefined}
      />

      <Button
        sx={{ mt: 4 }}
        fullWidth
        size="large"
        variant="contained"
        startIcon={<DownloadIcon />}
        title={targetUrl}
        disabled={query.type !== 'success'}
        {...(query.type === 'success'
          ? {
              href: query.src,
              download: query.src,
            }
          : {})}
      >
        Download Screenshot
      </Button>
    </>
  );
};

const Screenshot = ({
  alt,
  src,
  state,
  sx,
  ...props
}: {
  alt: string;
  src?: string;
  state: 'loading' | 'error' | 'success' | 'idle';
} & PaperProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        position: 'relative',
        height: '0',
        paddingTop: '75%',
        width: '100%',
        ...sx,
      }}
      {...props}
    >
      {state === 'success' && (
        <img
          src={src ?? ''}
          alt={alt}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {state === 'loading' && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Skeleton
            animation="wave"
            width="100%"
            height="100%"
            variant="rectangular"
          />
        </Box>
      )}

      {state === 'error' && (
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          color="text.secondary"
        >
          <BrokenImageIcon />
        </Box>
      )}
    </Paper>
  );
};
