import { CameraAlt, ChevronRight, Create } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuthUser } from '../authentication';
import { CreateProjectCallToAction } from '../components/CreateProjectCallToAction';
import { Header } from '../components/Header';
import { useConfigurationContext, useProjectsQuery } from '../data-access';
import { routes } from '../routes';

export const ProjectsPage = () => {
  const { configuration } = useConfigurationContext();
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
              <Box
                sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}
              >
                <Link
                  style={{ display: 'flex', alignItems: 'center' }}
                  to={routes['/projects/create'].make()}
                >
                  <Button startIcon={<Create />} variant="contained">
                    Create New
                  </Button>
                </Link>
                <Box sx={{ flex: 1 }} />
                <Typography color="text.secondary">
                  {query.data.value.length} / {configuration.maxProjectCount}{' '}
                  projects
                </Typography>
              </Box>

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
