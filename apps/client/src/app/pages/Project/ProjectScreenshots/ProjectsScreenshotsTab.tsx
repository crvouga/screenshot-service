import { Info } from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Skeleton,
  Typography,
} from '@mui/material';
import { IImageType } from '@screenshot-service/shared';
import { useQuery } from 'react-query';
import {
  useScreenshotsQuery,
  useScreenshotSrcQuery,
} from '../../../screenshots';
import { useProfileSingleOutletContext } from '../Project';

export const ProjectScreenshotsTab = () => {
  const { project } = useProfileSingleOutletContext();
  const query = useScreenshotsQuery(project);

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
            <Container maxWidth="md">
              <ImageList sx={{ width: '100%', height: '100%' }} cols={3}>
                {result.screenshots.map((screenshot) => (
                  <ImageListItem>
                    <ScreenshotImage
                      screenshotId={screenshot.screenshotId}
                      imageType={screenshot.imageType}
                    />
                    <ImageListItemBar
                      title={screenshot.targetUrl}
                      actionIcon={
                        <IconButton sx={{ color: 'rgba(255, 255, 255, 0.54)' }}>
                          <Info />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Container>
          );
      }
    }
  }
};

const ScreenshotImage = ({
  screenshotId,
  imageType,
}: {
  screenshotId: string;
  imageType: IImageType;
}) => {
  const query = useScreenshotSrcQuery({ screenshotId, imageType });

  return (
    <Box sx={{ position: 'relative', paddingTop: '100%' }}>
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
    </Box>
  );
};
