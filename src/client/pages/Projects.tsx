import { ChevronRight, Create } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardHeader,
  CircularProgress,
  Container,
  Grid,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { useAuthUser } from "../auth";
import { Header } from "../Header";
import * as Projects from "../projects";
import { routes } from "../routes";

export const ProjectsPage = () => {
  const authUser = useAuthUser();

  const query = useQuery(
    Projects.queryKeys.getAll({ ownerId: authUser.userId }),
    () => Projects.getAll({ ownerId: authUser.userId })
  );

  const theme = useTheme();

  return (
    <>
      <Header breadcrumbs={[<Typography>projects</Typography>]} />

      <Box sx={{ display: "flex", width: "100%", marginY: 2 }}>
        <Box sx={{ flex: 1 }} />
        <Link to={routes["/projects/create"].make()}>
          <Button startIcon={<Create />} variant="contained">
            Create New
          </Button>
        </Link>
      </Box>

      {query.status === "loading" && (
        <>
          <Box
            sx={{
              width: "100%",
              padding: 8,
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        </>
      )}

      {query.status === "success" && query.data.type === "success" && (
        <>
          <Grid container>
            {query.data.data.map((project) => (
              <Grid
                xs={6}
                item
                key={project.projectId}
                sx={{ height: "100%", p: 1 }}
              >
                <Link to={routes["/projects/:id"].make(project.projectId)}>
                  <CardActionArea>
                    <Card sx={{ height: "100%" }}>
                      <CardHeader
                        title={project.name}
                        action={<ChevronRight />}
                      />
                    </Card>
                  </CardActionArea>
                </Link>
              </Grid>
            ))}
          </Grid>

          {query.data.data.length === 0 && (
            <Box
              sx={{
                width: "100%",
                p: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography color="text.secondary">
                Didn't find any projects.
              </Typography>
            </Box>
          )}
        </>
      )}
    </>
  );
};