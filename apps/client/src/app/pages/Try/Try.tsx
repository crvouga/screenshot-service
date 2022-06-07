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
import * as ScreenshotService from '@screenshot-service/screenshot-service';
import { either, option } from 'fp-ts';
import * as React from 'react';
import useLocalStorage from '../../../lib/use-local-storage';
import { screenshotService } from '../../screenshot-service';
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

  const [state, setState] = React.useState(screenshotService.getState);
  const [requestId, setRequestId] =
    React.useState<ScreenshotService.Data.RequestId.RequestId | null>(null);

  React.useEffect(() => {
    const unsubscribe = screenshotService.subscribe(() => {
      setState(screenshotService.getState);
    });

    return unsubscribe;
  }, []);

  const submit = async () => {
    const validationResult = validateForm(form);

    if (either.isLeft(validationResult)) {
      setForm(mergeErrors(validationResult.left));
      return;
    }

    const decodedOrigin = ScreenshotService.Data.Url.decode(
      window.location.origin
    );

    if (either.isLeft(decodedOrigin)) {
      return;
    }

    const originUrl = decodedOrigin.right;

    if (state.type === 'Connected') {
      const requestId = ScreenshotService.Data.RequestId.generate();

      setRequestId(requestId);

      screenshotService.dispatch(
        ScreenshotService.CaptureScreenshotRequest.Action.Start({
          clientId: state.clientId,
          originUrl: originUrl,
          requestId: requestId,
          delaySec: form.values.delaySec,
          imageType: form.values.imageType,
          strategy: form.values.strategy,
          targetUrl: validationResult.right.targetUrl,
          projectId: validationResult.right.projectId,
        })
      );
    }
  };

  const onCancel = () => {
    if (requestId && state.type === 'Connected') {
      screenshotService.dispatch(
        ScreenshotService.CaptureScreenshotRequest.Action.Cancel(
          state.clientId,
          requestId
        )
      );
    }
  };

  const requestState =
    requestId && state.type === 'Connected'
      ? ScreenshotService.CaptureScreenshotRequest.toRequest(
          requestId,
          state.captureScreenshotRequest
        )
      : ScreenshotService.CaptureScreenshotRequest.initialRequestState;

  const problems =
    state.type === 'Connecting'
      ? [{ message: 'Connecting to server...' }]
      : requestState.type === 'Failed'
      ? requestState.problems
      : [];

  return (
    <>
      <Typography gutterBottom color="text.secondary">
        project
      </Typography>

      <ProjectInput
        projectId={form.values.projectId}
        setProjectId={(projectId) => {
          setForm(mergeValues({ projectId }));
          setForm(mergeErrors({ projectId: [] }));
        }}
        error={form.errors.projectId.length > 0}
        helperText={form.errors.projectId
          .map((error) => error.message)
          .join(', ')}
      />

      <Typography sx={{ mt: 2 }} gutterBottom color="text.secondary">
        target url
      </Typography>

      <TargetUrlInput
        targetUrl={form.values.targetUrl}
        setTargetUrl={(targetUrl) => {
          setForm(mergeValues({ targetUrl }));
          setForm(mergeErrors({ targetUrl: [] }));
        }}
        error={form.errors.targetUrl.length > 0}
        helperText={form.errors.targetUrl
          .map((error) => error.message)
          .join(', ')}
      />

      <Typography sx={{ mt: 2 }} gutterBottom color="text.secondary">
        image type
      </Typography>

      <ToggleButtonGroup
        value={form.values.imageType}
        onChange={(_event, value) => {
          if (ScreenshotService.Data.ImageType.is(value)) {
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
          const delaySec = ScreenshotService.Data.DelaySec.fromNumber(
            Number(event?.target.value ?? 0)
          );

          setForm(mergeValues({ delaySec }));
        }}
      >
        {ScreenshotService.Data.DelaySec.delaySecs.map((delaySec) => (
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
          if (ScreenshotService.Data.Strategy.is(value)) {
            setForm(mergeValues({ strategy: value }));
          }
        }}
        exclusive
        sx={{ mb: 2 }}
      >
        <ToggleButton value="cache-first">Cache First</ToggleButton>
        <ToggleButton value="network-first">Network First</ToggleButton>
      </ToggleButtonGroup>

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
        loading={requestState.type === 'Loading'}
        disabled={state.type === 'Connecting'}
      >
        capture screenshot
      </LoadingButton>

      <LoadingButton
        startIcon={<Cancel />}
        fullWidth
        size="large"
        variant="contained"
        loading={requestState.type === 'Cancelling'}
        disabled={
          requestState.type !== 'Loading' || state.type === 'Connecting'
        }
        onClick={onCancel}
      >
        cancel
      </LoadingButton>

      {problems.length > 0 && (
        <Box sx={{ marginY: 2 }}>
          {problems.map((problems) => (
            <Alert
              key={problems.message}
              severity="error"
              sx={{ marginBottom: 2 }}
            >
              <AlertTitle>Problem</AlertTitle>
              {problems.message}
            </Alert>
          ))}
        </Box>
      )}

      <Divider
        sx={{
          my: 4,
        }}
      />

      <Box sx={{ mb: 4 }}>
        <Typography>
          {requestState.logs[requestState.logs.length - 1]?.message ?? '...'}
        </Typography>
      </Box>

      <Screenshot
        stateType={requestState.type}
        alt={`screenshot of ${form.values.targetUrl}`}
        src={requestState.type === 'Succeeded' ? requestState.src : undefined}
      />

      <Button
        sx={{ mt: 4 }}
        fullWidth
        size="large"
        variant="contained"
        startIcon={<DownloadIcon />}
        title={form.values.targetUrl}
        disabled={requestState.type !== 'Succeeded'}
        {...(requestState.type === 'Succeeded'
          ? {
              href: requestState.src,
              download: requestState.src,
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
  stateType: ScreenshotService.CaptureScreenshotRequest.RequestState['type'];
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
    imageType: ScreenshotService.Data.ImageType.ImageType;
    delaySec: ScreenshotService.Data.DelaySec.DelaySec;
    projectId: option.Option<ScreenshotService.Data.ProjectId.ProjectId>;
    strategy: ScreenshotService.Data.Strategy.Strategy;
  };

  errors: {
    targetUrl: { message: string }[];
    projectId: { message: string }[];
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
  {
    targetUrl: ScreenshotService.Data.TargetUrl.TargetUrl;
    projectId: ScreenshotService.Data.ProjectId.ProjectId;
  }
> => {
  const decodedTargetUrl = ScreenshotService.Data.TargetUrl.decode(
    form.values.targetUrl
  );

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
      ? [{ message: 'Must select a project' }]
      : [],
    targetUrl: either.isLeft(decodedTargetUrl) ? [decodedTargetUrl.left] : [],
  };

  return either.left(errors);
};
