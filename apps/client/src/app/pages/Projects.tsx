import { CameraAlt, ChevronRight, Create } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CircularProgress,
  Container,
  Typography
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuthUser } from '../authentication';
import { Header } from '../components/Header';
import { useProjectsQuery } from '../data-access';
import { routes } from '../routes';

export const ProjectsPage = () => {
  const authUser = useAuthUser();
  const query = useProjectsQuery({ ownerId: authUser.userId });

  return (
    <>
      <Header />

      {query.status === 'loading' && (
        <Box
          sx={{
            width: '100%',
            padding: 12,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {query.status === 'success' && query.data.type === 'Ok' && (
        <>
          {query.data.value.length === 0 && <CreateProjectCallToAction />}

          {query.data.value.length > 0 && (
            <Container sx={{ mt: 2 }} maxWidth="sm">
              <Link to={routes['/projects/create'].make()}>
                <Button
                  startIcon={<Create />}
                  variant="contained"
                  sx={{ mb: 2 }}
                >
                  Create New
                </Button>
              </Link>

              {query.data.value.map((project) => (
                <Box key={project.projectId} sx={{ mb: 2 }}>
                  <Link to={routes['/projects/:id'].make(project.projectId)}>
                    <CardActionArea>
                      <Card
                        sx={{ display: 'flex', p: 4, alignItems: 'center' }}
                      >
                        <Typography sx={{ flex: 1 }} variant="h5">
                          {project.projectName}
                        </Typography>
                        <ChevronRight />
                      </Card>
                    </CardActionArea>
                  </Link>
                </Box>
              ))}
            </Container>
          )}
        </>
      )}
    </>
  );
};

const CreateProjectCallToAction = () => {
  return (
    <Container maxWidth="sm">
      <Card sx={{ width: '100%', my: 4 }}>
        <Container maxWidth="xs" sx={{ py: 4, textAlign: 'center' }}>
          <CameraAlt sx={{ width: 72, height: 72 }} />

          <Typography variant="h4" align="center" sx={{ mb: 3 }}>
            You don't have any projects.
          </Typography>

          <Link to={routes['/projects/create'].make()}>
            <Button
              fullWidth
              startIcon={<Create />}
              variant="contained"
              size="large"
            >
              create a project
            </Button>
          </Link>
        </Container>
      </Card>
    </Container>
  );
};
