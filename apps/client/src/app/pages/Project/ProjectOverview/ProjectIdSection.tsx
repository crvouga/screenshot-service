import { Box, Paper, Typography } from '@mui/material';
import { CopyToClipboardField } from '../../../../lib/Clipboard';
import * as Projects from '../../../projects';

export const ProjectIdSection = ({
  project,
}: {
  project: Projects.IProject;
}) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 4,
      }}
    >
      <Typography variant="h6">project id</Typography>

      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        use this project id to get access to the backend api
      </Typography>

      <Box sx={{ mb: 2 }}>
        <CopyToClipboardField text={project.projectId} />
      </Box>
    </Paper>
  );
};
