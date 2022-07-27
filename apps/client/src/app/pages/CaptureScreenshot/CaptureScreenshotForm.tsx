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
  CircularProgress,
  Collapse,
  Divider,
  ListItemText,
  MenuItem,
  Paper,
  PaperProps,
  Select,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import {
  CaptureScreenshotRequest,
  Data
} from '@screenshot-service/screenshot-service';
import { useEffect, useState } from 'react';
import { screenshotService } from '../../screenshot-service';
import { NotOnWhitelistAlert } from './NotOnWhitelistAlert';
import { ProjectInput } from './ProjectInput';
import { TargetUrlInput } from './TargetUrlInput';

//
//
//
//
//
//
//

export const CaptureScreenshotForm = () => {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [requestId, setRequestId] = useState<Data.RequestId.RequestId | null>(
    null
  );
  const [state, setState] = useState(screenshotService.getState);

  useEffect(() => {
    return screenshotService.subscribe(() => {
      setState(screenshotService.getState);
    });
  }, []);

  const submit = async () => {
    const validationResult = validateForm(form);

    if (Data.Result.isErr(validationResult)) {
      setForm(mergeErrors(validationResult.error));
      return;
    }

    const decodedOrigin = Data.Url.decode(window.location.origin);

    if (Data.Result.isErr(decodedOrigin)) {
      return;
    }

    const originUrl = decodedOrigin.value;

    if (state.type === 'Connected') {
      const requestId = Data.RequestId.generate();

      setRequestId(requestId);

      screenshotService.dispatch(
        CaptureScreenshotRequest.Action.Start({
          clientId: state.clientId,
          originUrl: originUrl,
          requestId: requestId,
          delaySec: form.values.delaySec,
          imageType: form.values.imageType,
          strategy: form.values.strategy,
          targetUrl: validationResult.value.targetUrl,
          projectId: validationResult.value.projectId,
        })
      );
    }
  };

  const onCancel = () => {
    if (requestId && state.type === 'Connected') {
      screenshotService.dispatch(
        CaptureScreenshotRequest.Action.Cancel(state.clientId, requestId)
      );
    }
  };

  const requestState =
    requestId && state.type === 'Connected'
      ? CaptureScreenshotRequest.toRequest(
        requestId,
        state.captureScreenshotRequest
      )
      : CaptureScreenshotRequest.initialRequestState;

  const problems =
    requestState.type === 'Failed'
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
        SelectProps={{
          error: form.errors.projectId.length > 0,
        }}
        helperText={form.errors.projectId
          .map((error) => error.message)
          .join(', ')}
      />

      <Typography sx={{ mt: 2 }} gutterBottom color="text.secondary">
        target url
      </Typography>

      <TargetUrlInput
        projectId={form.values.projectId}
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
        <ToggleButton value="CacheFirst">Cache First</ToggleButton>
        <ToggleButton value="NetworkFirst">Network First</ToggleButton>
      </ToggleButtonGroup>

      <Divider
        sx={{
          my: 4,
        }}
      />

      {form.values.projectId && (
        <NotOnWhitelistAlert projectId={form.values.projectId} />
      )}

      <Collapse in={state.type === 'Connecting'}>
        <Alert sx={{ marginBottom: 2, alignItems: "center" }} severity='warning' action={<CircularProgress disableShrink sx={{ marginRight: 1 }} size="1.2rem" />} >
          Connecting to server...
        </Alert>
      </Collapse>


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
  stateType: CaptureScreenshotRequest.RequestState['type'];
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
    projectId: Data.ProjectId.ProjectId | null;
    targetUrl: string;
    imageType: Data.ImageType.ImageType;
    delaySec: Data.DelaySec.DelaySec;
    strategy: Data.Strategy.Strategy;
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
    projectId: null,
    strategy: 'NetworkFirst',
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
): Data.Result.Result<
  FormState['errors'],
  {
    targetUrl: Data.TargetUrl.TargetUrl;
    projectId: Data.ProjectId.ProjectId;
  }
> => {
  const decodedTargetUrl = Data.TargetUrl.decode(form.values.targetUrl);

  if (form.values.projectId && Data.Result.isOk(decodedTargetUrl)) {
    return Data.Result.Ok({
      projectId: form.values.projectId,
      targetUrl: decodedTargetUrl.value,
    });
  }

  const errors: FormState['errors'] = {
    projectId:
      form.values.projectId === null
        ? [{ message: 'Must select a project' }]
        : [],
    targetUrl: Data.Result.isErr(decodedTargetUrl)
      ? [decodedTargetUrl.error]
      : [],
  };

  return Data.Result.Err(errors);
};
