import { CaptureScreenshot, Data } from '@crvouga/screenshot-service';
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
import { either, option } from 'fp-ts';
import * as React from 'react';
import useLocalStorage from '../../../lib/use-local-storage';
import { useScreenshotClient } from '../../screenshot-service';
import { ProjectInput } from './ProjectInput';
import { TargetUrlInput } from './TargetUrlInput';

//
//
//
//
//
//
//

export const TryPage = () => {
  const [form, setForm] = useLocalStorage<FormState>(
    'formState',
    initialFormState
  );

  const screenshotClient = useScreenshotClient();

  const captureState = screenshotClient.state.captureScreenshot;

  const submit = async () => {
    const validationResult = validateForm(form);

    if (either.isLeft(validationResult)) {
      setForm(mergeErrors(validationResult.left));
      return;
    }

    const request: CaptureScreenshot.Request = {
      requestId: Data.RequestId.generate(),
      delaySec: form.values.delaySec,
      imageType: form.values.imageType,
      strategy: form.values.strategy,
      targetUrl: validationResult.right.targetUrl,
      projectId: validationResult.right.projectId,
    };

    screenshotClient.dispatch(
      CaptureScreenshot.Action.ToServer.RequestScreenshot(request)
    );
  };

  const onCancel = () => {
    if (captureState.type === 'Loading') {
      screenshotClient.dispatch(
        CaptureScreenshot.Action.ToServer.CancelRequestScreenshot(
          captureState.requestId
        )
      );
    }
  };

  const errors = captureState.type === 'Failed' ? captureState.errors : [];

  return (
    <>
      <Typography gutterBottom color="text.secondary">
        project
      </Typography>

      <ProjectInput
        projectId={form.values.projectId}
        setProjectId={(projectId) => {
          setForm(mergeValues({ projectId }));
        }}
      />

      <Typography sx={{ mt: 2 }} gutterBottom color="text.secondary">
        target url
      </Typography>

      <TargetUrlInput
        targetUrl={form.values.targetUrl}
        setTargetUrl={(targetUrl) => {
          setForm(mergeValues({ targetUrl }));
        }}
      />

      <Typography sx={{ mt: 2 }} gutterBottom color="text.secondary">
        image type
      </Typography>

      <ToggleButtonGroup
        value={form.values.imageType}
        onChange={(_event, value) => {
          if (Data.ImageType.is(value)) {
            setForm(mergeValues({ imageType: value }));
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
        value={form.values.delaySec}
        onChange={(event) => {
          const delaySec = Data.DelaySec.fromNumber(
            Number(event?.target.value ?? 0)
          );

          setForm(mergeValues({ delaySec }));
        }}
      >
        {Data.DelaySec.delaySecs.map((delaySec) => (
          <MenuItem value={delaySec} key={delaySec}>
            <ListItemText primary={`${delaySec} seconds`} />
          </MenuItem>
        ))}
      </Select>

      <Typography sx={{ mt: 2 }} gutterBottom color="text.secondary">
        strategy
      </Typography>

      <ToggleButtonGroup
        value={form.values.strategy}
        onChange={(_event, value) => {
          if (Data.Strategy.is(value)) {
            setForm(mergeValues({ strategy: value }));
          }
        }}
        exclusive
        sx={{ mb: 2 }}
      >
        <ToggleButton value="cache-first">Cache First</ToggleButton>
        <ToggleButton value="network-first">Network First</ToggleButton>
      </ToggleButtonGroup>

      {errors.length > 0 && (
        <Box sx={{ marginY: 2 }}>
          {errors.map((error) => (
            <Alert
              key={error.message}
              severity="error"
              sx={{ marginBottom: 2 }}
            >
              <AlertTitle>Error</AlertTitle>
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
        loading={captureState.type === 'Loading'}
      >
        capture screenshot
      </LoadingButton>

      <LoadingButton
        startIcon={<Cancel />}
        fullWidth
        size="large"
        variant="contained"
        loading={captureState.type === 'Cancelling'}
        disabled={captureState.type !== 'Loading'}
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
        <Typography>
          {captureState.logs[captureState.logs.length - 1]?.message ?? '...'}
        </Typography>
      </Box>

      <Screenshot
        stateType={captureState.type}
        alt={`screenshot of ${form.values.targetUrl}`}
        src={captureState.type === 'Succeeded' ? captureState.src : undefined}
      />

      <Button
        sx={{ mt: 4 }}
        fullWidth
        size="large"
        variant="contained"
        startIcon={<DownloadIcon />}
        title={form.values.targetUrl}
        disabled={captureState.type !== 'Succeeded'}
        {...(captureState.type === 'Succeeded'
          ? {
              href: captureState.src,
              download: captureState.src,
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
  stateType,
  sx,
  ...props
}: {
  alt: string;
  src?: string;
  stateType: CaptureScreenshot.State['type'];
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
      {stateType === 'Succeeded' && (
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

      {stateType === 'Loading' && (
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

      {stateType === 'Failed' && (
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

//
//
//
//
//
//
//

type FormState = {
  values: {
    targetUrl: string;
    imageType: Data.ImageType.ImageType;
    delaySec: Data.DelaySec.DelaySec;
    projectId: option.Option<Data.ProjectId.ProjectId>;
    strategy: Data.Strategy.Strategy;
  };

  errors: {
    targetUrl: Error[];
    projectId: Error[];
  };
};

const initialFormState: FormState = {
  values: {
    targetUrl: '',
    imageType: 'jpeg',
    delaySec: 3,
    projectId: option.none,
    strategy: 'network-first',
  },
  errors: {
    targetUrl: [],
    projectId: [],
  },
};

const mergeValues =
  (valuesNew: Partial<FormState['values']>) =>
  (formState: FormState = initialFormState): FormState => {
    return {
      ...formState,
      values: {
        ...formState.values,
        ...valuesNew,
      },
    };
  };

const mergeErrors =
  (errorsNew: Partial<FormState['errors']>) =>
  (formState: FormState = initialFormState): FormState => {
    return {
      ...formState,
      errors: {
        ...formState.errors,
        ...errorsNew,
      },
    };
  };

const validateForm = (
  form: FormState
): either.Either<
  FormState['errors'],
  { targetUrl: Data.TargetUrl.TargetUrl; projectId: Data.ProjectId.ProjectId }
> => {
  const decodedTargetUrl = Data.TargetUrl.decode(form.values.targetUrl);

  if (
    option.isSome(form.values.projectId) &&
    either.isRight(decodedTargetUrl)
  ) {
    return either.right({
      projectId: form.values.projectId.value,
      targetUrl: decodedTargetUrl.right,
    });
  }

  const errors: FormState['errors'] = {
    projectId: option.isNone(form.values.projectId)
      ? [new Error('Must select a project')]
      : [],
    targetUrl: either.isLeft(decodedTargetUrl)
      ? [new Error('Target url must a valid url')]
      : [],
  };

  return either.left(errors);
};
