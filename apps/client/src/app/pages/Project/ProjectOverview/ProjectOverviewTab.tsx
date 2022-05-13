import { Container } from '@mui/material';
import { useProfileSingleOutletContext } from '../Project';
import { ProjectApiKeysSection } from './ProjectApiKeysSection';
import { ProjectDeleteSection } from './ProjectDeleteSection';
import { ProjectNameSection } from './ProjectNameSection';
import { ProjectWhitelistedUrlsSection } from './ProjectWhitelistedUrlsSection';

export const ProjectOverviewTab = () => {
  const { project } = useProfileSingleOutletContext();

  return (
    <Container maxWidth="sm">
      <ProjectApiKeysSection project={project} />

      <ProjectWhitelistedUrlsSection project={project} />

      <ProjectNameSection project={project} />

      <ProjectDeleteSection projectId={project.projectId} />
    </Container>
  );
};
