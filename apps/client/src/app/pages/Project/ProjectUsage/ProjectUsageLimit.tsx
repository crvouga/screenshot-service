import { Refresh } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Alert, Box, LinearProgress, Paper, Typography } from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { getToday, toRateLimitErrorMessage } from '@screenshot-service/shared';
import { useQuery } from '@tanstack/react-query';
import { dataAccess, useConfigurationContext } from '../../../data-access';



export const ProjectUsageLimit = ({ projectId }: { projectId: Data.ProjectId.ProjectId }) => {
    const { configuration } = useConfigurationContext()

    const query = useQuery([projectId, 'usage'], () => {
        const dateRange = getToday()
        return dataAccess.captureScreenshotRequest.countCreatedBetween({ dateRange, projectId })
    })

    const maxCount = configuration.maxDailyRequests

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
                    api requests
                </Typography>
                <Typography color="text.secondary" >
                    {count} / {maxCount}
                </Typography>
            </Box>
            <LinearProgress sx={{ height: 15 }} variant={'determinate'} value={percentage} />
            {count === maxCount && <Alert severity="warning" sx={{ marginTop: 2 }}>
                {toRateLimitErrorMessage(configuration)}
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

