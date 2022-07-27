import { Box, CircularProgress, Divider, Tab, Tabs } from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import {
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { Header } from '../../components/Header';
import { NotFoundPage } from '../../components/NotFound';
import { Project, useSingleProjectQuery } from '../../data-access';
import { isMatch, routes } from '../../routes';
import { ErrorPage } from '../Error';

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
            .map((error) => error.message)
            .join(', ')}`}
        />
      </>
    );
  }

  const project = result.value;

  const tabValues = {
    overview: 'overview',
    usage: 'usage',
  } as const;

  const tabValue = isMatch(location.pathname, routes['/projects/:id'])
    ? tabValues.overview
    : isMatch(location.pathname, routes['/projects/:id/usage'])
      ? tabValues.usage
      : tabValues.overview;

  const outletContext: OutletContext = { project };

  return (
    <>
      <Header />

      <Tabs value={tabValue}>
        <Tab
          value={tabValues.overview}
          label="overview"
          onClick={() => {
            navigate(routes['/projects/:id'].make(project.projectId));
          }}
        />

        <Tab
          value={tabValues.usage}
          label="usage"
          onClick={() => {
            navigate(
              routes['/projects/:id/usage'].make(project.projectId)
            );
          }}
        />
      </Tabs>

      <Divider />

      <Outlet context={outletContext} />
    </>
  );
};
