import { HeadphonesRounded } from "@mui/icons-material";
import { CircularProgress, Tab, Tabs, Box, Typography } from "@mui/material";
import { useQuery } from "react-query";
import {
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { Header } from "../Header";
import * as Projects from "../projects";
import { isMatch, Link, routes } from "../routes";
import { ErrorPage } from "./Error";
import { LoadingPage } from "./Loading";
import { NotFoundPage } from "./NotFound";

export type IOutletContext = { project: Projects.IProject };

export const useProfileSingleOutletContext = () => {
  return useOutletContext<IOutletContext>();
};

export const ProjectsSinglePage = () => {
  const params = useParams();

  const projectId = params.id;

  if (!projectId) {
    return <NotFoundPage message="missing project id from url" />;
  }

  return <ProjectPage projectId={projectId} />;
};

const ProjectSingleHeader = ({ title }: { title: string }) => (
  <Header
    breadcrumbs={[
      <Link to={routes["/projects"].make()}>projects</Link>,
      <Typography color="text.primary">{title}</Typography>,
    ]}
  />
);

const ProjectPage = ({ projectId }: { projectId: string }) => {
  const query = useQuery(Projects.queryKeys.getOne({ projectId }), () =>
    Projects.getOne({ projectId })
  );

  const location = useLocation();
  const navigate = useNavigate();

  if (!query.data) {
    return (
      <>
        <ProjectSingleHeader title="..." />
        <Box sx={{ p: 4, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  const result = query.data;

  if (result.type === "error") {
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
    overview: "overview",
    tryIt: "tryIt",
  };

  const tabValue = isMatch(location.pathname, routes["/projects/:id/try"])
    ? tabValues.tryIt
    : tabValues.overview;

  const outletContext: IOutletContext = { project };

  return (
    <>
      <ProjectSingleHeader title={project.name} />

      <Tabs value={tabValue} variant="fullWidth">
        <Tab
          value={tabValues.overview}
          label="overview"
          onClick={() => {
            navigate(routes["/projects/:id"].make(project.projectId));
          }}
        />

        <Tab
          value={tabValues.tryIt}
          label="try it"
          onClick={() => {
            navigate(routes["/projects/:id/try"].make(project.projectId));
          }}
        />
      </Tabs>

      <Outlet context={outletContext} />
    </>
  );
};
