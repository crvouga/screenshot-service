import { IImageType } from '@screenshot-service/shared';
import {
  ListItemText,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  List,
  ListItem,
  Typography,
} from '@mui/material';
import { useQuery } from 'react-query';
import { useProfileSingleOutletContext } from './ProjectsSingle';
import * as Screenshots from '../screenshots';

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
    <Card sx={{ mb: 2 }}>
      <ScreenshotImage
        screenshotId={screenshot.screenshotId}
        imageType={screenshot.imageType}
      />
      <List>
        <ListItem>
          <ListItemText primary={screenshot.imageType} />
        </ListItem>
        <ListItem>
          <ListItemText
            primaryTypographyProps={{
              sx: { wordWrap: 'break-word' },
            }}
            primary={screenshot.targetUrl}
          />
        </ListItem>
      </List>
    </Card>
  );
};

const ScreenshotImage = ({
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

  switch (query.status) {
    case 'error':
      return <>"error"</>;

    case 'idle':
      return <>"idle"</>;

    case 'loading':
      return <>"loading"</>;

    case 'success': {
      const result = query.data;

      switch (result.type) {
        case 'error':
          return <>"error"</>;

        case 'success':
          return <img src={result.src} alt="screenshot" />;
      }
    }
  }
};
