import { LoadingButton } from '@mui/lab';
import { Alert, Paper, Typography, Box, LinearProgress } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { Data } from '@screenshot-service/screenshot-service';
import { getToday, configuration, CAPTURE_SCREENSHOT_RATE_LIMIT_ERROR_MESSAGE } from '@screenshot-service/shared';
import { useQuery } from '@tanstack/react-query';
import { dataAccess } from '../../../data-access';



export const ProjectUsageLimit = ({ projectId }: { projectId: Data.ProjectId.ProjectId }) => {
    const query = useQuery([projectId, 'request-count'], () => {
        const dateRange = getToday()
        return dataAccess.captureScreenshotRequest.countCreatedBetween({ dateRange, projectId })
    })

    const maxCount = configuration.MAX_DAILY_CAPTURE_SCREENSHOT_REQUESTS

    const count = query.status === 'success' && query.data.type === 'Ok' ? Math.min(query.data.value, maxCount) : 0

    const percentage = (count / maxCount) * 100


    return (

        <Paper sx={{ p: 2, marginBottom: 4 }}>
            <Box sx={{ marginBottom: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ flex: 1 }}>
                    Usage (Today)
                </Typography>

            </Box>

            <Box sx={{ marginBottom: 1, display: 'flex', alignItems: 'center' }}>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                    Capture Screenshot Requests
                </Typography>
                <Typography color="text.secondary" >
                    {count} / {configuration.MAX_DAILY_CAPTURE_SCREENSHOT_REQUESTS}
                </Typography>
            </Box>
            <LinearProgress sx={{ height: 15 }} variant={'determinate'} value={percentage} />
            {count === maxCount && <Alert severity="warning" sx={{ marginTop: 2 }}>
                {CAPTURE_SCREENSHOT_RATE_LIMIT_ERROR_MESSAGE}
            </Alert>}

            <Box sx={{ marginTop: 2, display: "flex" }}>
                <Box sx={{ flex: 1 }} />
                <LoadingButton loading={query.isRefetching} onClick={() => query.refetch()} startIcon={<Refresh />} variant="contained" >
                    Refresh
                </LoadingButton>
            </Box>
        </Paper>

    )
};

