import { Box, Paper, Typography } from '@mui/material';
import { CopyToClipboardField } from '../../../../lib/Clipboard';
import { Project } from '../../../data-access';

export const ProjectIdSection = ({ project }: { project: Project }) => {
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
        you will need this project id to make api requests
      </Typography>

      <Box sx={{ mb: 2 }}>
        <CopyToClipboardField text={project.projectId} />
      </Box>
    </Paper>
  );
};
