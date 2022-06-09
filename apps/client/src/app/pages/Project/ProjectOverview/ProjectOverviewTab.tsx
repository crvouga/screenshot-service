import { Box, Typography, Container } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useProfileSingleOutletContext } from '../Project';
import { ProjectDeleteSection } from './ProjectDeleteSection';
import { ProjectIdSection } from './ProjectIdSection';
import { ProjectNameSection } from './ProjectNameSection';
import { ProjectWhitelistedUrlsSection } from './ProjectWhitelistedUrlsSection';

export const ProjectOverviewTab = () => {
  const { project } = useProfileSingleOutletContext();

  return (
    <Box>
      <Box sx={{ paddingY: 4 }}>
        <Typography variant="h4" align="center">
          {project.projectName}
        </Typography>
      </Box>

      <Box
        sx={{ paddingBottom: 8, paddingTop: 4, backgroundColor: grey['200'] }}
      >
        <Container maxWidth="sm">
          <ProjectIdSection project={project} />

          <ProjectWhitelistedUrlsSection project={project} />

          <ProjectNameSection project={project} />

          <ProjectDeleteSection projectId={project.projectId} />
        </Container>
      </Box>
    </Box>
  );
};
