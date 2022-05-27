import {
  All_DELAY_SEC,
  castTargetUrl,
  generateRequestId,
  IDelaySec,
  IErrors,
  IImageType,
  ILogLevel,
  IProjectId,
  IRequestId,
  isStrategy,
  IStrategy,
  ScreenshotRequest,
  ToClient,
  toDelaySec,
  ToServer,
} from '@crvouga/screenshot-service';
import { Cancel } from '@mui/icons-material';
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
import useLocalStorage from '../../../lib/use-local-storage';
import { screenshotClient } from '../../screenshot-service';
import { getScreenshotSrc } from '../../screenshots';
import { ProjectInput } from './ProjectInput';
import { TargetUrlInput } from './TargetUrlInput';

type ILog = { level: ILogLevel; message: string };

type IQueryState =
  | { type: 'idle' }
  | { type: 'loading'; logs: ILog[]; requestId: IRequestId }
  | { type: 'error'; errors: IErrors; logs: ILog[] }
  | { type: 'success'; src: string; logs: ILog[] };

export const TryPage = () => {
  const [targetUrl, setTargetUrl] = useLocalStorage<string>('targetUrl', '');
  const [imageType, setImageType] = useState<IImageType>('jpeg');
  const [delaySec, setDelaySec] = useState<IDelaySec>(0);
  const [projectId, setProjectId] = useLocalStorage<IProjectId | null>(
    'projectId',
    null
  );
  const [strategy, setStrategy] = useState<IStrategy>('cache-first');
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
    const requestId = generateRequestId();

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

    const request: ScreenshotRequest = {
      strategy: strategy,
      requestId: requestId,
      projectId: projectId,
      targetUrl: targetUrlResult.data,
      imageType: imageType,
      delaySec: delaySec,
    };

    setQuery({ type: 'loading', logs: [], requestId: request.requestId });

    screenshotClient.toServer(ToServer.RequestScreenshot(request));
  };

  const snackbar = useSnackbar();

  React.useEffect(() => {
    const unsub = screenshotClient.fromServer(async (action) => {
      if (action.type === 'Log') {
        appendLog(action.payload);
        return;
      }

      if (ToClient.RequestScreenshotSucceeded.match(action)) {
        const result = await getScreenshotSrc({
          screenshotId: action.payload.screenshotId,
          imageType: action.payload.imageType,
        });
        if (result.type === 'success') {
          setQuery({ type: 'success', logs: [], src: result.src });
        }
        return;
      }

      if (ToClient.CancelRequestSucceeded.match(action)) {
        snackbar.enqueueSnackbar('Cancelled request');
      }

      if (ToClient.RequestScreenshotFailed.match(action)) {
        setQuery({ type: 'error', errors: action.payload.errors, logs: [] });
      }
    });
    return () => {
      unsub();
    };
  }, []);

  const onCancel = () => {
    setQuery({ type: 'idle' });
    if (query.type === 'loading') {
      screenshotClient.toServer(
        ToServer.CancelRequestScreenshot(query.requestId)
      );
    }
  };

  const error = query.type === 'error' ? query.errors : [];

  return (
    <>
      <Typography gutterBottom color="text.secondary">
        project
      </Typography>

      <ProjectInput projectId={projectId} setProjectId={setProjectId} />

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

      <Typography sx={{ mt: 2 }} gutterBottom color="text.secondary">
        strategy
      </Typography>

      <ToggleButtonGroup
        value={strategy}
        onChange={(_event, value) => {
          if (isStrategy(value)) {
            setStrategy(value);
          }
        }}
        exclusive
        sx={{ mb: 2 }}
      >
        <ToggleButton value="cache-first">Cache First</ToggleButton>
        <ToggleButton value="network-first">Network First</ToggleButton>
      </ToggleButtonGroup>

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

      <Divider
        sx={{
          my: 4,
        }}
      />

      <LoadingButton
        startIcon={<PhotoCameraIcon />}
        fullWidth
        size="large"
        variant="contained"
        sx={{
          mb: 2,
        }}
        onClick={submit}
        loading={query.type === 'loading'}
      >
        capture screenshot
      </LoadingButton>

      <LoadingButton
        startIcon={<Cancel />}
        fullWidth
        size="large"
        variant="contained"
        disabled={query.type !== 'loading'}
        onClick={onCancel}
      >
        cancel
      </LoadingButton>

      <Divider
        sx={{
          my: 4,
        }}
      />

      <Box sx={{ mb: 4 }}>
        {query.type === 'idle' && <Typography color="disabled">...</Typography>}

        {query.type !== 'idle' && (
          <Typography>
            {query.logs[query.logs.length - 1]?.message ?? '...'}
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
