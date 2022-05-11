import { Box, CircularProgress, Container, Typography } from '@mui/material';
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
            <Typography>
              {JSON.stringify(result.screenshots, null, 5)}
            </Typography>
          );
      }
    }
  }
};
