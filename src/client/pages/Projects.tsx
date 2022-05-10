import { Create } from "@mui/icons-material";
import {
  List,
  Box,
  CircularProgress,
  Container,
  ListItem,
  ListItemText,
  Typography,
  ListItemButton,
  ListItemIcon,
  useTheme,
  Toolbar,
  Button,
} from "@mui/material";
import { useQuery } from "react-query";
import { definitions } from "../../shared/supabase-types";
import { useAuthUser } from "../Auth";
import { supabaseClient } from "../supabase";

export const ProjectsPage = () => {
  const authUser = useAuthUser();

  const query = useQuery(["projects", authUser.userId], () =>
    fetchProjects({ ownerId: authUser.userId })
  );

  const theme = useTheme();

  return (
    <Container maxWidth="sm">
      <Toolbar disableGutters>
        <Typography variant="h4">projects</Typography>
      </Toolbar>

      <List>
        <Button startIcon={<Create />} fullWidth variant="outlined">
          Create New
        </Button>

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
            {query.data.data.map((project) => (
              <ListItem key={project.projectId}>
                <ListItemText primary={project.name} />
              </ListItem>
            ))}

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
      </List>
    </Container>
  );
};

//
//
//
// Data Access
//
//
//

type IProject = {
  projectId: string;
  ownerId: string;
  name: string;
};

const fetchProjects = async ({
  ownerId,
}: {
  ownerId: string;
}): Promise<
  { type: "error"; error: string } | { type: "success"; data: IProject[] }
> => {
  const response = await supabaseClient
    .from<definitions["projects"]>("projects")
    .select("*")
    .match({ owner_id: ownerId });

  if (response.error) {
    return { type: "error", error: response.error.message };
  }

  return {
    type: "success",
    data: response.data.map((row) => ({
      projectId: row.id,
      ownerId: row.owner_id,
      name: row.name,
    })),
  };
};
