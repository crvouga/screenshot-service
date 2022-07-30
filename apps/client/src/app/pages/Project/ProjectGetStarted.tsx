import { Launch } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useConfigurationContext } from '../../data-access';


export const ProjectGetStarted = () => {
  const { configuration } = useConfigurationContext()
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 4,
      }}
    >
      <Typography variant="h6">get started</Typography>

      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        get started using the screenshot service in your website by installing the client library
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: "row-reverse" }}>
        <Button
          startIcon={<Launch />}
          variant="contained"
          target={"_blank"}
          rel={"noreferrer noopener"}
          href={configuration.clientLibraryUrl}
        >
          Install Library
        </Button>
      </Box>
    </Paper>
  );
};
