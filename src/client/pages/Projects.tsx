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
    <Container maxWidth="sm">
      <Toolbar disableGutters sx={{ alignItems: "center" }}>
        <Typography variant="h4" sx={{ flex: 1 }}>
          projects
        </Typography>
        <Link to={routes["/projects/create"].make()}>
          <Button size="small" startIcon={<Create />} variant="contained">
            Create New
          </Button>
        </Link>
      </Toolbar>

      {query.status === "loading" && (
        <>
          <Box
            sx={{
              width: "100%",
              padding: 4,
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
    </Container>
  );
};
