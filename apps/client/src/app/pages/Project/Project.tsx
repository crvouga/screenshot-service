import { Box, CircularProgress, Container, Typography } from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { useOutletContext, useParams } from 'react-router-dom';
import { Header } from '../../components/Header';
import { NotFoundPage } from '../../components/NotFound';
import { Project, useSingleProjectQuery } from '../../data-access';
import { ErrorPage } from '../Error';
import { ProjectGetStarted } from './ProjectGetStarted';
import { ProjectDeleteSection } from './ProjectOverview/ProjectDeleteSection';
import { ProjectIdSection } from './ProjectOverview/ProjectIdSection';
import { ProjectNameSection } from './ProjectOverview/ProjectNameSection';
import { ProjectWhitelistedUrlsSection } from './ProjectOverview/ProjectWhitelistedUrlsSection';
import { ProjectRequestTable } from './ProjectUsage/ProjectRequestTable';
import { ProjectUsageLimit } from './ProjectUsage/ProjectUsageLimit';

export type OutletContext = { project: Project };

export const useProfileSingleOutletContext = () => {
  return useOutletContext<OutletContext>();
};

export const ProjectPage = () => {
  const params = useParams();

  const projectId = params['id'];

  if (Data.ProjectId.is(projectId)) {
    return <ProjectPageWithParams projectId={projectId} />;
  }

  return <NotFoundPage message="missing a valid project id in url params" />;
};

const ProjectPageWithParams = ({
  projectId,
}: {
  projectId: Data.ProjectId.ProjectId;
}) => {
  const query = useSingleProjectQuery({ projectId });

  if (!query.data) {
    return (
      <>
        <Header />

        <Box sx={{ p: 4, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  const result = query.data;

  if (result.type === 'Err') {
    return (
      <>
        <Header />

        <ErrorPage
          message={`Something went wrong when loading project. ${result.error
            ?.map((error) => error.message)
            .join(', ')}`}
        />
      </>
    );
  }

  const [project] = result.value;

  if (!project) {
    return (
      <>
        <Header />

        <ErrorPage message={`Could not find project`} />
      </>
    );
  }

  return (
    <>
      <Header />

      <Box sx={{ paddingY: 4 }}>
        <Typography variant="h4" align="center">
          {project.projectName}
        </Typography>
      </Box>

      <Box sx={{ paddingBottom: 8 }}>
        <Container maxWidth="md">
          <ProjectGetStarted />

          <ProjectUsageLimit projectId={project.projectId} />

          <ProjectIdSection project={project} />

          <ProjectWhitelistedUrlsSection project={project} />

          <ProjectNameSection project={project} />

          <ProjectRequestTable projectId={project.projectId} />

          <ProjectDeleteSection
            projectName={project.projectName}
            projectId={project.projectId}
          />
        </Container>
      </Box>
    </>
  );
};
