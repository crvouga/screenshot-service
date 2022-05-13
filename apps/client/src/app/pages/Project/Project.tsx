import { Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { useQuery } from 'react-query';
import {
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { Header } from '../../Header';
import * as Projects from '../../projects';
import { isMatch, routes } from '../../routes';
import { ErrorPage } from '../Error';
import { NotFoundPage } from '../NotFound';

export type IOutletContext = { project: Projects.IProject };

export const useProfileSingleOutletContext = () => {
  return useOutletContext<IOutletContext>();
};

export const ProjectPage = () => {
  const params = useParams();

  const projectId = params['id'];

  if (!projectId) {
    return <NotFoundPage message="missing project id from url" />;
  }

  return <ProjectPageWithParams projectId={projectId} />;
};

const ProjectPageWithParams = ({ projectId }: { projectId: string }) => {
  const query = useQuery(Projects.queryKeys.getOne({ projectId }), () =>
    Projects.getOne({ projectId })
  );

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

  if (result.type === 'error') {
    return (
      <>
        <ProjectSingleHeader title="..." />
        <ErrorPage
          message={`Something went wrong when loading project. ${result.error}`}
        />
      </>
    );
  }

  const { project } = result;

  const tabValues = {
    overview: 'overview',
    screenshots: 'screenshots',
    logs: 'logs',
  };

  const tabValue = isMatch(location.pathname, routes['/projects/:id'])
    ? tabValues.overview
    : isMatch(location.pathname, routes['/projects/:id/screenshots'])
    ? tabValues.screenshots
    : tabValues.overview;

  const outletContext: IOutletContext = { project };

  return (
    <>
      <ProjectSingleHeader title={project.name} />

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

        <Tab
          value={tabValues.logs}
          label="logs"
          // onClick={() => {
          //   navigate(routes["/projects/:id/try"].make(project.projectId));
          // }}
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
