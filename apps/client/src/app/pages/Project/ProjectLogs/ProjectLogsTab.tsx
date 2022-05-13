import { Box, Alert, Container, Typography } from '@mui/material';
import { definitions, IProjectLog } from '@screenshot-service/shared';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { supabaseClient } from '../../../supabase';
import { useProfileSingleOutletContext } from '../Project';

export const ProjectLogsTab = () => {
  const { project } = useProfileSingleOutletContext();

  const projectLogs = useProjectLogs(project);

  return (
    <Container maxWidth="sm">
      {projectLogs.map((log) => (
        <Box key={log.id} sx={{ mb: 1 / 2 }}>
          <LogAlert log={log} />
        </Box>
      ))}
    </Container>
  );
};

const LogAlert = ({ log }: { log: IProjectLog }) => {
  switch (log.logLevel) {
    case 'error':
      return <Alert severity="error">{log.message}</Alert>;

    case 'info':
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {log.message}
          </Typography>
        </Box>
      );

    case 'notice':
      return <Alert severity="info">{log.message}</Alert>;

    case 'warn':
      return <Alert severity="warning">{log.message}</Alert>;
  }
};

const toLog = (row: definitions['project_logs']): IProjectLog => {
  return {
    id: row.id,
    projectId: row.project_id,
    requestId: row.request_id,
    logLevel: row.log_level,
    message: row.message,
  };
};

export const useProjectLogs = ({ projectId }: { projectId: string }) => {
  const [projectLogs, setProjectLogs] = useState<IProjectLog[]>([]);

  useEffect(() => {
    supabaseClient
      .from<definitions['project_logs']>('project_logs')
      .select('*')
      .match({ project_id: projectId })
      .limit(25)
      .then((response) => {
        if (response.data) {
          setProjectLogs(response.data.map(toLog));
        }
      });

    const subscription = supabaseClient
      .from<definitions['project_logs']>(
        `project_logs:project_id=eq.${projectId}`
      )
      .on('*', (payload) => {
        setProjectLogs((logs) => [
          {
            id: payload.new.id,
            projectId: payload.new.project_id,
            requestId: payload.new.request_id,
            logLevel: payload.new.log_level,
            message: payload.new.message,
          },
          ...logs,
        ]);
      })
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return projectLogs;
};
