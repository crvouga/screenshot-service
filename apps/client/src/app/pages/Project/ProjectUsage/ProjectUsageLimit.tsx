import { Typography, Box, LinearProgress } from '@mui/material';
import { Data } from '@screenshot-service/screenshot-service';
import { getDateRangeToday, configuration } from '@screenshot-service/shared';
import { useQuery } from '@tanstack/react-query';
import { dataAccess } from '../../../data-access';



export const ProjectUsageLimit = ({ projectId }: { projectId: Data.ProjectId.ProjectId }) => {
    const query = useQuery([projectId, 'request-count'], () => {
        const dateRange = getDateRangeToday()
        return dataAccess.captureScreenshotRequest.countCreatedBetween({ dateRange, projectId })
    })


    const count = query.status === 'success' && query.data.type === 'Ok' ? query.data.value : 0

    const percentage = (count / configuration.freePlan.MAX_DAILY_CAPTURE_SCREENSHOT_REQUESTS) * 100


    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
                Usage (Today)
            </Typography>


            <Box sx={{ marginBottom: 1, display: 'flex', alignItems: 'center' }}>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                    Capture Screenshot Requests
                </Typography>
                <Typography color="text.secondary" >
                    {count} / {configuration.freePlan.MAX_DAILY_CAPTURE_SCREENSHOT_REQUESTS}
                </Typography>
            </Box>
            <LinearProgress sx={{ height: 24 }} variant={'determinate'} value={percentage} />

        </Box>
    )
};

