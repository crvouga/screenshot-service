import { Box } from '@mui/material';
import { useProfileSingleOutletContext } from '../Project';
import { ProjectRequestTable } from './ProjectRequestTable';
import { ProjectUsageLimit } from './ProjectUsageLimit';

export const ProjectUsageTab = () => {
  const { project } = useProfileSingleOutletContext();

  return (
    <Box sx={{ p: 2 }}>
      <ProjectUsageLimit projectId={project.projectId} />
      <ProjectRequestTable projectId={project.projectId} />
    </Box>
  )
};

