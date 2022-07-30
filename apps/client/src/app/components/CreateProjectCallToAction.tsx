import { Create } from '@mui/icons-material';
import {
    Button,
    Card,
    Typography
} from '@mui/material';
import { Link } from 'react-router-dom';
import { routes } from '../routes';

export const CreateProjectCallToAction = ({ onClickLink }: { onClickLink?: () => void }) => {
    return (
        <Card sx={{ width: '100%', textAlign: 'center', p: 4 }}>
            {/* <CameraAlt sx={{ width: 64, height: 64 }} /> */}

            <Typography align="center" variant="h4" sx={{ mb: 1 }}>
                You don't have any projects.
            </Typography>

            <Typography align="center" color="text.secondary" sx={{ mb: 2 }}>
                You have to create a project before capturing any screenshots
            </Typography>

            <Link
                to={routes['/projects/create'].make()}
                onClick={onClickLink}
            >
                <Button
                    fullWidth
                    startIcon={<Create />}
                    variant="contained"
                    size="large"
                >
                    create a new project
                </Button>
            </Link>
        </Card>
    );
};
