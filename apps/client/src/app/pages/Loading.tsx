import { CameraAlt } from '@mui/icons-material';
import { Box, CircularProgress } from '@mui/material';

export const BrandedLoadingPage = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <CameraAlt sx={{ width: 72, height: 72 }} />
    </Box>
  );
};

export const LoadingPage = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  );
};
