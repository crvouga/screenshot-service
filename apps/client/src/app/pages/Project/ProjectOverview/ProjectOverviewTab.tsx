import { Container } from '@mui/material';
import { useProfileSingleOutletContext } from '../Project';
import { ProjectDeleteSection } from './ProjectDeleteSection';
import { ProjectIdSection } from './ProjectIdSection';
import { ProjectNameSection } from './ProjectNameSection';
import { ProjectWhitelistedUrlsSection } from './ProjectWhitelistedUrlsSection';

export const ProjectOverviewTab = () => {
  const { project } = useProfileSingleOutletContext();

  return (
    <Container maxWidth="sm">
      <ProjectIdSection project={project} />

      <ProjectWhitelistedUrlsSection project={project} />

      <ProjectNameSection project={project} />

      <ProjectDeleteSection projectId={project.projectId} />
    </Container>
  );
};
