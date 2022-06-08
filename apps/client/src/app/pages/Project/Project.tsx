import { Data } from '@screenshot-service/screenshot-service';
import { Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material';

import {
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { Header } from '../../Header';
import { useSingleProjectQuery, Project } from '../../projects';
import { isMatch, routes } from '../../routes';
import { ErrorPage } from '../Error';
import { NotFoundPage } from '../NotFound';

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
  const location = useLocation();
  const navigate = useNavigate();

  if (!query.data) {
    return (
      <>
        <ProjectSingleHeader title="..." />
        <Box sx={{ p: 4, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  const result = query.data;

  if (result._tag === 'Left') {
    return (
      <>
        <ProjectSingleHeader title="..." />

        <ErrorPage
          message={`Something went wrong when loading project. ${result.left
            .map((error) => error.message)
            .join(', ')}`}
        />
      </>
    );
  }

  const project = result.right;

  const tabValues = {
    overview: 'overview',
    screenshots: 'screenshots',
  } as const;

  const tabValue = isMatch(location.pathname, routes['/projects/:id'])
    ? tabValues.overview
    : isMatch(location.pathname, routes['/projects/:id/screenshots'])
    ? tabValues.screenshots
    : tabValues.overview;

  const outletContext: OutletContext = { project };

  return (
    <>
      <ProjectSingleHeader title={project.projectName} />

      <Tabs value={tabValue} sx={{ marginBottom: 4 }}>
        <Tab
          value={tabValues.overview}
          label="overview"
          onClick={() => {
            navigate(routes['/projects/:id'].make(project.projectId));
          }}
        />

        <Tab
          value={tabValues.screenshots}
          label="screenshots"
          onClick={() => {
            navigate(
              routes['/projects/:id/screenshots'].make(project.projectId)
            );
          }}
        />
      </Tabs>

      <Outlet context={outletContext} />
    </>
  );
};

const ProjectSingleHeader = ({ title }: { title: string }) => (
  <Header
    breadcrumbs={[<Typography color="text.primary">{title}</Typography>]}
  />
);
