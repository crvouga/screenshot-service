import {
  All_DELAY_SEC,
  fetchScreenshot,
  IApiErrorBody,
  IDelaySec,
  IImageType,
  toDelaySec,
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
import { environment } from '../../../environments/environment';
import { TextFieldInput } from '../../../lib/TextFieldInput';
import { ProjectIdInput } from './ProjectIdInput';
import { TargetUrlInput } from './TargetUrlInput';

type IQueryState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; errors: IApiErrorBody }
  | { type: 'success'; src: string };

export const TryPage = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [imageType, setImageType] = useState<IImageType>('jpeg');
  const [delaySec, setDelaySec] = useState<IDelaySec>(0);
  const [projectId, setProjectId] = useState('');

  const [query, setQuery] = useState<IQueryState>({ type: 'idle' });

  const onFetch = async () => {
    setQuery({ type: 'loading' });

    const result = await fetchScreenshot(
      {
        targetUrl,
        imageType,
        delaySec: String(delaySec),
        projectId,
      },
      {
        overrides: environment.production
          ? {}
          : {
              baseUrl: 'http://localhost:8000',
            },
      }
    );

    setQuery(result);
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

      <ProjectIdInput
        onChange={(project) => {
          if (project) {
            setProjectId(project.projectId);
          }
        }}
      />

      <Typography sx={{ mt: 2 }} gutterBottom color="text.secondary">
        target url
      </Typography>

      <TargetUrlInput
        projectId={projectId}
        targetUrl={targetUrl}
        setTargetUrl={setTargetUrl}
      />

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
        onClick={onFetch}
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
