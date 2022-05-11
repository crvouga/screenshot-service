import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';
import { IImageType } from '@screenshot-service/shared';
import { useQuery } from 'react-query';
import * as Screenshots from '../screenshots';
import { useProfileSingleOutletContext } from './ProjectsSingle';

export const ProjectSingleScreenshotsPage = () => {
  const { project } = useProfileSingleOutletContext();

  const query = useQuery(
    Screenshots.queryKeys.findManyByProjectId(project),
    () => Screenshots.findManyByProjectId(project)
  );

  switch (query.status) {
    case 'error':
      return <Typography>Failed to load screenshots</Typography>;

    case 'idle':
      return (
        <Box sx={{ p: 8, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      );

    case 'loading':
      return (
        <Box sx={{ p: 8, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      );

    case 'success': {
      const result = query.data;

      switch (result.type) {
        case 'error':
          return (
            <Typography>Failed to load screenshots: {result.error}</Typography>
          );

        case 'success':
          return (
            <Container maxWidth="sm">
              {result.screenshots.map((screenshot) => (
                <ScreenshotItem
                  key={screenshot.projectId}
                  screenshot={screenshot}
                />
              ))}
            </Container>
          );
      }
    }
  }
};

//
//
//
//
//
//
//
//
//

const ScreenshotItem = ({
  screenshot,
}: {
  screenshot: Screenshots.IScreenshot;
}) => {
  return (
    <Paper sx={{ mb: 2, display: 'flex' }}>
      <Box sx={{ width: '33.33%', minWidth: '33.33%' }}>
        <Box
          sx={{
            paddingTop: `${1 * 100}%`,
            position: 'relative',
          }}
        >
          <Screenshot
            screenshotId={screenshot.screenshotId}
            imageType={screenshot.imageType}
          />
        </Box>
      </Box>
      <Box
        sx={{
          p: 2,
          overflow: 'hidden',
        }}
      >
        <Field label="target url" value={screenshot.targetUrl} />
        <Field label="timeout ms" value={String(screenshot.timeoutMs)} />
        <Field label="image type" value={screenshot.imageType} />
      </Box>
    </Paper>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle1" color="text.secondary">
        {label}
      </Typography>
      <Typography
        component="div"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const Screenshot = ({
  screenshotId,
  imageType,
}: {
  screenshotId: string;
  imageType: IImageType;
}) => {
  const query = useQuery(
    Screenshots.queryKeys.screenshotSrc({ screenshotId }),
    () => Screenshots.getScreenshotSrc({ screenshotId, imageType })
  );

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {query.status === 'idle' && (
        <Skeleton variant="rectangular" width="100%" height="100%" />
      )}

      {query.status === 'loading' && (
        <Skeleton variant="rectangular" width="100%" height="100%" />
      )}

      {query.status === 'error' && (
        <Alert
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
          severity="error"
        >
          Failed to load screenshot
        </Alert>
      )}

      {query.status === 'success' && (
        <>
          {query.data.type === 'error' && (
            <Alert
              sx={{
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
              }}
              severity="error"
            >
              Failed to load screenshot
            </Alert>
          )}

          {query.data.type === 'success' && (
            <img
              alt="..."
              width="100%"
              height="100%"
              src={query.data.src}
              style={{ objectFit: 'cover' }}
            />
          )}
        </>
      )}
    </Box>
  );
};
