import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { Header } from "../Header";
import { isMatch, routes } from "../routes";

export type IOutletContext = {};

export const useHomeOutletContext = () => {
  return useOutletContext<IOutletContext>();
};

export const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabValues = {
    projects: "projects",
    tryIt: "tryIt",
  };

  const tabValue = tabValues.projects;

  const outletContext: IOutletContext = {};

  return (
    <>
      <Header breadcrumbs={[]} />

      <Box sx={{ display: "flex", marginTop: 8 }}>
        <CardActionArea
          onClick={() => {
            navigate(routes["/projects"].make());
          }}
        >
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography align="center" variant="h2">
                projects
              </Typography>
            </CardContent>
          </Card>
        </CardActionArea>

        <Box sx={{ p: 4 }}>
          <Typography>or</Typography>
        </Box>
        <CardActionArea
          onClick={() => {
            navigate(routes["/try"].make());
          }}
        >
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography align="center" variant="h2">
                try it
              </Typography>
            </CardContent>
          </Card>
        </CardActionArea>
      </Box>
    </>
  );
};
