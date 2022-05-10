import { LoadingButton } from "@mui/lab";
import {
  Box,
  Breadcrumbs,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import * as Projects from "../projects";
import { Link, routes } from "../routes";
import { ErrorPage } from "./Error";
import { LoadingPage } from "./Loading";
import { NotFoundPage } from "./NotFound";

export const ProjectsSinglePage = () => {
  const params = useParams();

  const projectId = params.id;

  if (!projectId) {
    return <NotFoundPage message="missing project id from url" />;
  }

  return <ProjectPage projectId={projectId} />;
};

const ProjectPage = ({ projectId }: { projectId: string }) => {
  const query = useQuery(Projects.queryKeys.getOne({ projectId }), () =>
    Projects.getOne({ projectId })
  );

  if (!query.data) {
    return <LoadingPage />;
  }

  const result = query.data;

  if (result.type === "error") {
    return (
      <ErrorPage
        message={`Something went wrong when loading project. ${result.error}`}
      />
    );
  }

  const { project } = result;

  return (
    <Container maxWidth="sm">
      <Toolbar disableGutters>
        <Breadcrumbs>
          <Link to={routes["/projects"].make()}>projects</Link>
          <Typography color="text.primary">{project.name}</Typography>
        </Breadcrumbs>
      </Toolbar>

      <List>
        <ListItemField label="project id" value={project.projectId} />
      </List>

      <ProjectNameSection project={project} />

      <DeleteProjectSection projectId={project.projectId} />
    </Container>
  );
};

const ListItemField = ({ label, value }: { label: string; value: string }) => {
  return (
    <ListItem disablePadding>
      <ListItemText
        primaryTypographyProps={{
          variant: "subtitle1",
          color: "text.secondary",
        }}
        primary={label}
        secondaryTypographyProps={{
          variant: "h6",
          color: "text.primary",
        }}
        secondary={value}
      />
    </ListItem>
  );
};

//
//
//
//
// Project Name
//
//
//
//

const ProjectNameSection = ({ project }: { project: Projects.IProject }) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState(project.name);

  const mutation = useMutation(Projects.update);

  const snackbar = useSnackbar();

  const onSave = async () => {
    const result = await mutation.mutateAsync({
      projectId: project.projectId,
      name,
    });

    switch (result.type) {
      case "error":
        snackbar.enqueueSnackbar("failed to update project name", {
          variant: "error",
        });
        return;

      case "success":
        snackbar.enqueueSnackbar("project updated", {
          variant: "success",
        });

        queryClient.invalidateQueries(Projects.queryFilter);

        return;
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        marginBottom: 4,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        project name
      </Typography>
      <TextField
        label="name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        fullWidth
        sx={{ marginBottom: 2 }}
      />
      <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
        <LoadingButton
          variant="contained"
          onClick={onSave}
          disabled={project.name === name}
          loading={mutation.status === "loading"}
        >
          save
        </LoadingButton>
      </Box>
    </Paper>
  );
};

//
//
//
//
// Delete Project
//
//
//
//

const DeleteProjectSection = ({ projectId }: { projectId: string }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const onCancel = () => {
    setOpen(false);
  };
  const navigate = useNavigate();
  const mutation = useMutation(Projects.remove);
  const snackbar = useSnackbar();

  const onDelete = async () => {
    const response = await mutation.mutateAsync({ projectId });

    switch (response.type) {
      case "error":
        snackbar.enqueueSnackbar("failed to delete project", {
          variant: "error",
        });
        return;

      case "success":
        snackbar.enqueueSnackbar("project deleted", { variant: "success" });
        navigate(routes["/projects"].make());
    }
  };
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px ${theme.palette.error.main} solid`,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        delete project forever
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
        <Button variant="contained" color="error" onClick={() => setOpen(true)}>
          delete
        </Button>
      </Box>
      <Dialog open={open} onClose={onCancel}>
        <DialogTitle>delete project forever?</DialogTitle>
        <DialogActions>
          <Button color="inherit" onClick={onCancel}>
            cancel
          </Button>
          <LoadingButton
            variant="contained"
            onClick={onDelete}
            color="error"
            loading={mutation.status === "loading"}
          >
            delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
